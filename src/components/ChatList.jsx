import { SlidersHorizontal, Search, Plus, MessageCircle } from "lucide-react";
import useChatStore from "../store/chatStore";
import { formatTimestamp } from "../utils/formatTimestamp";
import { memo, useMemo, useState, useEffect } from "react";
import { fetchAllUsers } from '../utils/fetchAllUsers';

function ChatList() {
    const {
        chats,
        selectedChat,
        searchTerm,
        selectChat,
        setSearchTerm,
        getUnreadCount,
        isUserOnline,
        currentUser,
        isLoading,
        setAllUsers,
        getFilteredChats
    } = useChatStore();

    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [error, setError] = useState(null);

    const handleChatClick = (chat) => {
        if (selectedChat?.id !== chat.id) {
            selectChat(chat);
        }
    };

    const displayChats = useMemo(() => {
        const filteredChats = getFilteredChats();
        const chatsToShow = searchTerm ? filteredChats : chats;
        // Sort by last message timestamp (most recent first)
        return chatsToShow.sort((a, b) => {
            const aTime = a.lastMessageTimestamp || 0;
            const bTime = b.lastMessageTimestamp || 0;
            return bTime - aTime;
        });
    }, [searchTerm, chats, getFilteredChats]);

    useEffect(() => {
        const loadUsers = async () => {
            if (isLoadingUsers) return;
            
            try {
                setIsLoadingUsers(true);
                setError(null);
                const users = await fetchAllUsers();
                setAllUsers(users);
            } catch (err) {
                console.error('Failed to load users:', err);
                setError('Failed to load users');
            } finally {
                setIsLoadingUsers(false);
            }
        };

        loadUsers();
    }, [setAllUsers]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    // Get current user email safely
    const currentUserEmail = currentUser?.email || currentUser?.user?.email;

    return (
        <section className="sm:w-[490px] lg:w-[400px] bg-white border-r flex flex-col h-screen">
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-5 border-b border-gray-100 bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="New chat"
                            title="New chat"
                        >
                            <Plus className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Settings"
                            title="Settings"
                        >
                            <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <div className="flex items-center border border-gray-300 rounded-lg focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200 transition-all">
                        <Search className="w-5 h-5 text-gray-500 ml-3" />
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="px-3 py-2 w-full rounded-r-lg outline-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400"
                            aria-label="Search chats"
                        />
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="p-1 mr-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Clear search"
                            >
                                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                        {error}
                    </div>
                )}
            </div>

            {/* Scrollable Chat List */}
            <div className="flex-1 overflow-y-auto">
                {/* Loading State */}
                {(isLoading || isLoadingUsers) && displayChats.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
                        <span className="ml-2 text-gray-500">Loading chats...</span>
                    </div>
                )}

                {/* No Search Results */}
                {displayChats.length === 0 && searchTerm && !isLoading && (
                    <div className="text-center py-8 px-5 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium mb-1">No chats found</p>
                        <p className="text-sm">No chats match "<strong>{searchTerm}</strong>"</p>
                        <button
                            onClick={clearSearch}
                            className="mt-3 text-cyan-600 hover:text-cyan-700 text-sm font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {displayChats.length === 0 && !searchTerm && !isLoading && (
                    <div className="text-center py-12 px-5 text-gray-500">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No chats yet</h3>
                        <p className="text-sm mb-4">Start a conversation to see your chats here</p>
                        <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
                            Start New Chat
                        </button>
                    </div>
                )}

                {/* Chat Items */}
                <div className="px-5 py-2 space-y-1">
                    {displayChats.map((chat) => {
                        // Find the other user (not current user)
                        const otherUser = chat.users?.find((user) => 
                            user.email !== currentUserEmail && 
                            user.uid !== currentUser?.uid
                        );
                        
                        if (!otherUser) {
                            console.warn('No other user found for chat:', chat.id);
                            return null;
                        }

                        const isSelected = selectedChat?.id === chat.id;
                        const unreadCount = getUnreadCount ? getUnreadCount(chat.id) : 0;
                        const userIsOnline = isUserOnline ? isUserOnline(otherUser.id || otherUser.uid) : false;

                        return (
                            <div
                                key={chat.id}
                                onClick={() => handleChatClick(chat)}
                                className={`py-3 px-3 cursor-pointer hover:bg-gray-50 transition-all duration-200 rounded-lg border ${
                                    isSelected 
                                        ? "bg-cyan-50 border-cyan-200 shadow-sm" 
                                        : "border-transparent hover:border-gray-200"
                                }`}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleChatClick(chat);
                                    }
                                }}
                                aria-label={`Open chat with ${otherUser.fullName || otherUser.displayName || 'Unknown User'}`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Avatar with Online Status */}
                                    <div className="relative flex-shrink-0">
                                        <img
                                            src={otherUser.image || otherUser.photoURL || '/default-avatar.png'}
                                            alt={otherUser.fullName || otherUser.displayName || 'User'}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                            onError={(e) => {
                                                e.target.src = '/default-avatar.png';
                                            }}
                                        />
                                        <div
                                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                                userIsOnline ? "bg-green-500" : "bg-gray-400"
                                            }`}
                                            title={userIsOnline ? "Online" : "Offline"}
                                            aria-label={userIsOnline ? "Online" : "Offline"}
                                        />
                                    </div>

                                    {/* Chat Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h2
                                                className={`font-semibold truncate ${
                                                    isSelected ? "text-cyan-700" : "text-gray-900"
                                                }`}
                                            >
                                                {otherUser.fullName || otherUser.displayName || 'Unknown User'}
                                            </h2>
                                            {chat.lastMessageTimestamp && (
                                                <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                    {formatTimestamp(chat.lastMessageTimestamp)}
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className={`text-sm truncate ${
                                                unreadCount > 0
                                                    ? "text-gray-900 font-medium"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            {chat.lastMessage || "No messages yet"}
                                        </p>
                                    </div>

                                    {/* Unread Badge */}
                                    {unreadCount > 0 && (
                                        <div className="ml-2 bg-cyan-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 flex-shrink-0">
                                            {unreadCount > 99 ? "99+" : unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export default memo(ChatList);