import { SlidersHorizontal, Search } from "lucide-react";
import useChatStore from "../store/chatStore";
import { formatTimestamp } from "../utils/formatTimestamp";
import { memo, useMemo } from "react";

function ChatList() {
    const {
        chats,
        selectedChat,
        searchTerm,
        filteredChats,
        selectChat,
        setSearchTerm,
        getUnreadCount,
        isUserOnline
    } = useChatStore();

    const handleChatClick = (chat) => {
        selectChat(chat);
    };

    const displayChats = useMemo(() => {
        return searchTerm ? filteredChats : chats;
    }, [searchTerm, filteredChats, chats]);

    return (
        <section className="sm:w-[490px] lg:w-[800px] bg-white border-r flex flex-col h-screen">
            {/* Fixed Header */}
            <div className="flex-shrink-0 p-5 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
                    <button
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Settings"
                    >
                        <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                <div className="flex items-center border border-gray-300 rounded-lg focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-200 transition-all">
                    <Search className="w-5 h-5 text-gray-500 ml-3" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="px-3 py-2 w-full rounded-r-lg outline-none bg-transparent text-sm text-gray-800 placeholder:text-gray-400"
                        aria-label="Search chats"
                    />
                </div>
            </div>

            {/* Scrollable Chat List */}
            <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2">
                {displayChats.length === 0 && searchTerm && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No chats found matching "<strong>{searchTerm}</strong>"</p>
                    </div>
                )}

                {displayChats.map((chat) => {
                    const otherUser = chat.users.find((user) => user.email !== "baxo@mailinator.com");
                    if (!otherUser) return null;

                    const isSelected = selectedChat?.id === chat.id;
                    const unreadCount = getUnreadCount(chat.id);
                    const userIsOnline = isUserOnline(otherUser.id);

                    return (
                        <div
                            key={chat.id}
                            onClick={() => handleChatClick(chat)}
                            className={`py-3 px-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors rounded-lg ${
                                isSelected ? "bg-cyan-50 border-cyan-200" : ""
                            }`}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && handleChatClick(chat)}
                            aria-label={`Open chat with ${otherUser.fullName}`}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="relative">
                                        <img
                                            src={otherUser.image}
                                            alt={otherUser.fullName}
                                            className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                                        />
                                        <div
                                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                                userIsOnline ? "bg-green-500" : "bg-gray-400"
                                            }`}
                                            title={userIsOnline ? "Online" : "Offline"}
                                        ></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h2
                                                className={`font-semibold truncate ${
                                                    isSelected ? "text-cyan-700" : "text-gray-900"
                                                }`}
                                            >
                                                {otherUser.fullName}
                                            </h2>
                                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                                {formatTimestamp(chat.lastMessageTimestamp)}
                                            </span>
                                        </div>
                                        <p
                                            className={`text-sm truncate mt-1 max-w-[200px] sm:max-w-[250px] ${
                                                unreadCount > 0
                                                    ? "text-gray-900 font-medium"
                                                    : "text-gray-600"
                                            }`}
                                        >
                                            {chat.lastMessage || "No messages yet"}
                                        </p>
                                    </div>
                                </div>

                                {unreadCount > 0 && (
                                    <div className="ml-2 bg-cyan-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

export default memo(ChatList);
