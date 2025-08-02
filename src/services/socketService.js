import { io } from 'socket.io-client'
import useChatStore from '../store/chatStore'

class SocketService {
    constructor() {
        this.socket = null
        this.reconnectAttempts = 0
        this.maxReconnectAttempts = 5
        this.reconnectDelay = 1000
    }

    connect(token) {
        try {
        this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001', {
            auth: {
            token
            },
            transports: ['websocket', 'polling'],
            timeout: 20000,
            reconnection: true,
            reconnectionDelay: this.reconnectDelay,
            reconnectionAttempts: this.maxReconnectAttempts
        })

        this.setupEventListeners()
        
        } catch (error) {
            console.error('Socket connection error:', error)
            useChatStore.getState().setError('Failed to connect to chat server')
        }
    }

    setupEventListeners() {
        if (!this.socket) return

        // Connection events
        this.socket.on('connect', () => {
            console.log('Connected to server')
            useChatStore.getState().setConnected(true)
            useChatStore.getState().setError(null)
            this.reconnectAttempts = 0
        })

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason)
            useChatStore.getState().setConnected(false)
            
            if (reason === 'io server disconnect') {
                // Server disconnected, try to reconnect
                this.handleReconnection()
            }
        })

        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error)
            useChatStore.getState().setConnected(false)
            useChatStore.getState().setError('Connection failed')
            this.handleReconnection()
        })

        // Chat events
        this.socket.on('chats:list', (chats) => {
            useChatStore.getState().setChats(chats)
        })

        this.socket.on('chat:new', (chat) => {
            useChatStore.getState().addChat(chat)
        })

        this.socket.on('chat:updated', ({ chatId, updates }) => {
            useChatStore.getState().updateChat(chatId, updates)
        })

        // Message events
        this.socket.on('message:new', ({ chatId, message }) => {
            useChatStore.getState().addMessage(chatId, {
                ...message,
                timestamp: new Date(message.timestamp)
            })
        })

        this.socket.on('message:sent', ({ tempId, message }) => {
            useChatStore.getState().confirmMessage(tempId, {
                ...message,
                timestamp: new Date(message.timestamp)
            })
        })

        this.socket.on('message:failed', ({ tempId, error }) => {
            console.error('Message failed:', error)
            useChatStore.getState().markMessageFailed(tempId)
        })

        this.socket.on('message:updated', ({ chatId, messageId, updates }) => {
            useChatStore.getState().updateMessage(chatId, messageId, updates)
        })

        this.socket.on('message:deleted', ({ chatId, messageId }) => {
            useChatStore.getState().deleteMessage(chatId, messageId)
        })

        // Typing events
        this.socket.on('user:typing', ({ chatId, userId, isTyping }) => {
            useChatStore.getState().setUserTyping(chatId, userId, isTyping)
        })

        // Online status events
        this.socket.on('users:online', (userIds) => {
            useChatStore.getState().setOnlineUsers(userIds)
        })

        this.socket.on('user:online', (userId) => {
            useChatStore.getState().addOnlineUser(userId)
        })

        this.socket.on('user:offline', (userId) => {
            useChatStore.getState().removeOnlineUser(userId)
        })

        // Error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error)
            useChatStore.getState().setError(error.message || 'An error occurred')
        })
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1) // Exponential backoff
            
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
                if (this.socket) {
                    this.socket.connect()
                }
            }, delay)
        } else {
            useChatStore.getState().setError('Unable to connect to chat server. Please refresh the page.')
        }
    }

    // Message operations
    sendMessage(chatId, text) {
        if (!this.socket?.connected) {
            useChatStore.getState().setError('Not connected to server')
            return null
        }

        const tempId = useChatStore.getState().sendMessage(chatId, text)
        
        this.socket.emit('message:send', {
            tempId,
            chatId,
            text,
            timestamp: new Date().toISOString()
        })

        return tempId
    }

    editMessage(chatId, messageId, newText) {
        if (!this.socket?.connected) return

        this.socket.emit('message:edit', {
            chatId,
            messageId,
            text: newText
        })
    }

    deleteMessage(chatId, messageId) {
        if (!this.socket?.connected) return

        this.socket.emit('message:delete', {
        chatId,
        messageId
        })
    }

    // Typing indicators
    sendTyping(chatId, isTyping) {
        if (!this.socket?.connected) return

        this.socket.emit('user:typing', {
        chatId,
        isTyping
        })
    }

    // Chat operations
    createChat(participants) {
        if (!this.socket?.connected) return

        this.socket.emit('chat:create', {
        participants
        })
    }

    joinChat(chatId) {
        if (!this.socket?.connected) return

        this.socket.emit('chat:join', { chatId })
    }

    leaveChat(chatId) {
        if (!this.socket?.connected) return

        this.socket.emit('chat:leave', { chatId })
    }

    // Utility methods
    disconnect() {
        if (this.socket) {
        this.socket.disconnect()
        this.socket = null
        }
        useChatStore.getState().setConnected(false)
    }

    isConnected() {
        return this.socket?.connected || false
    }

    // Cleanup
    removeAllListeners() {
        if (this.socket) {
        this.socket.removeAllListeners()
        }
    }
    }

// Create singleton instance
const socketService = new SocketService()

export default socketService

// Hook for easier usage in components
export const useSocket = () => {
  return {
    connect: socketService.connect.bind(socketService),
    disconnect: socketService.disconnect.bind(socketService),
    sendMessage: socketService.sendMessage.bind(socketService),
    sendTyping: socketService.sendTyping.bind(socketService),
    isConnected: socketService.isConnected.bind(socketService),
    editMessage: socketService.editMessage.bind(socketService),
    deleteMessage: socketService.deleteMessage.bind(socketService),
    createChat: socketService.createChat.bind(socketService),
    joinChat: socketService.joinChat.bind(socketService),
    leaveChat: socketService.leaveChat.bind(socketService)
  }
}