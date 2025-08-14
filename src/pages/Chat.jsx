import { useEffect, useState } from "react";
import ChatFeatures from "../components/ChatFeatures";
import ChatList from "../components/ChatList";
import ChatBox from "../components/ChatBox";
import { Navigate } from 'react-router-dom';
import useChatStore from "../store/chatStore";
import LoadingSpinner from "../components/ui/LoadingSpinner";

export default function Chat() {
    const { currentUser, isAuthenticated, selectedChat } = useChatStore();
    const [isLoading, setIsLoading] = useState(true);

    // Handle loading state for auth check
    useEffect(() => {
        // Small delay to ensure auth state is properly set
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading chat..." />
            </div>
        );
    }

    // Redirect if not authenticated
    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <main className="min-h-screen flex flex-col sm:flex-row bg-gray-50">
            {/* Sidebar - Features and Chat List */}
            <div className="flex flex-col sm:flex-row sm:w-96 lg:w-80">
                <ChatFeatures />
                <ChatList />
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Mobile: Show ChatBox only when a chat is selected */}
                <div className="lg:hidden">
                    {selectedChat ? (
                        <ChatBox />
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center text-gray-500">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium mb-2">Select a chat to start messaging</h3>
                                <p className="text-sm">Choose a conversation from the sidebar to begin.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop: Always show ChatBox */}
                <div className="hidden lg:flex lg:flex-1">
                    {selectedChat ? (
                        <ChatBox />
                    ) : (
                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="text-center text-gray-500 max-w-md">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-semibold mb-3 text-gray-700">Welcome to your chat!</h2>
                                <p className="text-gray-500 mb-6">Select a conversation from the sidebar to start chatting, or create a new one to connect with others.</p>
                                <div className="text-xs text-gray-400 space-y-1">
                                    <p>💬 Send messages instantly</p>
                                    <p>📎 Share files and images</p>
                                    <p>🟢 See when others are online</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}