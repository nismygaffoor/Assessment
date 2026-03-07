import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Save, Bold, Italic, List, ListOrdered, Heading1, Heading2, Code, Loader2, Clock, Wifi, WifiOff } from 'lucide-react';
import api from '../api/axios';
import { connectSocket, disconnectSocket, getSocket } from '../api/socket';

const ToolbarButton = ({ onClick, isActive, title, children }) => (
    <button
        onMouseDown={(e) => { e.preventDefault(); onClick(); }}
        title={title}
        className={`p-1.5 rounded transition-all text-sm font-medium ${isActive ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
    >
        {children}
    </button>
);

const MenuBar = ({ editor }) => {
    if (!editor) return null;
    return (
        <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-slate-100 bg-white sticky top-0 z-10">
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold"><Bold size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic"><Italic size={15} /></ToolbarButton>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet List"><List size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Ordered List"><ListOrdered size={15} /></ToolbarButton>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 size={15} /></ToolbarButton>
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 size={15} /></ToolbarButton>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code"><Code size={15} /></ToolbarButton>
        </div>
    );
};

const InlineNoteEditor = ({ note, onSave, currentUser }) => {
    const [title, setTitle] = useState('');
    const [saveStatus, setSaveStatus] = useState('idle');
    const [activeUsers, setActiveUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const autoSaveTimer = useRef(null);
    const isRemoteUpdate = useRef(false);
    const currentNoteId = useRef(null);

    const editor = useEditor({
        extensions: [StarterKit],
        content: '',
        editorProps: {
            attributes: { class: 'outline-none min-h-[300px] p-6 text-slate-800 text-sm leading-relaxed' },
        },
        onUpdate: ({ editor }) => {
            if (isRemoteUpdate.current) return;
            setSaveStatus('idle');
            // Broadcast to socket room
            const socket = getSocket();
            if (socket.connected && currentNoteId.current) {
                socket.emit('note-change', {
                    noteId: currentNoteId.current,
                    content: editor.getHTML(),
                    title,
                });
            }
            // Auto-save
            clearTimeout(autoSaveTimer.current);
            autoSaveTimer.current = setTimeout(() => handleSave(true), 2000);
        },
    });

    // Connect to socket and join note room when note changes
    useEffect(() => {
        const socket = connectSocket();
        const token = localStorage.getItem('token');

        const setupSocket = () => {
            setIsConnected(true);
            if (note?._id) {
                socket.emit('join-note', { noteId: note._id, token });
                currentNoteId.current = note._id;
            }
        };

        // Handle incoming real-time updates from other users
        const handleNoteUpdate = ({ content, title: remoteTitle, from }) => {
            if (from === currentUser?.id || from === currentUser?._id) return;
            isRemoteUpdate.current = true;
            if (content && editor) {
                const { from: pos, to } = editor.state.selection;
                editor.commands.setContent(content, false);
                // Try to restore cursor position
                try { editor.commands.setTextSelection({ from: pos, to }); } catch { }
            }
            if (remoteTitle) setTitle(remoteTitle);
            isRemoteUpdate.current = false;
        };

        socket.on('connect', setupSocket);
        socket.on('note-update', handleNoteUpdate);
        socket.on('user-joined', ({ userId }) => setActiveUsers(prev => [...new Set([...prev, userId])]));
        socket.on('user-left', ({ userId }) => setActiveUsers(prev => prev.filter(id => id !== userId)));

        if (socket.connected) setupSocket();

        return () => {
            clearTimeout(autoSaveTimer.current);
            if (note?._id) socket.emit('leave-note', { noteId: note._id });
            socket.off('connect', setupSocket);
            socket.off('note-update', handleNoteUpdate);
            socket.off('user-joined');
            socket.off('user-left');
        };
    }, [note?._id]);

    // Load note content when note changes
    useEffect(() => {
        if (note) {
            setTitle(note.title || '');
            editor?.commands.setContent(note.content || '');
        } else {
            setTitle('');
            editor?.commands.setContent('');
        }
        setSaveStatus('idle');
        setActiveUsers([]);
    }, [note?._id]);

    const handleSave = useCallback(async (isAutoSave = false) => {
        if (!title.trim()) {
            if (!isAutoSave) setSaveStatus('error-title');
            return;
        }
        const content = editor?.getHTML();
        if (!content || content === '<p></p>') return;
        setSaveStatus('saving');
        try {
            if (note?._id) {
                const res = await api.put(`/notes/${note._id}`, { title, content });
                // Pass the updated note back so Dashboard can refresh the history array
                onSave?.(res.data);
            } else {
                const res = await api.post('/notes', { title, content });
                onSave?.(res.data);
            }
            setTimeout(() => setSaveStatus('idle'), 3000);
        } catch (err) {
            console.error('Save error:', err.response?.data || err.message);
            setSaveStatus('error');
        }
    }, [title, editor, note?._id]);

    const handleTitleChange = (e) => {
        setTitle(e.target.value);
        setSaveStatus('idle');
        // Broadcast title change
        const socket = getSocket();
        if (socket.connected && currentNoteId.current) {
            socket.emit('note-change', { noteId: currentNoteId.current, title: e.target.value });
        }
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => handleSave(true), 2000);
    };

    if (!note) {
        return (
            <div className="flex-1 bg-white flex flex-col items-center justify-center text-slate-400">
                <p className="text-lg font-medium text-slate-500 mb-1">Select a note to edit</p>
                <p className="text-sm">Or create a new one from the sidebar</p>
            </div>
        );
    }

    const noteDate = note?.date ? new Date(note.date) : null;

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-6 pb-2 border-b border-slate-100">
                <input
                    type="text"
                    placeholder="Untitled Note"
                    value={title}
                    onChange={handleTitleChange}
                    className="w-full text-3xl font-bold text-slate-900 outline-none placeholder:text-slate-300 bg-transparent mb-2"
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        {noteDate && (
                            <>
                                <Clock size={12} />
                                <span>Last edited {noteDate.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} by {currentUser?.name || 'You'}</span>
                            </>
                        )}
                    </div>
                    {/* Active users badges */}
                    <div className="flex items-center gap-2">
                        {activeUsers.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                {activeUsers.length} editing live
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <MenuBar editor={editor} />

            {/* Editor */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <EditorContent editor={editor} />
            </div>

            {/* Status bar */}
            <div className="px-6 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    {isConnected ? <Wifi size={12} className="text-emerald-500" /> : <WifiOff size={12} className="text-slate-400" />}
                    <span>
                        {saveStatus === 'saved' && '✓ All changes saved to cloud'}
                        {saveStatus === 'saving' && 'Saving...'}
                        {saveStatus === 'error' && '⚠ Save failed — check your connection'}
                        {saveStatus === 'error-title' && <span className="text-amber-600 font-semibold">⚠ Title is required to save!</span>}
                        {saveStatus === 'idle' && (isConnected ? 'Connected' : 'Offline')}
                    </span>
                </div>
                <button
                    onClick={() => handleSave(false)}
                    disabled={saveStatus === 'saving'}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-60 active:scale-95"
                >
                    {saveStatus === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    Save
                </button>
            </div>
        </div>
    );
};

export default InlineNoteEditor;
