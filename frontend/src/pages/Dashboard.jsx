import React, { useState, useEffect } from 'react';
import { Search, LogOut, Plus, Bell, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { connectSocket, getSocket } from '../api/socket';
import Sidebar from '../components/Sidebar';
import InlineNoteEditor from '../components/NoteEditor';
import CollaboratorPanel from '../components/CollaboratorPanel';

const NEW_NOTE = { _id: null, title: '', content: '', collaborators: [], date: new Date().toISOString() };

// ── Invitations dropdown panel ──
const InvitationsPanel = ({ invitations, onAccept, onReject, onClose }) => {
    if (invitations.length === 0) {
        return (
            <div className="absolute right-0 top-10 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4">
                <p className="text-sm text-slate-400 text-center">No pending invitations</p>
            </div>
        );
    }
    return (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">Pending Invitations</p>
            </div>
            {invitations.map(inv => (
                <div key={inv._id} className="flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50">
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">"{inv.note?.title || 'Untitled'}"</p>
                        <p className="text-xs text-slate-500">Invited by <span className="font-medium">{inv.invitedBy?.name || 'Someone'}</span></p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 mt-0.5">
                        <button
                            onClick={() => onAccept(inv._id)}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all"
                            title="Accept"
                        >
                            <Check size={13} />
                        </button>
                        <button
                            onClick={() => onReject(inv._id)}
                            className="p-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-all"
                            title="Reject"
                        >
                            <X size={13} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const Dashboard = () => {
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [invitations, setInvitations] = useState([]);
    const [showInvitations, setShowInvitations] = useState(false);
    const { user, logout } = useAuth();

    useEffect(() => {
        fetchNotes();
        fetchInvitations();
        setupSocketInvitations();
    }, []);

    // Close invitations panel on outside click
    useEffect(() => {
        if (!showInvitations) return;
        const handler = (e) => {
            if (!e.target.closest('#inv-panel') && !e.target.closest('#inv-btn')) {
                setShowInvitations(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showInvitations]);

    const setupSocketInvitations = () => {
        const token = localStorage.getItem('token');
        const socket = connectSocket();
        socket.on('connect', () => {
            // Join personal room for invitation notifications
            socket.emit('join-note', { noteId: `user:${user?.id}`, token });
        });
        socket.on('new-invitation', () => {
            fetchInvitations();
        });
        if (socket.connected) {
            socket.emit('join-note', { noteId: `user:${user?.id || user?._id}`, token });
        }
    };

    const fetchNotes = async () => {
        try {
            const res = await api.get('/notes?page=1&limit=50');
            const noteList = res.data.notes || res.data;
            setNotes(noteList);
            if (!selectedNote && noteList.length > 0) {
                setSelectedNote(noteList[0]);
            }
        } catch (err) {
            console.error('Failed to fetch notes:', err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchInvitations = async () => {
        try {
            const res = await api.get('/notes/invitations');
            setInvitations(res.data);
        } catch (err) {
            console.error('Failed to fetch invitations');
        }
    };

    const handleAcceptInvitation = async (inviteId) => {
        try {
            await api.post(`/notes/invitations/${inviteId}/accept`);
            setInvitations(prev => prev.filter(i => i._id !== inviteId));
            fetchNotes();
        } catch (err) {
            console.error('Accept failed');
        }
    };

    const handleRejectInvitation = async (inviteId) => {
        try {
            await api.post(`/notes/invitations/${inviteId}/reject`);
            setInvitations(prev => prev.filter(i => i._id !== inviteId));
        } catch (err) {
            console.error('Reject failed');
        }
    };

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            try {
                const res = await api.get(`/notes/search/${query}`);
                setNotes(res.data);
            } catch { }
        } else if (query.length === 0) {
            fetchNotes();
        }
    };

    const handleNewNote = () => setSelectedNote({ ...NEW_NOTE });

    const handleDeleteNote = async (noteId) => {
        if (!window.confirm('Delete this note?')) return;
        try {
            await api.delete(`/notes/${noteId}`);
            setSelectedNote(null);
            fetchNotes();
        } catch (err) {
            console.error('Delete failed:', err.message);
        }
    };

    const displayedNotes = searchQuery.length > 0 && searchQuery.length <= 2
        ? notes.filter(n => n.title?.toLowerCase().includes(searchQuery.toLowerCase()))
        : notes;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* Navbar */}
            <header className="h-14 flex-shrink-0 bg-white border-b border-slate-200 flex items-center px-4 gap-4 z-10">
                {/* Logo */}
                <div className="flex items-center gap-2 w-64 flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-white font-black text-sm">C</span>
                    </div>
                    <span className="font-bold text-slate-800 text-base tracking-tight">CollabNotes</span>
                </div>

                {/* Search */}
                <div className="flex-1 max-w-lg">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input
                            type="text"
                            placeholder="Search notes and content..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Right side */}
                <div className="ml-auto flex items-center gap-3">
                    {/* User info */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold text-slate-700 leading-none">{user?.name || 'User'}</p>
                        </div>
                    </div>

                    {/* Invitations bell */}
                    <div className="relative">
                        <button
                            id="inv-btn"
                            onClick={() => setShowInvitations(!showInvitations)}
                            className={`relative p-2 rounded-lg transition-all ${invitations.length > 0 ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-400 hover:bg-slate-100'}`}
                            title="Invitations"
                        >
                            <Bell size={18} />
                            {invitations.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                    {invitations.length}
                                </span>
                            )}
                        </button>
                        {showInvitations && (
                            <div id="inv-panel">
                                <InvitationsPanel
                                    invitations={invitations}
                                    onAccept={handleAcceptInvitation}
                                    onReject={handleRejectInvitation}
                                    onClose={() => setShowInvitations(false)}
                                />
                            </div>
                        )}
                    </div>

                    {/* New Note button */}
                    <button
                        onClick={handleNewNote}
                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-all active:scale-95 shadow-sm"
                    >
                        <Plus size={16} />
                        New Note
                    </button>

                    {/* Logout */}
                    <button onClick={logout} title="Logout" className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* 3-column body */}
            <div className="flex flex-1 overflow-hidden">
                {isLoading ? (
                    <div className="w-72 flex-shrink-0 h-full bg-slate-50 border-r border-slate-200 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                            <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-xs">Loading notes...</p>
                        </div>
                    </div>
                ) : (
                    <Sidebar
                        notes={displayedNotes}
                        activeNote={selectedNote}
                        onSelectNote={setSelectedNote}
                        onNewNote={handleNewNote}
                        currentUserId={user?._id || user?.id}
                    />
                )}

                {selectedNote !== null ? (
                    <InlineNoteEditor note={selectedNote} onSave={fetchNotes} currentUser={user} />
                ) : (
                    <div className="flex-1 bg-white flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <span className="text-3xl">📝</span>
                        </div>
                        <p className="text-lg font-semibold text-slate-600 mb-1">No note selected</p>
                        <p className="text-sm mb-4">Pick a note from the left, or create a new one</p>
                        <button onClick={handleNewNote} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95">
                            <Plus size={16} /> New Note
                        </button>
                    </div>
                )}

                <CollaboratorPanel
                    note={selectedNote?._id ? selectedNote : null}
                    currentUser={user}
                    onDelete={handleDeleteNote}
                    onRefresh={fetchNotes}
                />
            </div>
        </div>
    );
};

export default Dashboard;
