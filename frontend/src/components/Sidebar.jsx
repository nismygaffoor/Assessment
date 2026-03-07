import React, { useState } from 'react';
import { Plus, FileText, Clock, Users } from 'lucide-react';

const TABS = ['All Notes', 'My Notes', 'Shared with Me'];

const NoteCard = ({ note, isActive, onClick }) => {
    const preview = note.content?.replace(/<[^>]*>/g, '').slice(0, 80) || 'No content';
    const date = new Date(note.date);
    const timeAgo = formatTimeAgo(date);

    return (
        <div
            onClick={() => onClick(note)}
            className={`p-4 rounded-xl cursor-pointer transition-all border ${isActive
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                }`}
        >
            <h3 className={`font-semibold text-sm mb-1 line-clamp-1 ${isActive ? 'text-blue-800' : 'text-slate-800'}`}>
                {note.title}
            </h3>
            <p className="text-slate-500 text-xs line-clamp-2 mb-2 leading-relaxed">{preview}</p>
            <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">Last edited {timeAgo}</span>
                {note.collaborators?.length > 0 && (
                    <div className="flex -space-x-1">
                        {[note.user, ...note.collaborators].filter(Boolean).slice(0, 4).map((userOrCollab, i) => {
                            const isPopulated = typeof userOrCollab === 'object' && userOrCollab !== null;
                            const name = isPopulated ? userOrCollab.name : null;
                            const initial = name ? name[0].toUpperCase() : '?';

                            return (
                                <div key={isPopulated ? userOrCollab._id : userOrCollab || i} className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 border border-white text-[8px] flex items-center justify-center text-white font-bold" title={name || 'User'}>
                                    {initial}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

function formatTimeAgo(date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
}

const Sidebar = ({ notes, activeNote, onSelectNote, onNewNote, currentUserId }) => {
    const [activeTab, setActiveTab] = useState('All Notes');

    const filteredNotes = notes.filter(note => {
        if (activeTab === 'My Notes') return note.user === currentUserId || note.user?._id === currentUserId;
        if (activeTab === 'Shared with Me') return (note.collaborators || []).some(c => c === currentUserId || c?._id === currentUserId);
        return true;
    });

    return (
        <div className="w-72 flex-shrink-0 h-full flex flex-col bg-slate-50 border-r border-slate-200">
            {/* Tabs */}
            <div className="px-3 pt-3 pb-2 border-b border-slate-200 bg-white">
                <div className="flex gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === tab
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                }`}
                        >
                            {tab === 'Shared with Me' ? 'Shared' : tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Create button */}
            <div className="px-3 py-3 bg-white border-b border-slate-100">
                <button
                    onClick={onNewNote}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-all border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600"
                >
                    <span>Create Notebook</span>
                    <Plus size={16} />
                </button>
            </div>

            {/* Notes list */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                        <FileText size={32} className="mb-2 opacity-30" />
                        <p className="text-sm">No notes found</p>
                    </div>
                ) : (
                    filteredNotes.map(note => (
                        <NoteCard
                            key={note._id}
                            note={note}
                            isActive={activeNote?._id === note._id}
                            onClick={onSelectNote}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default Sidebar;
