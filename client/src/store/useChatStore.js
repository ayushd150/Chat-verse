import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  liveMessages: {},
  isSocketListening: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      console.log("error in getUsers " + error.response?.data?.message);
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
    } catch (error) {
      console.log(error.response);
      toast.error(error.response?.data?.message || "Failed to get messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) return;
    
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  // Initialize socket listeners - call this once when app starts
  initializeSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket || get().isSocketListening) return;

    console.log("🔌 Initializing socket listeners for messages");

    // Listen for new messages globally
    socket.on("newMessage", (newMessage) => {
      const { selectedUser, messages } = get();
      console.log("📨 New message received:", newMessage);
      
      // If this message is for the currently selected conversation, add it to messages
      if (selectedUser && 
          (newMessage.senderId === selectedUser._id || newMessage.receiverId === selectedUser._id)) {
        set({ messages: [...messages, newMessage] });
      }
      
      // You might also want to update the users list here to show latest message preview
      // and update unread count
    });

    // Listen for live messages (typing indicators or live text)
    socket.on("liveMessage", ({ value, senderId }) => {
      console.log("⚡ Live message received:", { value, senderId });
      set(state => ({
        liveMessages: {
          ...state.liveMessages,
          [senderId]: value
        }
      }));
    });

    // Listen for typing indicators
    socket.on("userTyping", ({ senderId, isTyping }) => {
      // Handle typing indicators here
      console.log("⌨️ User typing:", { senderId, isTyping });
    });

    set({ isSocketListening: true });
  },

  // Clean up socket listeners
  cleanupSocketListeners: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    console.log("🧹 Cleaning up socket listeners");
    socket.off("newMessage");
    socket.off("liveMessage");
    socket.off("userTyping");
    set({ isSocketListening: false });
  },

  // Subscribe to messages for a specific user (deprecated - use initializeSocketListeners instead)
  subscribeToMessages: () => {
    console.warn("⚠️ subscribeToMessages is deprecated. Use initializeSocketListeners instead.");
    get().initializeSocketListeners();
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    // Clear live messages when switching users
    set({ liveMessages: {} });
  },

  setTypingUser: (value) => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;
    
    if (!socket || !selectedUser || !authUser) return;
    
    socket.emit("typing", { 
      receiverId: selectedUser._id, 
      senderId: authUser._id, 
      isTyping: value 
    });
  },

  sendLiveMessages: (value) => {
    const socket = useAuthStore.getState().socket;
    const { selectedUser } = get();
    const authUser = useAuthStore.getState().authUser;
    
    if (!socket || !selectedUser || !authUser) return;
    
    socket.emit("sendLiveMessages", {
      message: value,
      senderId: authUser._id,
      receiverId: selectedUser._id
    });
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