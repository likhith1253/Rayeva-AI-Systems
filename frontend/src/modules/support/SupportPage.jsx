import React, { useState, useEffect, useRef } from 'react';

const API_BASE = '/api/support';

export default function SupportPage() {
    const [activeTab, setActiveTab] = useState('chat');
    const [sessionId, setSessionId] = useState('');
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [suggestedActions, setSuggestedActions] = useState([]);
    const [hasEscalation, setHasEscalation] = useState(false);

    const [escalations, setEscalations] = useState([]);
    const [isLoadingEscalations, setIsLoadingEscalations] = useState(false);

    const messagesEndRef = useRef(null);

    // Initial setup
    useEffect(() => {
        if (!sessionId) {
            generateNewSession();
        }
    }, []);

    // Load history when session changes
    useEffect(() => {
        if (sessionId) {
            loadHistory(sessionId);
        }
    }, [sessionId]);

    // Load escalations when tab changes
    useEffect(() => {
        if (activeTab === 'escalations') {
            loadEscalations();
        }
    }, [activeTab]);

    // Auto-scroll logic
    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const generateNewSession = async () => {
        // If there's an active session, we might want to delete it or just abandon it.
        // As per requirements: "generates a new session_id and clears the chat"
        // And we have a DELETE endpoint, let's call it just in case if there is an existing one.
        if (sessionId) {
            try {
                await fetch(`${API_BASE}/session/${sessionId}`, { method: 'DELETE' });
            } catch (e) {
                console.error("Cleanup error:", e);
            }
        }

        const newSessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
        setSessionId(newSessionId);
        setMessages([]);
        setSuggestedActions([]);
        setHasEscalation(false);
        setInputMessage('');
    };

    const loadHistory = async (sid) => {
        try {
            const res = await fetch(`${API_BASE}/history/${sid}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setHasEscalation(data.has_escalation || false);
                // Clear quick replies on reload
                setSuggestedActions([]);
            }
        } catch (e) {
            console.error("Failed to load history:", e);
        }
    };

    const loadEscalations = async () => {
        setIsLoadingEscalations(true);
        try {
            const res = await fetch(`${API_BASE}/escalations`);
            if (res.ok) {
                const data = await res.json();
                setEscalations(data || []);
            }
        } catch (e) {
            console.error("Failed to load escalations:", e);
        } finally {
            setIsLoadingEscalations(false);
        }
    };

    const sendMessage = async (text) => {
        if (!text.trim() || isTyping || !sessionId) return;

        const userMsg = {
            id: Date.now(),
            role: 'user',
            message: text,
            created_at: new Date().toISOString(),
            escalated: false
        };

        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setSuggestedActions([]);
        setIsTyping(true);

        try {
            const res = await fetch(`${API_BASE}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: sessionId, message: text })
            });

            if (res.ok) {
                const data = await res.json();
                const asstMsg = {
                    id: Date.now() + 1,
                    role: 'assistant',
                    message: data.reply,
                    intent: data.intent,
                    escalated: data.escalated,
                    created_at: new Date().toISOString()
                };
                setMessages(prev => [...prev, asstMsg]);
                setSuggestedActions(data.suggested_actions || []);
                if (data.escalated) {
                    setHasEscalation(true);
                }
            } else {
                throw new Error("Server returned " + res.status);
            }
        } catch (e) {
            console.error("Failed to send message:", e);
            const errorMsg = {
                id: Date.now() + 1,
                role: 'assistant',
                message: "I'm having trouble connecting right now. Please try again.",
                intent: "error",
                escalated: false,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const viewChat = (sid) => {
        setSessionId(sid);
        setActiveTab('chat');
    };

    return (
        <div className="flex flex-col h-screen bg-[#f0f2f5] min-w-full">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap');
                
                .font-jakarta { font-family: 'Plus Jakarta Sans', sans-serif; }
                .font-inter { font-family: 'Inter', sans-serif; }
                
                .typing-dot {
                    animation: typing 1.4s infinite ease-in-out both;
                }
                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }
                
                @keyframes typing {
                    0%, 80%, 100% { transform: scale(0); }
                    40% { transform: scale(1); }
                }

                .bg-chat-pattern {
                    background-color: #f7f9f7;
                    background-image: radial-gradient(#d1d5db 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>

            {/* Top Navigation */}
            <div className="bg-white px-8 pt-5 border-b border-gray-200 shadow-sm shrink-0 z-20">
                <div className="max-w-7xl mx-auto flex items-end justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 font-jakarta mb-6 flex items-center gap-2">
                            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                            Rayeva Support HQ
                        </h1>
                        <div className="flex gap-8">
                            <button
                                onClick={() => setActiveTab('chat')}
                                className={`pb-3 text-sm font-semibold transition-colors relative font-jakarta ${activeTab === 'chat' ? 'text-green-600' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                Chat
                                {activeTab === 'chat' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-green-600 rounded-t-md"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('escalations')}
                                className={`pb-3 text-sm font-semibold transition-colors relative flex items-center gap-2 font-jakarta ${activeTab === 'escalations' ? 'text-green-600' : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                Escalations Dashboard
                                {escalations.length > 0 && activeTab !== 'escalations' && (
                                    <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                        {escalations.length}
                                    </span>
                                )}
                                {activeTab === 'escalations' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-green-600 rounded-t-md"></div>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden font-inter flex justify-center w-full max-w-7xl mx-auto">
                {activeTab === 'chat' ? (
                    <div className="flex w-full h-full shadow-md bg-white border-l border-r border-gray-200">

                        {/* Sidebar */}
                        <div className="w-[320px] bg-white border-r border-gray-100 flex flex-col shrink-0 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
                            <div className="p-6 bg-gray-50 border-b border-gray-100">
                                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2 font-jakarta">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-sm">
                                        R
                                    </div>
                                    Support Session
                                </h2>
                                <p className="text-[11px] text-gray-500 mt-3 font-mono bg-gray-200 px-2 py-1 rounded truncate border border-gray-300">
                                    ID: {sessionId || 'Generating...'}
                                </p>
                                <button
                                    onClick={generateNewSession}
                                    className="w-full mt-4 bg-white hover:bg-green-50 text-green-700 font-semibold py-2.5 px-4 border border-green-200 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-sm hover:shadow"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-8" /><path d="M8 16l4-4 4 4" /><path d="M4 22h16" /><path d="M21 15a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2z" /></svg>
                                    Start New Chat
                                </button>
                            </div>

                            <div className="p-5 flex-1 overflow-y-auto w-full">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 font-jakarta">Suggested Starters</h3>
                                <div className="flex flex-col gap-2.5">
                                    {[
                                        "Where is my order ORD-801?",
                                        "What is your return policy?",
                                        "I want a refund for my order",
                                        "Tell me about bamboo toothbrushes"
                                    ].map((text, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => sendMessage(text)}
                                            className="text-left text-[13px] leading-snug text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 p-3 rounded-lg shadow-sm transition-all hover:border-green-300 hover:shadow"
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chat Window */}
                        <div className="flex-1 flex flex-col bg-chat-pattern relative">
                            {/* Chat Header */}
                            <div className="bg-white px-6 py-3 border-b border-gray-200 shadow-sm flex items-center shrink-0 z-20">
                                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold mr-4 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 1 0 0-20z" /><path d="M10 16a4 4 0 0 0 4 0" /><path d="M7 10h.01" /><path d="M17 10h.01" /></svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2 font-jakarta text-[15px]">
                                        Rayeva Support
                                        <span className="relative flex h-2.5 w-2.5 ml-1">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                        </span>
                                    </h3>
                                    <p className="text-[11px] text-gray-500">Usually replies instantly</p>
                                </div>
                            </div>

                            {/* Escalation Banner */}
                            {hasEscalation && (
                                <div className="bg-yellow-50 border-b border-yellow-300 text-yellow-800 px-6 py-3 text-[13px] flex items-center gap-3 shrink-0 shadow-sm z-10 font-medium">
                                    <svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                    <span><strong>⚠ Escalated:</strong> This conversation has been flagged for human review. Our team will contact you within 24 hours.</span>
                                </div>
                            )}

                            {/* Messages Scroll Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {messages.length === 0 ? (
                                    <div className="flex justify-center items-center h-full">
                                        <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-[320px] border border-gray-100">
                                            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                            </div>
                                            <h3 className="font-bold text-gray-800 mb-2 font-jakarta text-lg">Welcome to Rayeva</h3>
                                            <p className="text-[13px] text-gray-500 leading-relaxed">Send a message to chat with our AI assistant about sustainable products, orders, or policies.</p>
                                        </div>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => (
                                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className="relative group max-w-[85%] md:max-w-[70%]">
                                                <div className={`rounded-2xl px-4 py-3 shadow-md relative z-10 ${msg.role === 'user'
                                                    ? 'bg-green-600 text-white rounded-tr-sm'
                                                    : 'bg-white text-gray-800 rounded-tl-sm border border-gray-100'
                                                    }`}>
                                                    <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>

                                                    <div className={`flex items-center justify-end mt-1.5 gap-1.5 ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                                                        <span className="text-[10px] uppercase font-semibold">{formatTime(msg.created_at)}</span>
                                                        {msg.role === 'user' && (
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Below Bubble Badges for Assistant */}
                                                {msg.role === 'assistant' && (msg.intent || msg.escalated) && (
                                                    <div className="flex gap-2 mt-2 ml-1">
                                                        {msg.intent && (
                                                            <span className="bg-gray-100/90 text-gray-500 text-[10px] px-2 py-0.5 rounded-full border border-gray-200 shadow-sm font-semibold tracking-wide uppercase">
                                                                {msg.intent.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                        {msg.escalated && (
                                                            <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] px-2 py-0.5 rounded-full shadow-sm font-bold flex items-center gap-1 uppercase tracking-wide">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                                Escalated
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}

                                {isTyping && (
                                    <div className="flex items-start">
                                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3.5 shadow-md w-16 mb-2 flex justify-center items-center h-[46px]">
                                            <div className="flex space-x-1.5">
                                                <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                                                <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                                                <div className="typing-dot w-2 h-2 bg-gray-400 rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} className="h-1" />
                            </div>

                            {/* Input Area */}
                            <div className="bg-[#f0f2f5] px-6 py-4 shrink-0 z-20 w-full relative">

                                {/* Suggested Actions Header */}
                                {suggestedActions.length > 0 && !isTyping && inputMessage === '' && (
                                    <div className="absolute bottom-[100%] left-0 w-full flex items-center p-4 pt-0 gap-2 overflow-x-auto no-scrollbar mask-image-linear bg-gradient-to-t from-[#f0f2f5] to-transparent">
                                        {suggestedActions.map((action, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => sendMessage(action)}
                                                className="whitespace-nowrap shrink-0 bg-white text-green-700 hover:bg-green-50 hover:text-green-800 border border-green-200 px-4 py-2 rounded-full text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-400"
                                            >
                                                {action}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 bg-white px-3 py-2 border border-gray-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all w-full max-w-5xl mx-auto">
                                    <input
                                        type="text"
                                        value={inputMessage}
                                        onChange={(e) => setInputMessage(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') sendMessage(inputMessage);
                                        }}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent px-3 py-1.5 outline-none text-gray-800 placeholder-gray-400 text-[15px]"
                                        autoFocus
                                        disabled={isTyping}
                                    />
                                    <button
                                        onClick={() => sendMessage(inputMessage)}
                                        disabled={!inputMessage.trim() || isTyping}
                                        className={`p-2.5 rounded-lg flex items-center justify-center transition-all ${inputMessage.trim() && !isTyping
                                            ? 'bg-green-600 hover:bg-green-700 text-white shadow hover:shadow-md cursor-pointer'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="translate-x-[-1px] translate-y-[-1px]"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Escalations Dashboard */
                    <div className="w-full h-full bg-[#f8fafc] p-8 overflow-y-auto">
                        <div className="max-w-5xl mx-auto">
                            <div className="mb-6 flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 font-jakarta">Escalated Sessions</h2>
                                    <p className="text-sm text-gray-500 mt-1">Review complex queries that require human agent intervention.</p>
                                </div>
                                <button
                                    onClick={loadEscalations}
                                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 hover:text-green-700 text-sm font-semibold border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all shadow-sm"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isLoadingEscalations ? "animate-spin" : ""}><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-12.28l5.67-5.67" /></svg>
                                    Refresh
                                </button>
                            </div>

                            <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                                {isLoadingEscalations ? (
                                    <div className="p-20 text-center text-gray-400 flex flex-col items-center">
                                        <svg className="w-8 h-8 animate-spin text-green-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        <p className="font-medium text-gray-500">Loading escalations data...</p>
                                    </div>
                                ) : escalations.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center">
                                        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-800 font-jakarta mb-2">All caught up!</h3>
                                        <p className="text-gray-500 text-sm max-w-md">There are no escalated conversations requiring attention at this time.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left whitespace-nowrap">
                                            <thead className="text-[11px] text-gray-500 bg-gray-50/80 uppercase tracking-widest font-bold font-jakarta border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-4">Date & Time</th>
                                                    <th className="px-6 py-4">Session ID</th>
                                                    <th className="px-6 py-4">Status / Reason</th>
                                                    <th className="px-6 py-4 w-full">Final User Message</th>
                                                    <th className="px-6 py-4 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 text-sm">
                                                {escalations.map((esc) => (
                                                    <tr key={esc.id} className="hover:bg-gray-50 transition-colors group">
                                                        <td className="px-6 py-4 font-medium text-gray-700">
                                                            {formatDate(esc.created_at)}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                                            {esc.session_id.substring(0, 16)}...
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                                                {esc.reason}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="max-w-xs md:max-w-md truncate text-gray-600 bg-white border border-gray-100 px-3 py-1.5 rounded-lg shadow-sm" title={esc.user_message}>
                                                                {esc.user_message}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => viewChat(esc.session_id)}
                                                                className="opacity-100 md:opacity-0 group-hover:opacity-100 text-white bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-semibold transition-all shadow-sm hover:shadow flex items-center justify-end gap-1.5 ml-auto"
                                                            >
                                                                View Chat
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
