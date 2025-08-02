import { Search, Send, Smile, Paperclip, Mic, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import useChatStore from "../store/chatStore";
import { useSocket } from "../services/socketService";

export default function ChatBox() {
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    
    const {
        selectedChat,
        getChatMessages,
        getUsersTyping,
        pendingMessages,
        failedMessages,
        isConnected
    } = useChatStore();
    
    const { sendMessage, sendTyping, retryMessage } = useSocket();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [selectedChat, getChatMessages(selectedChat?.id)]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && selectedChat && isConnected) {
            sendMessage(selectedChat.id, message.trim());
            setMessage("");
            
            // Stop typing indicator
            sendTyping(selectedChat.id, false);
        }
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        
        // Send typing indicator
        if (selectedChat && isConnected) {
            sendTyping(selectedChat.id, true);
            
            // Clear previous timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Stop typing after 3 seconds of inactivity
            typingTimeoutRef.current = setTimeout(() => {
                sendTyping(selectedChat.id, false);
            }, 3000);
        }
    };

    const handleRetryMessage = (messageId) => {
        retryMessage(messageId);
    };

    const formatMessageTime = (timestamp) => {
        return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatMessageDate = (timestamp) => {
        const today = new Date();
        const messageDate = new Date(timestamp);
        
        if (messageDate.toDateString() === today.toDateString()) {
            return "Today";
        }
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (messageDate.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        
        return messageDate.toLocaleDateString();
    };

    const shouldShowDateSeparator = (currentMessage, previousMessage) => {
        if (!previousMessage) return true;
        
        const currentDate = new Date(currentMessage.timestamp).toDateString();
        const previousDate = new Date(previousMessage.timestamp).toDateString();
        
        return currentDate !== previousDate;
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

    const otherUser = selectedChat.users.find(user => user.email !== "baxo@mailinator.com");
    const currentMessages = getChatMessages(selectedChat.id);
    const typingUsers = getUsersTyping(selectedChat.id);

    return (
        <section className="w-full flex flex-col bg-gradient-to-b from-cyan-50 to-white h-screen">
            {/* Fixed Header */}
            <header className="flex-shrink-0 bg-white flex items-center justify-between px-6 py-4 shadow-sm border-b">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <img 
                            src={otherUser?.image} 
                            alt={otherUser?.fullName} 
                            className="w-12 h-12 object-cover rounded-full border-2 border-cyan-500" 
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div>
                        <h1 className="font-semibold text-gray-900">{otherUser?.fullName}</h1>
                        <div className="flex items-center gap-2">
                            {!isConnected && (
                                <span className="text-xs text-red-500">Disconnected</span>
                            )}
                            {isConnected && typingUsers.length > 0 && (
                                <span className="text-xs text-green-600">Typing...</span>
                            )}
                            {isConnected && typingUsers.length === 0 && (
                                <span className="text-xs text-green-600">Online</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Search className="w-5 h-5 text-gray-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </header>

            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {currentMessages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No messages yet. Start the conversation!</p>
                        </div>
                    </div>
                ) : (
                    currentMessages.map((msg, index) => {
                        const previousMessage = index > 0 ? currentMessages[index - 1] : null;
                        const showDateSeparator = shouldShowDateSeparator(msg, previousMessage);
                        const isPending = pendingMessages.has(msg.id);
                        const isFailed = failedMessages.has(msg.id);
                        
                        return (
                            <div key={msg.id}>
                                {showDateSeparator && (
                                    <div className="flex justify-center my-4">
                                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                            {formatMessageDate(msg.timestamp)}
                                        </span>
                                    </div>
                                )}
                                
                                <div className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex items-end gap-2 max-w-xs lg:max-w-md ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {msg.sender === 'other' && (
                                            <img 
                                                src={otherUser?.image} 
                                                alt={msg.senderName || otherUser?.fullName} 
                                                className="w-8 h-8 rounded-full object-cover" 
                                            />
                                        )}
                                        
                                        <div className={`px-4 py-2 rounded-2xl relative ${
                                            msg.sender === 'me' 
                                                ? `bg-cyan-500 text-white rounded-br-md ${isFailed ? 'bg-red-500' : isPending ? 'bg-cyan-400' : ''}` 
                                                : 'bg-white text-gray-800 shadow-sm rounded-bl-md border'
                                        }`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className={`text-xs ${
                                                    msg.sender === 'me' ? 'text-cyan-100' : 'text-gray-500'
                                                }`}>
                                                    {formatMessageTime(msg.timestamp)}
                                                </span>
                                                
                                                {/* Message status indicators */}
                                                {msg.sender === 'me' && (
                                                    <div className="ml-2">
                                                        {isPending && (
                                                            <div className="w-2 h-2 bg-cyan-200 rounded-full animate-pulse"></div>
                                                        )}
                                                        {isFailed && (
                                                            <button
                                                                onClick={() => handleRetryMessage(msg.id)}
                                                                className="text-xs text-red-200 hover:text-white underline"
                                                            >
                                                                Retry
                                                            </button>
                                                        )}
                                                        {!isPending && !isFailed && msg.status === 'sent' && (
                                                            <div className="w-2 h-2 bg-cyan-200 rounded-full"></div>
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

            {/* Fixed Message Input */}
            <div className="flex-shrink-0 bg-white border-t p-4">
                {!isConnected && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm text-center">
                            Connection lost. Trying to reconnect...
                        </p>
                    </div>
                )}
                
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <button 
                            type="button"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <Paperclip className="w-5 h-5 text-gray-600" />
                        </button>
                        <button 
                            type="button"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <Smile className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                    
                    <div className="flex-1 relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={message}
                            onChange={handleInputChange}
                            placeholder={`Message ${otherUser?.fullName}...`}
                            disabled={!isConnected}
                            className="w-full px-4 py-3 border border-gray-300 rounded-full outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {message.trim() ? (
                            <button
                                type="submit"
                                disabled={!isConnected}
                                className="p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        ) : (
                            <button 
                                type="button"
                                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Mic className="w-5 h-5 text-gray-600" />
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </section>
    );
}