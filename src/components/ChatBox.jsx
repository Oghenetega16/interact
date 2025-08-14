import { Search, Send, Smile, Paperclip, Mic, MoreVertical, ArrowLeft } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import useChatStore from "../store/chatStore";
import { useSocket } from "../services/socketService";

export default function ChatBox() {
    const [message, setMessage] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const { 
        selectedChat, 
        getChatMessages, 
        getUsersTyping, 
        pendingMessages, 
        failedMessages, 
        isConnected,
        currentUser,
        selectChat
    } = useChatStore();

    const { sendMessage, sendTyping, retryMessage } = useSocket() || {};

    // Safely get messages and other data
    const messages = selectedChat ? getChatMessages?.(selectedChat.id) || [] : [];
    const typingUsers = selectedChat ? getUsersTyping?.(selectedChat.id) || [] : [];
    
    // Find other user safely
    const otherUser = selectedChat?.users?.find((user) => 
        user.email !== currentUser?.email && 
        user.uid !== currentUser?.uid
    );

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedChat?.id, scrollToBottom]);

    // Focus input when chat changes
    useEffect(() => {
        if (selectedChat && inputRef.current) {
            inputRef.current.focus();
        }
    }, [selectedChat?.id]);

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    const handleSendMessage = (e) => {
        e.preventDefault();
        const trimmedMessage = message.trim();
        
        if (!trimmedMessage || !selectedChat || !isConnected || !sendMessage) {
            return;
        }

        try {
            sendMessage(selectedChat.id, trimmedMessage);
            setMessage("");
            setIsTyping(false);
            
            // Stop typing indicator
            if (sendTyping) {
                sendTyping(selectedChat.id, false);
            }
            
            // Clear typing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setMessage(value);

        if (!selectedChat || !isConnected || !sendTyping) return;

        const wasTyping = isTyping;
        const nowTyping = value.trim().length > 0;
        
        setIsTyping(nowTyping);

        // Only send typing indicator if state changed
        if (nowTyping !== wasTyping) {
            sendTyping(selectedChat.id, nowTyping);
        }

        // Reset typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (nowTyping) {
            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                if (sendTyping) {
                    sendTyping(selectedChat.id, false);
                }
            }, 3000);
        }
    };

    const handleRetryMessage = (messageId) => {
        if (retryMessage) {
            retryMessage(messageId);
        }
    };

    const handleBackToChats = () => {
        selectChat?.(null);
    };

    const formatMessageTime = (timestamp) => {
        if (!timestamp) return "";
        try {
            return new Date(timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return "";
        }
    };

    const formatMessageDate = (timestamp) => {
        if (!timestamp) return "";
        
        try {
            const today = new Date();
            const messageDate = new Date(timestamp);

            if (messageDate.toDateString() === today.toDateString()) return "Today";

            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);

            if (messageDate.toDateString() === yesterday.toDateString()) {
                return "Yesterday";
            }

            return messageDate.toLocaleDateString();
        } catch {
            return "";
        }
    };

    const shouldShowDateSeparator = (current, previous) => {
        if (!previous || !current?.timestamp || !previous?.timestamp) return true;
        try {
            return new Date(current.timestamp).toDateString() !== new Date(previous.timestamp).toDateString();
        } catch {
            return true;
        }
    };

    const getMessageSender = (msg) => {
        if (!msg || !currentUser) return "other";
        return msg.senderId === currentUser.uid || msg.sender === currentUser.uid ? "me" : "other";
    };

    const isUserOnline = () => {
        // You can implement online status logic here
        return isConnected && otherUser;
    };

    if (!selectedChat) {
        return (
            <section className="w-full flex items-center justify-center bg-gradient-to-b from-cyan-50 to-white h-screen">
                <div className="text-center">
                    <div className="w-24 h-24 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-12 h-12 text-cyan-500" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Select a Chat</h2>
                    <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
                </div>
            </section>
        );
    }

    if (!otherUser) {
        return (
            <section className="w-full flex items-center justify-center bg-gradient-to-b from-cyan-50 to-white h-screen">
                <div className="text-center">
                    <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-12 h-12 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-semibold text-red-700 mb-2">Chat Error</h2>
                    <p className="text-gray-500">Unable to load chat participants</p>
                    <button 
                        onClick={handleBackToChats}
                        className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                    >
                        Back to Chats
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="w-full flex flex-col bg-gradient-to-b from-cyan-50 to-white h-screen">
            {/* Header */}
            <header className="flex-shrink-0 bg-white flex items-center justify-between px-4 sm:px-6 py-4 shadow-sm border-b">
                <div className="flex items-center gap-3">
                    {/* Back button for mobile */}
                    <button
                        onClick={handleBackToChats}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Back to chats"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>

                    <div className="relative">
                        <img
                            src={otherUser?.image || otherUser?.photoURL || '/default-avatar.png'}
                            alt={otherUser?.fullName || otherUser?.displayName || 'User'}
                            className="w-10 sm:w-12 h-10 sm:h-12 object-cover rounded-full border-2 border-cyan-500"
                            onError={(e) => {
                                e.target.src = '/default-avatar.png';
                            }}
                        />
                        <div 
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                isUserOnline() ? 'bg-green-500' : 'bg-gray-400'
                            }`} 
                        />
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-900 text-sm sm:text-base">
                            {otherUser?.fullName || otherUser?.displayName || 'Unknown User'}
                        </h1>
                        <div className="flex items-center gap-2">
                            {!isConnected && (
                                <span className="text-xs text-red-500">Disconnected</span>
                            )}
                            {isConnected && typingUsers.length > 0 && (
                                <span className="text-xs text-green-600">Typing...</span>
                            )}
                            {isConnected && typingUsers.length === 0 && isUserOnline() && (
                                <span className="text-xs text-green-600">Online</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Search in chat"
                    >
                        <Search className="w-5 h-5 text-gray-600" />
                    </button>
                    <button 
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="More options"
                    >
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No messages yet. Start the conversation!</p>
                        </div>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        if (!msg) return null;
                        
                        const previous = index > 0 ? messages[index - 1] : null;
                        const showDate = shouldShowDateSeparator(msg, previous);
                        const isPending = pendingMessages?.has(msg.id);
                        const isFailed = failedMessages?.has(msg.id);
                        const sender = getMessageSender(msg);

                        return (
                            <div key={msg.id || `${msg.timestamp}-${index}`}>
                                {showDate && (
                                    <div className="flex justify-center my-4">
                                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                            {formatMessageDate(msg.timestamp)}
                                        </span>
                                    </div>
                                )}

                                <div className={`flex ${sender === "me" ? "justify-end" : "justify-start"}`}>
                                    <div className={`flex items-end gap-2 max-w-xs sm:max-w-sm lg:max-w-md ${
                                        sender === "me" ? "flex-row-reverse" : "flex-row"
                                    }`}>
                                        {sender === "other" && (
                                            <img 
                                                src={otherUser?.image || otherUser?.photoURL || '/default-avatar.png'} 
                                                alt={msg.senderName || otherUser?.fullName || 'User'} 
                                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = '/default-avatar.png';
                                                }}
                                            />
                                        )}

                                        <div className={`px-3 sm:px-4 py-2 rounded-2xl relative ${
                                            sender === "me" 
                                                ? `text-white rounded-br-md ${
                                                    isFailed ? "bg-red-500" : isPending ? "bg-cyan-400" : "bg-cyan-500"
                                                }` 
                                                : "bg-white text-gray-800 shadow-sm rounded-bl-md border"
                                        }`}>
                                            <p className="text-sm leading-relaxed break-words">
                                                {msg.text || msg.content || 'Message content unavailable'}
                                            </p>
                                            <div className="flex items-center justify-between mt-1 gap-2">
                                                <span className={`text-xs ${
                                                    sender === "me" ? "text-cyan-100" : "text-gray-500"
                                                }`}>
                                                    {formatMessageTime(msg.timestamp)}
                                                </span>
                                                {sender === "me" && (
                                                    <div className="flex items-center">
                                                        {isPending && (
                                                            <div className="w-2 h-2 bg-cyan-200 rounded-full animate-pulse" />
                                                        )}
                                                        {isFailed && (
                                                            <button 
                                                                onClick={() => handleRetryMessage(msg.id)}
                                                                className="text-xs text-red-200 hover:text-white underline"
                                                            >
                                                                Retry
                                                            </button>
                                                        )}
                                                        {!isPending && !isFailed && msg.status === "sent" && (
                                                            <div className="w-2 h-2 bg-cyan-200 rounded-full" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="flex-shrink-0 bg-white border-t p-4">
                {!isConnected && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-center text-sm text-red-600">
                        Connection lost. Trying to reconnect...
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button 
                            type="button" 
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Attach file"
                        >
                            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>
                        <button 
                            type="button" 
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Add emoji"
                        >
                            <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                        </button>
                    </div>

                    <div className="flex-1">
                        <input
                            ref={inputRef}
                            type="text"
                            aria-label="Type your message"
                            value={message}
                            onChange={handleInputChange}
                            placeholder={`Message ${otherUser?.fullName || otherUser?.displayName || 'user'}...`}
                            disabled={!isConnected}
                            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-full outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                        />
                    </div>

                    <div className="flex items-center">
                        {message.trim() ? (
                            <button
                                type="submit"
                                aria-label="Send message"
                                disabled={!isConnected}
                                className="p-2 sm:p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="p-2 sm:p-3 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Record voice message"
                            >
                                <Mic className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}