// import { create } from "zustand";
// import { axiosInstance } from "../lib/axios";
// import toast from "react-hot-toast";
// import { io } from "socket.io-client";
// const BASE_URL = import.meta.env.VITE_BASE_URL;
// export const useAuthStore = create((set, get) => ({
//   authUser: null,
//   isSigningUp: false,
//   isLoggingIn: false,
//   isUpdatingProfile: false,
//   onlineUsers: [],
//   typingUsers: [],
//   isCheckingAuth: true,
//   socket: null,
//   checkAuth: async () => {
//     try {
//       const res = await axiosInstance.get("/auth/check");
//       set({ authUser: res.data });
//       get().connectSocket();
//     } catch (error) {
//       set({ authUser: null });
//     } finally {
//       set({ isCheckingAuth: false });
//     }
//   },

//   signup: async (data) => {
//     set({ isSigningUp: true });
//     try {
//       const res = await axiosInstance.post("/auth/signup", data);
//       set({ authUser: res.data });
//       toast.success("Account created successfully");
//       get().connectSocket();
//     } catch (error) {
//       console.log("error in signup " + error);
//       toast.error(error.response.data.error);
//       console.log(error.response.data.error);
//     } finally {
//       set({ isSigningUp: false });
//     }
//   },

//   logout: async () => {
//     try {
//       await axiosInstance.post("/auth/logout");
//       set({ authUser: null });
//       toast.success("Logged out successfully");
//       get().disconnectSocket();
//     } catch (error) {
//       toast.error(error.response.data.error);
//     }
//   },

//   login: async (data) => {
//     set({ isLoggingIn: true });
//     try {
//       const res = await axiosInstance.post("/auth/login", data);
//       set({ authUser: res.data });
//       toast.success("Logged in successfully");
//       get().connectSocket();
//     } catch (error) {
//       console.log("error in login " + error.response.data.message);
//       toast.error(error.response.data.message);
//     } finally {
//       set({ isLoggingIn: false });
//     }
//   },

//   updateProfile: async (data) => {
//     set({ isUpdatingProfile: true });
//     try {
//       const res = await axiosInstance.put("/profile/update-profile", data);
//       set({ authUser: res.data });
//       toast.success("Profile updated successfully");
//     } catch (error) {
//       console.log("error in updateProfile " + error.response);
//     } finally {
//       set({ isUpdatingProfile: false });
//     }
//   },  
//   changePreference: async (value) => {
//     const userId = get().authUser._id;
//     try {
//       const res = await axiosInstance.put("/profile/update-preference", {value, userId});
//       set({ authUser: res.data });
//       toast.success("Preference updated successfully");
//     } catch (error) {
//       console.log("error in changePreference " + error.response);
//     }
//   },
//   connectSocket: () => {
//     const { authUser } = get();

//     if (!authUser || get().socket?.connected) return;

//     const socket = io(BASE_URL, {
//       query: {
//         userId: authUser._id,
//       },
//     });
//     socket.connect();
//     set({ socket: socket });
//     socket.on("getOnlineUsers", (userIds) => {
//         set({ onlineUsers: userIds });
//     })
//     socket.on("getTypingUsers", (userIds) => {
//         set({ typingUsers: userIds });
//     })    
//   },
//   disconnectSocket: () => {
//     if (get().socket?.connected) {
//       get().socket.disconnect();
//       set({ socket: null });
//     }
//   },
// }));
// useAuthStore.js with debug logging
import { create } from 'zustand';
import { axiosInstance } from '../lib/axios.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,

  checkAuth: async () => {
    try {
      console.log('🔍 Checking auth...');
      console.log('🍪 Current cookies:', document.cookie);
      
      const res = await axiosInstance.get('/auth/check');
      console.log('✅ Auth check successful:', res.data);
      set({ user: res.data, isCheckingAuth: false });
    } catch (error) {
      console.log('❌ Auth check failed:');
      console.log('Status:', error.response?.status);
      console.log('Error data:', error.response?.data);
      console.log('Request headers:', error.config?.headers);
      set({ user: null, isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      console.log('📝 Signing up...');
      const res = await axiosInstance.post('/auth/signup', data);
      console.log('✅ Signup successful:', res.data);
      console.log('🍪 Cookies after signup:', document.cookie);
      set({ user: res.data, isSigningUp: false });
    } catch (error) {
      console.log('❌ Signup failed:', error.response?.data);
      set({ isSigningUp: false });
      throw error;
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      console.log('🔐 Logging in...');
      const res = await axiosInstance.post('/auth/login', data);
      console.log('✅ Login successful:', res.data);
      console.log('🍪 Cookies after login:', document.cookie);
      set({ user: res.data, isLoggingIn: false });
      
      // Test auth check immediately after login
      console.log('🔍 Testing auth check after login...');
      await get().checkAuth();
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data);
      set({ isLoggingIn: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      console.log('🚪 Logging out...');
      await axiosInstance.post('/auth/logout');
      console.log('✅ Logout successful');
      console.log('🍪 Cookies after logout:', document.cookie);
      set({ user: null });
    } catch (error) {
      console.log('❌ Logout failed:', error.response?.data);
    }
  },
}));