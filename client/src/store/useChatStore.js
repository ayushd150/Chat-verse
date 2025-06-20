import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  liveMessages: {},
  isSocketListening: false,
  unreadMessages: {}, // Object to track unread messages per user
  typingUsers: {}, // Track who is typing
  
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
      
      // Mark messages as read when opening chat
      get().markMessagesAsRead(userId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;
    
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
      
      // Emit socket event for real-time delivery
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("messageSent", {
          message: res.data,
          receiverId: selectedUser._id
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // NEW: Mark messages as read
  markMessagesAsRead: async (userId) => {
    try {
      // API call to mark messages as read
      await axiosInstance.put(`/messages/mark-read/${userId}`);
      
      // Update local state
      const { unreadMessages } = get();
      const updatedUnreadMessages = { ...unreadMessages };
      delete updatedUnreadMessages[userId];
      set({ unreadMessages: updatedUnreadMessages });
      
      // Update messages state to reflect read status
      const { messages } = get();
      const updatedMessages = messages.map(msg => {
        if (msg.receiverId === useAuthStore.getState().authUser._id && 
            msg.senderId === userId && 
            !msg.isRead) {
          return { ...msg, isRead: true, readAt: new Date() };
        }
        return msg;
      });
      set({ messages: updatedMessages });
      
      // Emit socket event to notify sender
      const socket = useAuthStore.getState().socket;
      if (socket) {
        socket.emit("messagesRead", {
          userId: userId,
          readBy: useAuthStore.getState().authUser._id
        });
      }
    } catch (error) {
      console.error("Failed to mark messages as read:", error);
    }
  },

  // Initialize socket listeners - enhanced with read status
  initializeSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket || get().isSocketListening) return;

    console.log("🔌 Initializing socket listeners for messages");

    // Listen for new messages
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();
      console.log("📨 New message received:", newMessage);
      
      // If this message is for the currently selected conversation, add it to messages
      if (selectedUser && 
          (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)) {
        set({ messages: [...messages, newMessage] });
        
        // Auto-mark as read if chat is open and message is from other user
        if (newMessage.senderId === selectedUser._id) {
          setTimeout(() => {
            get().markMessagesAsRead(selectedUser._id);
          }, 1000); // Small delay to ensure message is displayed
        }
      } else {
        // Add to unread messages for other users
        get().addUnreadMessage(newMessage.senderId);
      }
    });

    // NEW: Listen for message read confirmations
    socket.on("messageRead", (data) => {
      console.log("👁️ Message read confirmation:", data);
      const { messages } = get();
      const updatedMessages = messages.map(msg => {
        if (msg.senderId === useAuthStore.getState().authUser._id && 
            msg.receiverId === data.userId) {
          return { ...msg, isRead: true, readAt: new Date() };
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    // NEW: Listen for bulk messages read
    socket.on("messagesRead", (data) => {
      console.log("📖 Bulk messages read:", data);
      const { messages } = get();
      const updatedMessages = messages.map(msg => {
        if (msg.senderId === useAuthStore.getState().authUser._id && 
            msg.receiverId === data.readBy) {
          return { ...msg, isRead: true, readAt: new Date() };
        }
        return msg;
      });
      set({ messages: updatedMessages });
    });

    // Listen for typing indicators
    socket.on("userTyping", ({ senderId, isTyping, inputValue }) => {
      console.log("⌨️ User typing:", { senderId, isTyping });
      const { typingUsers } = get();
      
      if (isTyping) {
        set({
          typingUsers: {
            ...typingUsers,
            [senderId]: { isTyping: true, text: inputValue || "" }
          }
        });
      } else {
        const updatedTypingUsers = { ...typingUsers };
        delete updatedTypingUsers[senderId];
        set({ typingUsers: updatedTypingUsers });
      }
    });

    // Listen for live messages (real-time text preview)
    socket.on("liveMessage", ({ value, senderId }) => {
      console.log("⚡ Live message received:", { value, senderId });
      set(state => ({
        liveMessages: {
          ...state.liveMessages,
          [senderId]: value
        }
      }));
    });

    set({ isSocketListening: true });
  },

  // Clean up socket listeners
  cleanupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    console.log("🧹 Cleaning up socket listeners");
    socket.off("newMessage");
    socket.off("messageRead");
    socket.off("messagesRead");
    socket.off("userTyping");
    socket.off("liveMessage");
    set({ isSocketListening: false });
  },

  // Subscribe to messages for a specific user (deprecated - use initializeSocketListeners instead)
  subscribeToMessages: () => {
    console.warn("⚠️ subscribeToMessages is deprecated. Use initializeSocketListeners instead.");
    get().initializeSocketListeners();
  },

  unsubscribeFromMessages: () => {
    get().cleanupSocketListeners();
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    // Clear live messages and typing indicators when switching users
    set({ liveMessages: {}, typingUsers: {} });
    
    // Mark messages as read when selecting a user
    if (selectedUser) {
      get().markMessagesAsRead(selectedUser._id);
    }
  },

  // Add unread message for a specific user
  addUnreadMessage: (userId) => {
    const { unreadMessages } = get();
    set({
      unreadMessages: {
        ...unreadMessages,
        [userId]: (unreadMessages[userId] || 0) + 1
      }
    });
  },

  // Get unread count for a specific user
  getUnreadCount: (userId) => {
    const { unreadMessages } = get();
    return unreadMessages[userId] || 0;
  },

  // Get total unread count
  getTotalUnreadCount: () => {
    const { unreadMessages } = get();
    return Object.values(unreadMessages).reduce((total, count) => total + count, 0);
  },

  // Check if user is typing
  isUserTyping: (userId) => {
    const { typingUsers } = get();
    return typingUsers[userId]?.isTyping || false;
  },

  // Get typing text for user
  getTypingText: (userId) => {
    const { typingUsers } = get();
    return typingUsers[userId]?.text || "";
  },

  // Utility functions for message status
  isMessageRead: (message) => {
    return message.isRead || false;
  },

  isMessageSent: (message) => {
    return !!message._id; // If message has ID, it's been sent to server
  },

  // Clear live message for a specific user
  clearLiveMessage: (senderId) => {
    set(state => {
      const newLiveMessages = { ...state.liveMessages };
      delete newLiveMessages[senderId];
      return { liveMessages: newLiveMessages };
    });
  },

  // Get live message for a specific user
  getLiveMessage: (senderId) => {
    return get().liveMessages[senderId] || "";
  }
}));