import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  selectedChatId: null,
  isTyping: false,
  unreadMessages: {},
  chats: [], // Ensure this exists
  serachTerm: '',

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: !!user }),
  logout: () => set({ currentUser: null, isAuthenticated: false }),
  setSelectedChatId: (chatId) => set({ selectedChatId: chatId }),
  setTyping: (typing) => set({ isTyping: typing }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  incrementUnread: (chatId) =>
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [chatId]: (state.unreadMessages[chatId] || 0) + 1,
      },
    })),
  resetUnread: (chatId) =>
    set((state) => ({
      unreadMessages: {
        ...state.unreadMessages,
        [chatId]: 0,
      },
    })),

  // ✅ Add this to get messages for a chat
  getChatMessages: (chatId) => {
    const chats = get().chats;
    const chat = chats.find((c) => c.id === chatId);
    return chat ? chat.messages || [] : [];
  },

  // ✅ Add this to get users typing in a chat
  getUsersTyping: (chatId) => {
    const chats = get().chats;
    const chat = chats.find((c) => c.id === chatId);
    return chat ? chat.typingUsers || [] : [];
  }
}));

export default useChatStore;
