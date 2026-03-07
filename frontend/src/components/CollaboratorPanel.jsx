import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, Trash2, Download, History, Check, X, Bell } from 'lucide-react';
import api from '../api/axios';
import NoteHistoryModal from './NoteHistoryModal';

const Avatar = ({ name }) => {
    const initial = name ? name[0].toUpperCase() : '?';
    const colors = ['from-indigo-400 to-blue-500', 'from-emerald-400 to-teal-500', 'from-rose-400 to-pink-500', 'from-amber-400 to-orange-500'];
    const bg = colors[initial.charCodeAt(0) % colors.length];
    return (
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${bg} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
            {initial}
        </div>
    );
};

// ── Email validation sub-component ──
const EmailInviteForm = ({ noteId, onInvited }) => {
    const [email, setEmail] = useState('');
    const [validating, setValidating] = useState(false);
    const [userExists, setUserExists] = useState(null); // null | true | false
    const [userName, setUserName] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [status, setStatus] = useState(null);
    const debounceRef = useRef(null);

    const handleEmailChange = (e) => {
        const val = e.target.value;
        setEmail(val);
        setUserExists(null);
        setStatus(null);
        clearTimeout(debounceRef.current);
        if (!val.includes('@') || val.length < 5) return;
        setValidating(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await api.get(`/notes/check-user?email=${encodeURIComponent(val)}`);
                setUserExists(res.data.exists);
                setUserName(res.data.name || '');
            } catch {
                setUserExists(false);
            } finally {
                setValidating(false);
            }
        }, 600);
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!userExists || !noteId) return;
        setIsInviting(true);
        try {
            await api.post(`/notes/invite/${noteId}`, { email });
            setStatus({ type: 'success', msg: `Invitation sent to ${userName || email}!` });
            setEmail('');
            setUserExists(null);
            onInvited?.();
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.msg || 'Failed to send invitation' });
        } finally {
            setIsInviting(false);
        }
    };

    return (
        <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-2">Invite Collaborators</p>
            <form onSubmit={handleInvite}>
                <div className="relative mb-1.5">
                    <input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={handleEmailChange}
                        className={`w-full px-2.5 py-1.5 pr-8 text-xs text-slate-900 border rounded-lg outline-none transition-all ${userExists === true ? 'border-emerald-400 bg-emerald-50 focus:ring-1 focus:ring-emerald-400/30' :
                            userExists === false ? 'border-red-400 bg-red-50' :
                                'border-slate-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400/20'
                            }`}
                    />
                    {/* Validation indicator */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {validating && <div className="w-3 h-3 border border-slate-300 border-t-blue-500 rounded-full animate-spin" />}
                        {!validating && userExists === true && <Check size={13} className="text-emerald-500" />}
                        {!validating && userExists === false && <X size={13} className="text-red-500" />}
                    </div>
                </div>

                {/* Hint text */}
                {userExists === true && <p className="text-[10px] text-emerald-600 mb-1.5">✓ Found: {userName}</p>}
                {userExists === false && <p className="text-[10px] text-red-500 mb-1.5">No account found. Ask them to register first.</p>}

                <button
                    type="submit"
                    disabled={!userExists || isInviting}
                    className="w-full py-1.5 text-xs font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-500 hover:bg-emerald-600 text-white"
                >
                    {isInviting ? 'Sending...' : 'Send Invitation'}
                </button>
            </form>

            {status && (
                <p className={`text-[11px] mt-1.5 font-medium ${status.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {status.msg}
                </p>
            )}
        </div>
    );
};

// ── Main CollaboratorPanel ──
const CollaboratorPanel = ({ note, currentUser, onDelete, onRefresh }) => {
    const [panelOpen, setPanelOpen] = useState(true);
    const [linkCopied, setLinkCopied] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);

    if (!note) {
        return (
            <div className="w-64 flex-shrink-0 h-full bg-white border-l border-slate-200 flex items-center justify-center">
                <p className="text-slate-400 text-sm text-center px-4">Select a note to see details</p>
            </div>
        );
    }

    const collaborators = note.collaborators || [];
    const isOwner = note.user === currentUser?._id || note.user?._id === currentUser?._id ||
        note.user === currentUser?.id || note.user?._id === currentUser?.id;

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
    };

    const handleExport = () => {
        if (!note) return;
        // Strip HTML to get mostly plain text
        let cleanContent = note.content || '';
        cleanContent = cleanContent.replace(/<p>/g, '\n').replace(/<\/p>/g, '\n');
        cleanContent = cleanContent.replace(/<br\s*[\/]?>/gi, '\n');
        cleanContent = cleanContent.replace(/<[^>]*>?/gm, ''); // Remove remaining HTML tags

        const exportText = `${note.title || 'Untitled Note'}\n====================\nLast Edited: ${new Date(note.date).toLocaleString()}\n\n${cleanContent.trim()}`;

        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(note.title || 'Note').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRestore = async (oldContent) => {
        if (!window.confirm("Restore this version? This will overwrite your current note content.")) return;
        try {
            await api.put(`/notes/${note._id}`, { content: oldContent });
            onRefresh?.();
            setHistoryOpen(false);
        } catch (err) {
            alert('Failed to restore note version');
        }
    };

    return (
        <div className="w-64 flex-shrink-0 h-full bg-white border-l border-slate-200 flex flex-col overflow-y-auto custom-scrollbar">
            {/* Collaborators section */}
            <div className="border-b border-slate-100">
                <button
                    onClick={() => setPanelOpen(!panelOpen)}
                    className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                    <span>Collaborators</span>
                    <ChevronUp size={16} className={`transition-transform ${panelOpen ? '' : 'rotate-180'}`} />
                </button>
                {panelOpen && (
                    <div className="px-4 pb-3 space-y-2">
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Everyone with access</p>

                        {/* Owner */}
                        <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2">
                                <Avatar name={isOwner ? (currentUser?.name || 'You') : (note.user?.name || 'Owner')} />
                                <div>
                                    <p className="text-xs font-semibold text-slate-700">
                                        {isOwner ? (currentUser?.name || 'You') : (note.user?.name || 'Owner')}
                                    </p>
                                    <p className="text-[10px] text-slate-400">Owner, Editor</p>
                                </div>
                            </div>
                            <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Owner</span>
                        </div>

                        {collaborators.map((collab, i) => {
                            const isPopulated = typeof collab === 'object' && collab !== null;
                            const collabId = isPopulated ? collab._id : collab;
                            const collabName = isPopulated ? collab.name : undefined;

                            return (
                                <div key={collabId || i} className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-2">
                                        <Avatar name={collabName || `C${i + 1}`} />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-700">{collabName || 'Collaborator'}</p>
                                            <p className="text-[10px] text-slate-400">Editor</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Editor</span>
                                </div>
                            );
                        })}
                        {collaborators.length === 0 && (
                            <p className="text-[11px] text-slate-400">No collaborators yet</p>
                        )}
                    </div>
                )}
            </div>

            {/* Invite form (only for note owner) */}
            {isOwner && (
                <EmailInviteForm noteId={note._id} onInvited={onRefresh} />
            )}

            {/* Note Options */}
            <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-600 mb-2">Note Options</p>
                <div className="space-y-1.5">
                    <button onClick={handleExport} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
                        <Download size={13} /> Export Note
                    </button>
                    <button onClick={() => setHistoryOpen(true)} className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
                        <History size={13} /> Note History
                    </button>
                    {isOwner && (
                        <button
                            onClick={() => onDelete?.(note._id)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all border border-red-200"
                        >
                            <Trash2 size={13} /> Delete Note
                        </button>
                    )}
                </div>
            </div>

            {/* Sharing Link */}
            {/* <div className="px-4 py-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Sharing Link</p>
                <div className="flex gap-1.5">
                    <div className="flex-1 px-2.5 py-1.5 text-[10px] text-slate-400 border border-slate-200 rounded-lg truncate bg-slate-50">
                        {window.location.origin}/note/{note._id}
                    </div>
                    <button
                        onClick={handleCopyLink}
                        className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-all"
                    >
                        {linkCopied ? '✓' : 'Copy'}
                    </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Anyone with the link can view ↓</p>
            </div> */}

            <NoteHistoryModal
                isOpen={historyOpen}
                onClose={() => setHistoryOpen(false)}
                note={note}
                onRestore={handleRestore}
            />
        </div>
    );
};

export default CollaboratorPanel;
