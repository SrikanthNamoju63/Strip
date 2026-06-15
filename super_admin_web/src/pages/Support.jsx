import React, { useEffect, useState } from 'react';
import { getTickets, resolveTicket, replyTicket } from '../services/api';
import { MessageSquare, CheckCircle, Clock, User, Send, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [filter, setFilter] = useState('all');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTickets();
    }, [filter]);

    const loadTickets = async () => {
        setLoading(true);
        try {
            const data = await getTickets(filter);
            setTickets(data.data?.tickets || []);
            setSelectedTicket(null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (id) => {
        if (!window.confirm('Mark this ticket as resolved?')) return;
        try {
            await resolveTicket(id);
            toast.success('Ticket Resolved');
            loadTickets();
        } catch (e) {
            toast.error('Action failed');
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        try {
            await replyTicket(selectedTicket._id, replyMessage);
            toast.success('Reply Sent');
            setReplyMessage('');
            loadTickets();
        } catch (e) {
            toast.error('Failed to send reply');
        }
    };

    return (
        <div className="flex h-[calc(100vh-140px)] gap-6 max-w-[1600px] mx-auto">
            {/* Ticket List */}
            <div className="w-1/3 min-w-[320px] bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-500" /> Support Inbox
                    </h2>
                    <select
                        className="text-xs font-semibold border-none bg-white py-1 pl-3 pr-8 rounded-lg shadow-sm focus:ring-0 cursor-pointer text-slate-600"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                    </select>
                </div>
                <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-8"><div className="loader"></div></div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center p-10 text-slate-400">
                            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageSquare size={24} className="opacity-50" />
                            </div>
                            No tickets found
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <motion.div
                                layoutId={ticket._id}
                                key={ticket._id}
                                onClick={() => setSelectedTicket(ticket)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border group ${selectedTicket?._id === ticket._id
                                    ? 'bg-blue-50/70 border-blue-200 shadow-sm'
                                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1.5">
                                    <span className={`font-semibold text-sm truncate pr-2 ${selectedTicket?._id === ticket._id ? 'text-blue-900' : 'text-slate-800'}`}>
                                        {ticket.subject}
                                    </span>
                                    {ticket.status === 'Resolved' ? (
                                        <CheckCircle size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{ticket.message}</p>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-600">
                                            {ticket.user?.name?.[0] || 'U'}
                                        </div>
                                        <span>{ticket.user?.name || 'Unknown'}</span>
                                    </div>
                                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Ticket Detail / Chat Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
                {selectedTicket ? (
                    <>
                        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white z-10">
                            <div>
                                <h1 className="text-xl font-bold text-slate-800 mb-1">{selectedTicket.subject}</h1>
                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${selectedTicket.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                        {selectedTicket.priority || 'Normal'} Priority
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="font-mono text-xs text-slate-400">ID: {selectedTicket._id.substring(selectedTicket._id.length - 6)}</span>
                                </div>
                            </div>
                            {selectedTicket.status !== 'Resolved' && (
                                <button
                                    onClick={() => handleResolve(selectedTicket._id)}
                                    className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    <CheckCircle size={16} /> Mark Resolved
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50" id="chat-container">
                            {/* Original Message */}
                            <div className="flex gap-4 group">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm mt-1">
                                    <User size={18} className="text-slate-500" />
                                </div>
                                <div className="flex flex-col gap-1 max-w-2xl">
                                    <div className="text-xs text-slate-400 ml-1">{selectedTicket.user?.name || 'User'} • {new Date(selectedTicket.createdAt).toLocaleString()}</div>
                                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm text-slate-700 leading-relaxed">
                                        {selectedTicket.message}
                                    </div>
                                </div>
                            </div>

                            {/* Replies */}
                            {selectedTicket.replies && selectedTicket.replies.map((reply, idx) => (
                                <div key={idx} className={`flex gap-4 ${reply.isAdmin ? 'flex-row-reverse' : ''} group`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm mt-1 ${reply.isAdmin ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-slate-200'
                                        }`}>
                                        {reply.isAdmin ? <MessageSquare size={14} className="text-white" /> : <User size={14} className="text-slate-500" />}
                                    </div>
                                    <div className={`flex flex-col gap-1 max-w-2xl ${reply.isAdmin ? 'items-end' : ''}`}>
                                        <div className="text-[10px] text-slate-400 mx-1">{new Date(reply.createdAt).toLocaleString()}</div>
                                        <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${reply.isAdmin
                                            ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                            }`}>
                                            {reply.message}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Box */}
                        <div className="p-4 bg-white border-t border-slate-100 z-10">
                            {selectedTicket.status === 'Resolved' ? (
                                <div className="text-center text-slate-400 py-4 bg-slate-50 rounded-xl border border-slate-200 border-dashed text-sm font-medium">
                                    This ticket is closed. Re-open to reply.
                                </div>
                            ) : (
                                <form onSubmit={handleReply} className="relative">
                                    <textarea
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply here..."
                                        className="w-full p-4 pr-14 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none h-24 bg-slate-50 focus:bg-white transition-all text-sm"
                                    ></textarea>
                                    <button
                                        type="submit"
                                        disabled={!replyMessage.trim()}
                                        className="absolute right-3 bottom-3 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-md shadow-blue-200"
                                    >
                                        <Send size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <MessageSquare size={32} className="opacity-50" />
                        </div>
                        <p className="text-lg font-medium text-slate-400">Select a ticket to view conversation</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Support;
