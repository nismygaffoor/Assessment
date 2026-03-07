import React from 'react';
import { X, Clock, User, RotateCcw } from 'lucide-react';

const NoteHistoryModal = ({ isOpen, onClose, note, onRestore }) => {
    if (!isOpen || !note) return null;

    const history = note.history || [];

    // Format date string beautifully
    const formatHistoryDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Clock size={16} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">Version History</h3>
                            <p className="text-xs text-slate-500">Track changes and restore previous versions of "{note.title}"</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Body Timeline */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {history.length === 0 ? (
                        <div className="text-center py-10">
                            <Clock size={48} className="mx-auto text-slate-300 mb-4" />
                            <h4 className="text-slate-600 font-semibold mb-1">No earlier history</h4>
                            <p className="text-slate-400 text-sm">Versions will appear here as you edit the note over time.</p>
                        </div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">

                            {/* Current Version Indicator */}
                            <div className="relative pl-6">
                                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                                <div className="bg-white border text-left border-blue-200 shadow-sm rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-500 bg-blue-50 px-2.5 py-1 rounded-md mb-2 inline-block -ml-1">Current Version</span>
                                            <p className="text-sm font-semibold text-slate-700">{formatHistoryDate(note.date)}</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-32 overflow-y-auto custom-scrollbar" dangerouslySetInnerHTML={{ __html: note.content || '<em>Empty Note</em>' }} />
                                </div>
                            </div>

                            {/* Past Versions */}
                            {[...history].reverse().map((snapshot, index) => (
                                <div key={snapshot._id || index} className="relative pl-6">
                                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 ring-4 ring-white" />
                                    <div className="bg-white border text-left border-slate-200 shadow-sm rounded-xl p-4 group hover:border-slate-300 transition-colors">

                                        <div className="flex items-center justify-between mb-3">
                                            <div>
                                                <p className="text-sm font-bold text-slate-700">{formatHistoryDate(snapshot.timestamp)}</p>
                                                <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                                                    <User size={12} />
                                                    <span>Saved by <span className="font-semibold text-slate-600">{snapshot.updatedBy?.name || 'Unknown User'}</span></span>
                                                </div>
                                            </div>
                                            {/* Restore button (optional feature) */}
                                            {onRestore && (
                                                <button
                                                    onClick={() => onRestore(snapshot.content)}
                                                    className="hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                                >
                                                    <RotateCcw size={14} /> Restore
                                                </button>
                                            )}
                                        </div>

                                        <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-32 overflow-y-auto custom-scrollbar relative opacity-80" dangerouslySetInnerHTML={{ __html: snapshot.content || '<em>Empty Note</em>' }} />
                                    </div>
                                </div>
                            ))}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteHistoryModal;
