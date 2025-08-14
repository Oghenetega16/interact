import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  // ✅ User Authentication
  currentUser: null,
  isAuthenticated: false,
  
  // ✅ Chat Management
  chats: [],
  selectedChat: null, // Changed from selectedChatId to store the actual chat object
  
  // ✅ UI State
  searchTerm: '',
  isTyping: false,
  isLoading: false,
  isConnected: false,
  activeTab: 'chat', // For ChatFeatures component
  
  // ✅ Message Management
  messages: {}, // Store messages by chatId: { [chatId]: [messages] }
  unreadMessages: {},
  pendingMessages: new Set(),
  failedMessages: new Set(),
  
  // ✅ Users Management
  allUsers: [],
  onlineUsers: [],
  typingUsers: {}, // Store typing users by chatId: { [chatId]: [userIds] }

  // ===== USER AUTHENTICATION =====
  setCurrentUser: (user) => set({ 
    currentUser: user, 
    isAuthenticated: !!user 
  }),
  
  logout: () => set({ 
    currentUser: null, 
    isAuthenticated: false,
    selectedChat: null,
    chats: [],
    messages: {},
    unreadMessages: {},
    searchTerm: ''
  }),

  // ===== CHAT SELECTION =====
  selectChat: (chat) => {
    set({ selectedChat: chat });
    // Reset unread count when selecting a chat
    if (chat?.id) {
      get().resetUnread(chat.id);
    }
  },

  // ===== UI STATE MANAGEMENT =====
  setSearchTerm: (term) => set({ searchTerm: term }),
  setTyping: (typing) => set({ isTyping: typing }),
  setLoading: (loading) => set({ isLoading: loading }),
  setConnected: (connected) => set({ isConnected: connected }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ===== USERS MANAGEMENT =====
  setAllUsers: (users) => set({ allUsers: users }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  // ===== CHATS MANAGEMENT =====
  setChats: (chats) => set({ chats }),
  
  addChat: (chat) => set((state) => ({
    chats: [...state.chats, chat]
  })),
  
  updateChat: (chatId, updates) => set((state) => ({
    chats: state.chats.map(chat => 
      chat.id === chatId ? { ...chat, ...updates } : chat
    )
  })),

  // ===== MESSAGES MANAGEMENT =====
  getChatMessages: (chatId) => {
    if (!chatId) return [];
    return get().messages[chatId] || [];
  },

  setChatMessages: (chatId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: messages
    }
  })),

  addMessage: (chatId, message) => set((state) => {
    const currentMessages = state.messages[chatId] || [];
    return {
      messages: {
        ...state.messages,
        [chatId]: [...currentMessages, message]
      }
    };
  }),

  updateMessage: (chatId, messageId, updates) => set((state) => {
    const currentMessages = state.messages[chatId] || [];
    return {
      messages: {
        ...state.messages,
        [chatId]: currentMessages.map(msg => 
          msg.id === messageId ? { ...msg, ...updates } : msg
        )
      }
    };
  }),

  removeMessage: (chatId, messageId) => set((state) => {
    const currentMessages = state.messages[chatId] || [];
    return {
      messages: {
        ...state.messages,
        [chatId]: currentMessages.filter(msg => msg.id !== messageId)
      }
    };
  }),

  // ===== PENDING/FAILED MESSAGES =====
  addPendingMessage: (messageId) => set((state) => {
    const newPending = new Set(state.pendingMessages);
    newPending.add(messageId);
    return { pendingMessages: newPending };
  }),

  removePendingMessage: (messageId) => set((state) => {
    const newPending = new Set(state.pendingMessages);
    newPending.delete(messageId);
    return { pendingMessages: newPending };
  }),

  addFailedMessage: (messageId) => set((state) => {
    const newFailed = new Set(state.failedMessages);
    newFailed.add(messageId);
    // Also remove from pending
    const newPending = new Set(state.pendingMessages);
    newPending.delete(messageId);
    return { 
      failedMessages: newFailed,
      pendingMessages: newPending
    };
  }),

  removeFailedMessage: (messageId) => set((state) => {
    const newFailed = new Set(state.failedMessages);
    newFailed.delete(messageId);
    return { failedMessages: newFailed };
  }),

  // ===== UNREAD MESSAGES =====
  getUnreadCount: (chatId) => get().unreadMessages[chatId] || 0,

  incrementUnread: (chatId) => set((state) => ({
    unreadMessages: {
      ...state.unreadMessages,
      [chatId]: (state.unreadMessages[chatId] || 0) + 1,
    },
  })),

  resetUnread: (chatId) => set((state) => ({
    unreadMessages: {
      ...state.unreadMessages,
      [chatId]: 0,
    },
  })),

  // ===== TYPING INDICATORS =====
  getUsersTyping: (chatId) => {
    if (!chatId) return [];
    return get().typingUsers[chatId] || [];
  },

  setUsersTyping: (chatId, userIds) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [chatId]: userIds
    }
  })),

  addTypingUser: (chatId, userId) => set((state) => {
    const currentTyping = state.typingUsers[chatId] || [];
    if (currentTyping.includes(userId)) return state;
    
    return {
      typingUsers: {
        ...state.typingUsers,
        [chatId]: [...currentTyping, userId]
      }
    };
  }),

  removeTypingUser: (chatId, userId) => set((state) => {
    const currentTyping = state.typingUsers[chatId] || [];
    return {
      typingUsers: {
        ...state.typingUsers,
        [chatId]: currentTyping.filter(id => id !== userId)
      }
    };
  }),

  // ===== ONLINE STATUS =====
  isUserOnline: (userId) => {
    if (!userId) return false;
    const onlineUserIds = get().onlineUsers || [];
    return onlineUserIds.includes(userId);
  },

  // ===== COMPUTED VALUES (Use these as getters, not direct properties) =====
  getFilteredChats: () => {
    const { chats, searchTerm, currentUser } = get();
    if (!searchTerm.trim()) return chats;
    
    const term = searchTerm.toLowerCase();
    const currentUserEmail = currentUser?.email || currentUser?.user?.email;

    return chats.filter((chat) => {
      const otherUser = chat.users?.find((u) => 
        u.email !== currentUserEmail && u.uid !== currentUser?.uid
      );
      return otherUser?.fullName?.toLowerCase().includes(term) ||
             otherUser?.displayName?.toLowerCase().includes(term);
    });
  },

  getFilteredUsers: () => {
    const { allUsers, chats, searchTerm, currentUser } = get();
    if (!searchTerm.trim()) return [];
    
    const term = searchTerm.toLowerCase();
    const currentUserEmail = currentUser?.email || currentUser?.user?.email;

    // Get all user emails/IDs that are already in chats
    const chatUserEmails = chats.flatMap(chat =>
      chat.users?.map(user => user.email || user.uid) || []
    );

    return allUsers.filter((user) => {
      const isNotCurrentUser = user.email !== currentUserEmail && user.uid !== currentUser?.uid;
      const isNotInExistingChat = !chatUserEmails.includes(user.email) && !chatUserEmails.includes(user.uid);
      const matchesSearch = (user.fullName || user.displayName || '').toLowerCase().includes(term);
      
      return isNotCurrentUser && isNotInExistingChat && matchesSearch;
    });
  },

  // ===== HELPER METHODS =====
  getTotalUnreadCount: () => {
    const unreadMessages = get().unreadMessages;
    return Object.values(unreadMessages).reduce((total, count) => total + count, 0);
  },

  getChatByParticipant: (userId) => {
    const { chats, currentUser } = get();
    const currentUserEmail = currentUser?.email || currentUser?.user?.email;
    
    return chats.find(chat => 
      chat.users?.some(user => 
        (user.email === userId || user.uid === userId) && 
        user.email !== currentUserEmail
      )
    );
  },

  // ===== CLEANUP METHODS =====
  clearChatData: () => set({
    chats: [],
    messages: {},
    unreadMessages: {},
    typingUsers: {},
    selectedChat: null,
    pendingMessages: new Set(),
    failedMessages: new Set()
  }),

  clearSearch: () => set({ searchTerm: '' }),
}));

export default useChatStore;