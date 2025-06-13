import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const BASE_URL = import.meta.env.VITE_BASE_URL;

export const useAuthStore = create((set, get) => ({
  // State
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  typingUsers: [],
  socket: null,

  // Check authentication
  // Replace your checkAuth function temporarily with this debug version
checkAuth: async () => {
  try {
    console.log('🔍 Starting auth check...');
    console.log('🌐 Base URL:', import.meta.env.VITE_BASE_URL);
    console.log('🍪 All cookies:', document.cookie);
    
    // Check if we have a token cookie
    const tokenCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='));
    console.log('🎫 Token cookie:', tokenCookie);
    
    const res = await axiosInstance.get('/auth/check');
    console.log('✅ Auth check successful:', res.data);
    console.log('📊 Response status:', res.status);
    console.log('📋 Response headers:', res.headers);
    
    set({ authUser: res.data, isCheckingAuth: false });
    get().connectSocket();
    
    return res.data;
  } catch (error) {
    console.log('❌ Auth check failed:');
    console.log('📊 Status:', error.response?.status);
    console.log('📄 Error data:', error.response?.data);
    console.log('🌐 Request URL:', error.config?.url);
    console.log('📋 Request headers:', error.config?.headers);
    console.log('🍪 Cookies sent:', error.config?.headers?.Cookie);
    console.log('🔧 Full error:', error);
    
    set({ authUser: null, isCheckingAuth: false });
    return null;
  }
},

  // Signup
  signup: async (data) => {
  set({ isSigningUp: true });
  try {
    console.log('📝 Signing up...');
    const res = await axiosInstance.post('/auth/signup', data);
    console.log('✅ Signup successful:', res.data);
    
    // DON'T set authUser here - user should login separately
    // set({ authUser: res.data, isSigningUp: false }); // REMOVE THIS LINE
    set({ isSigningUp: false }); // Only set loading to false
    
    toast.success('Account created successfully! Please login with your credentials.');
    
    // DON'T connect socket here - user is not authenticated yet
    // get().connectSocket(); // REMOVE THIS LINE
    
    return res.data;
  } catch (error) {
    console.log('❌ Signup failed:', error.response?.data);
    const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Signup failed';
    toast.error(errorMessage);
    set({ isSigningUp: false });
    throw error;
  }
},

  // Login
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      console.log('🔐 Logging in...');
      const res = await axiosInstance.post('/auth/login', data);
      console.log('✅ Login successful:', res.data);
      console.log('🍪 Cookies after login:', document.cookie);
      
      set({ authUser: res.data, isLoggingIn: false });
      toast.success('Logged in successfully');
      get().connectSocket();
      
      // Test auth check immediately after login
      console.log('🔍 Testing auth check after login...');
      await get().checkAuth();
      
      return res.data;
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
      set({ isLoggingIn: false });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      console.log('🚪 Logging out...');
      await axiosInstance.post('/auth/logout');
      console.log('✅ Logout successful');
      console.log('🍪 Cookies after logout:', document.cookie);
      
      set({ authUser: null });
      toast.success('Logged out successfully');
      get().disconnectSocket();
    } catch (error) {
      console.log('❌ Logout failed:', error.response?.data);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Logout failed';
      toast.error(errorMessage);
    }
  },

  // Update Profile
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put('/profile/update-profile', data);
      set({ authUser: res.data });
      toast.success('Profile updated successfully');
      return res.data;
    } catch (error) {
      console.log('error in updateProfile:', error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Profile update failed';
      toast.error(errorMessage);
      throw error;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  // Change Preference
  changePreference: async (value) => {
    const userId = get().authUser?._id;
    if (!userId) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      const res = await axiosInstance.put('/profile/update-preference', { value, userId });
      set({ authUser: res.data });
      toast.success('Preference updated successfully');
      return res.data;
    } catch (error) {
      console.log('error in changePreference:', error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Preference update failed';
      toast.error(errorMessage);
      throw error;
    }
  },

  // Connect Socket
  connectSocket: () => {
    const { authUser } = get();

    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    
    socket.connect();
    set({ socket: socket });
    
    socket.on('getOnlineUsers', (userIds) => {
      set({ onlineUsers: userIds });
    });
    
    socket.on('getTypingUsers', (userIds) => {
      set({ typingUsers: userIds });
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });
  },

  // Disconnect Socket
  disconnectSocket: () => {
    if (get().socket?.connected) {
      get().socket.disconnect();
      set({ socket: null });
    }
  },

  // Helper function to check if user is authenticated
  isAuthenticated: () => {
    return !!get().authUser;
  },

  // Get current user
  getCurrentUser: () => {
    return get().authUser;
  },
}));