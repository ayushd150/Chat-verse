import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

// Configuration object for customizable settings
const AUTH_CONFIG = {
  // Storage keys - can be customized per app
  TOKEN_KEY: import.meta.env.VITE_TOKEN_KEY || "chat_access_token",
  REFRESH_TOKEN_KEY: import.meta.env.VITE_REFRESH_TOKEN_KEY || "chat_refresh_token",
  REMEMBER_ME_KEY: import.meta.env.VITE_REMEMBER_ME_KEY || "chat_remember_me",
  USER_KEY: import.meta.env.VITE_USER_KEY || "chat_user",
  
  // API endpoints - configurable
  ENDPOINTS: {
    LOGIN: import.meta.env.VITE_LOGIN_ENDPOINT || "/auth/login",
    SIGNUP: import.meta.env.VITE_SIGNUP_ENDPOINT || "/auth/signup",
    LOGOUT: import.meta.env.VITE_LOGOUT_ENDPOINT || "/auth/logout",
    CHECK_AUTH: import.meta.env.VITE_CHECK_AUTH_ENDPOINT || "/auth/check",
    REFRESH_TOKEN: import.meta.env.VITE_REFRESH_TOKEN_ENDPOINT || "/auth/refresh",
    FORGOT_PASSWORD: import.meta.env.VITE_FORGOT_PASSWORD_ENDPOINT || "/auth/forgot-password",
    RESET_PASSWORD: import.meta.env.VITE_RESET_PASSWORD_ENDPOINT || "/auth/reset-password",
    UPDATE_PROFILE: import.meta.env.VITE_UPDATE_PROFILE_ENDPOINT || "/auth/update-profile",
    STORAGE_INFO: import.meta.env.VITE_STORAGE_INFO_ENDPOINT || "/auth/storage-info",
    CLEAR_DATA: import.meta.env.VITE_CLEAR_DATA_ENDPOINT || "/auth/clear-data"
  },
  
  // Socket configuration
  SOCKET_URL: import.meta.env.VITE_BASE_URL || window.location.origin,
  SOCKET_OPTIONS: {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
    transports: ['websocket', 'polling'],
    upgrade: true,
    ...JSON.parse(import.meta.env.VITE_SOCKET_OPTIONS || "{}")
  },
  
  // Toast messages - customizable
  MESSAGES: {
    SIGNUP_SUCCESS: import.meta.env.VITE_MSG_SIGNUP_SUCCESS || "Account created successfully! Please log in.",
    SIGNUP_ERROR: import.meta.env.VITE_MSG_SIGNUP_ERROR || "Failed to create account",
    LOGIN_WELCOME: import.meta.env.VITE_MSG_LOGIN_WELCOME || "Welcome back, {name}!",
    LOGIN_ERROR: import.meta.env.VITE_MSG_LOGIN_ERROR || "Login failed",
    LOGOUT_SUCCESS: import.meta.env.VITE_MSG_LOGOUT_SUCCESS || "Logged out successfully",
    SESSION_EXPIRED: import.meta.env.VITE_MSG_SESSION_EXPIRED || "Session expired. Please log in again.",
    PROFILE_UPDATE_SUCCESS: import.meta.env.VITE_MSG_PROFILE_SUCCESS || "Profile updated successfully!",
    PROFILE_UPDATE_ERROR: import.meta.env.VITE_MSG_PROFILE_ERROR || "Failed to update profile",
    RESET_EMAIL_SUCCESS: import.meta.env.VITE_MSG_RESET_EMAIL_SUCCESS || "Password reset email sent! Check your inbox.",
    RESET_EMAIL_ERROR: import.meta.env.VITE_MSG_RESET_EMAIL_ERROR || "Failed to send reset email",
    RESET_PASSWORD_SUCCESS: import.meta.env.VITE_MSG_RESET_SUCCESS || "Password reset successfully! Please log in with your new password.",
    RESET_PASSWORD_ERROR: import.meta.env.VITE_MSG_RESET_ERROR || "Failed to reset password",
    DATA_CLEAR_SUCCESS: import.meta.env.VITE_MSG_DATA_CLEAR_SUCCESS || "All user data cleared successfully",
    DATA_CLEAR_ERROR: import.meta.env.VITE_MSG_DATA_CLEAR_ERROR || "Failed to clear user data"
  },
  
  // Feature flags
  FEATURES: {
    AUTO_LOGIN_AFTER_SIGNUP: import.meta.env.VITE_AUTO_LOGIN_AFTER_SIGNUP === "true",
    ENABLE_SOCKET: import.meta.env.VITE_ENABLE_SOCKET !== "false",
    ENABLE_REMEMBER_ME: import.meta.env.VITE_ENABLE_REMEMBER_ME !== "false",
    ENABLE_AUTO_REFRESH: import.meta.env.VITE_ENABLE_AUTO_REFRESH !== "false",
    SHOW_TOAST_MESSAGES: import.meta.env.VITE_SHOW_TOAST_MESSAGES !== "false"
  }
};

// Token management utilities
const setTokens = (accessToken, refreshToken = null, rememberMe = false) => {
  if (rememberMe && AUTH_CONFIG.FEATURES.ENABLE_REMEMBER_ME) {
    localStorage.setItem(AUTH_CONFIG.TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    }
    localStorage.setItem(AUTH_CONFIG.REMEMBER_ME_KEY, "true");
  } else {
    sessionStorage.setItem(AUTH_CONFIG.TOKEN_KEY, accessToken);
    if (refreshToken) {
      sessionStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    }
    localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REMEMBER_ME_KEY);
  }
};

const getStoredToken = () => {
  return localStorage.getItem(AUTH_CONFIG.TOKEN_KEY) || sessionStorage.getItem(AUTH_CONFIG.TOKEN_KEY);
};

const getStoredRefreshToken = () => {
  return localStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY) || sessionStorage.getItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
};

const getRememberMeStatus = () => {
  return localStorage.getItem(AUTH_CONFIG.REMEMBER_ME_KEY) === "true";
};

const clearTokens = () => {
  localStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.REMEMBER_ME_KEY);
  localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.TOKEN_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
};

const setStoredUser = (user, rememberMe = false) => {
  const storage = (rememberMe && AUTH_CONFIG.FEATURES.ENABLE_REMEMBER_ME) ? localStorage : sessionStorage;
  storage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
  
  if (!rememberMe || !AUTH_CONFIG.FEATURES.ENABLE_REMEMBER_ME) {
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
  }
};

const getStoredUser = () => {
  const stored = localStorage.getItem(AUTH_CONFIG.USER_KEY) || sessionStorage.getItem(AUTH_CONFIG.USER_KEY);
  return stored ? JSON.parse(stored) : null;
};

const showToast = (type, message) => {
  if (AUTH_CONFIG.FEATURES.SHOW_TOAST_MESSAGES) {
    toast[type](message);
  }
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: false,
  isSendingResetEmail: false,
  isResettingPassword: false,
  onlineUsers: [],
  socket: null,
  rememberMe: getRememberMeStatus(),
  config: AUTH_CONFIG,
  socketReconnectAttempts: 0,
  lastMessageTimestamp: null,

  updateConfig: (newConfig) => {
    Object.assign(AUTH_CONFIG, newConfig);
    set({});
  },

  initializeAuth: async () => {
    const token = getStoredToken();
    const storedUser = getStoredUser();
    const rememberMe = getRememberMeStatus();

    if (token && storedUser) {
      set({ 
        authUser: storedUser, 
        rememberMe,
        isCheckingAuth: false 
      });
      
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      try {
        await get().checkAuth();
      } catch (error) {
        if (AUTH_CONFIG.FEATURES.ENABLE_AUTO_REFRESH) {
          await get().refreshAuthToken();
        }
      }
    } else {
      set({ isCheckingAuth: false });
    }
  },

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const token = getStoredToken();
      
      if (!token) {
        set({ authUser: null, isCheckingAuth: false });
        return;
      }

      const res = await axiosInstance.get(AUTH_CONFIG.ENDPOINTS.CHECK_AUTH);
      
      if (res.data.user) {
        set({ authUser: res.data.user });
        
        if (AUTH_CONFIG.FEATURES.ENABLE_SOCKET) {
          get().connectSocket();
        }
        
        setStoredUser(res.data.user, get().rememberMe);
      } else {
        await get().logout();
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      
      const refreshToken = getStoredRefreshToken();
      if (refreshToken && AUTH_CONFIG.FEATURES.ENABLE_AUTO_REFRESH) {
        const refreshSuccess = await get().refreshAuthToken();
        if (!refreshSuccess) {
          await get().logout();
        }
      } else {
        await get().logout();
      }
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  refreshAuthToken: async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const res = await axiosInstance.post(AUTH_CONFIG.ENDPOINTS.REFRESH_TOKEN, {
        refreshToken
      });

      if (res.data.accessToken) {
        const { accessToken, refreshToken: newRefreshToken, user } = res.data;
        const rememberMe = get().rememberMe;
        
        setTokens(accessToken, newRefreshToken, rememberMe);
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        
        set({ authUser: user });
        setStoredUser(user, rememberMe);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post(AUTH_CONFIG.ENDPOINTS.SIGNUP, data);
      
      if (res.data.success) {
        set({ isSigningUp: false });
        
        if (AUTH_CONFIG.FEATURES.AUTO_LOGIN_AFTER_SIGNUP && res.data.accessToken) {
          const { accessToken, refreshToken, user } = res.data;
          const rememberMe = get().rememberMe;
          
          setTokens(accessToken, refreshToken, rememberMe);
          setStoredUser(user, rememberMe);
          
          set({ authUser: user });
          axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
          
          if (AUTH_CONFIG.FEATURES.ENABLE_SOCKET) {
            get().connectSocket();
          }
          
          showToast("success", AUTH_CONFIG.MESSAGES.LOGIN_WELCOME.replace("{name}", user.fullName));
        } else {
          showToast("success", AUTH_CONFIG.MESSAGES.SIGNUP_SUCCESS);
        }
        
        return { success: true };
      }
    } catch (error) {
      console.error("Signup error:", error);
      showToast("error", error.response?.data?.message || AUTH_CONFIG.MESSAGES.SIGNUP_ERROR);
      set({ isSigningUp: false });
      throw error;
    }
  },

  login: async (data, rememberMe = false) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post(AUTH_CONFIG.ENDPOINTS.LOGIN, {
        ...data,
        rememberMe
      });
      
      if (res.data.accessToken) {
        const { accessToken, refreshToken, user } = res.data;
        
        setTokens(accessToken, refreshToken, rememberMe);
        setStoredUser(user, rememberMe);
        
        set({ 
          authUser: user, 
          rememberMe,
          isLoggingIn: false 
        });
        
        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        
        if (AUTH_CONFIG.FEATURES.ENABLE_SOCKET) {
          get().connectSocket();
        }
        
        showToast("success", AUTH_CONFIG.MESSAGES.LOGIN_WELCOME.replace("{name}", user.fullName));
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast("error", error.response?.data?.message || AUTH_CONFIG.MESSAGES.LOGIN_ERROR);
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      const refreshToken = getStoredRefreshToken();
      
      if (refreshToken) {
        await axiosInstance.post(AUTH_CONFIG.ENDPOINTS.LOGOUT, { refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearTokens();
      delete axiosInstance.defaults.headers.common["Authorization"];
      
      if (get().socket?.connected) {
        get().socket.disconnect();
      }
      
      set({ 
        authUser: null, 
        socket: null, 
        rememberMe: false,
        onlineUsers: [],
        socketReconnectAttempts: 0,
        lastMessageTimestamp: null
      });
      
      showToast("success", AUTH_CONFIG.MESSAGES.LOGOUT_SUCCESS);
    }
  },

  forceLogout: () => {
    clearTokens();
    delete axiosInstance.defaults.headers.common["Authorization"];
    
    if (get().socket?.connected) {
      get().socket.disconnect();
    }
    
    set({ 
      authUser: null, 
      socket: null, 
      rememberMe: false,
      onlineUsers: [],
      socketReconnectAttempts: 0,
      lastMessageTimestamp: null
    });
    
    showToast("error", AUTH_CONFIG.MESSAGES.SESSION_EXPIRED);
  },

  sendResetPasswordEmail: async (email) => {
    set({ isSendingResetEmail: true });
    try {
      const res = await axiosInstance.post(AUTH_CONFIG.ENDPOINTS.FORGOT_PASSWORD, { email });
      
      if (res.data.success) {
        showToast("success", AUTH_CONFIG.MESSAGES.RESET_EMAIL_SUCCESS);
        return { success: true };
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      showToast("error", error.response?.data?.message || AUTH_CONFIG.MESSAGES.RESET_EMAIL_ERROR);
      throw error;
    } finally {
      set({ isSendingResetEmail: false });
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ isResettingPassword: true });
    try {
      const res = await axiosInstance.post(AUTH_CONFIG.ENDPOINTS.RESET_PASSWORD, {
        token,
        password: newPassword
      });
      
      if (res.data.success) {
        showToast("success", AUTH_CONFIG.MESSAGES.RESET_PASSWORD_SUCCESS);
        return { success: true };
      }
    } catch (error) {
      console.error("Reset password error:", error);
      showToast("error", error.response?.data?.message || AUTH_CONFIG.MESSAGES.RESET_PASSWORD_ERROR);
      throw error;
    } finally {
      set({ isResettingPassword: false });
    }
  },

  // FIXED updateProfile function with better state management
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    
    try {
      console.log("🔄 Starting profile update with data:", data);
      
      // Validate email format if email is being updated
      if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          const error = new Error("Invalid email format");
          set({ isUpdatingProfile: false });
          return { success: false, error: error.message };
        }
      }
      
      const res = await axiosInstance.put(AUTH_CONFIG.ENDPOINTS.UPDATE_PROFILE, data);
      console.log("📥 Backend response:", res.data);
      
      // Handle explicit failure response
      if (res.data.success === false) {
        const errorMessage = res.data.message || AUTH_CONFIG.MESSAGES.PROFILE_UPDATE_ERROR;
        console.error("❌ Backend indicated failure:", res.data);
        set({ isUpdatingProfile: false });
        return { success: false, error: errorMessage, details: res.data };
      }
      
      // Check if we have user data to update the state
      if (res.data.user || res.data.success !== false) {
        const currentAuthUser = get().authUser;
        
        // Create updated user object - prioritize backend data, fallback to sent data
        const updatedUser = {
          ...currentAuthUser,
          ...(res.data.user || {}),
          // Ensure critical fields are updated
          ...(data.email && { email: data.email }),
          ...(data.fullName && { fullName: data.fullName }),
          ...(data.profilePic && { profilePic: data.profilePic })
        };
        
        console.log("🔄 Updating authUser state:");
        console.log("📤 Original:", currentAuthUser);
        console.log("📥 Updated:", updatedUser);
        
        // Force state update with new reference
        set({ 
          authUser: { ...updatedUser }, // Create new object reference to trigger re-renders
          isUpdatingProfile: false 
        });
        
        // Update stored user
        setStoredUser(updatedUser, get().rememberMe);
        
        // Emit socket event if connected
        if (get().socket?.connected) {
          get().socket.emit('userUpdated', updatedUser);
        }
        
        // Success toast
        showToast("success", AUTH_CONFIG.MESSAGES.PROFILE_UPDATE_SUCCESS);
        
        // Verify state update after a short delay
        setTimeout(() => {
          const finalState = get().authUser;
          console.log("✅ Final state verification:", finalState);
          if (data.email && finalState.email !== data.email) {
            console.error("⚠️ State update failed - email mismatch");
          }
        }, 100);
        
        return {
          success: true,
          user: updatedUser,
          message: "Profile updated successfully"
        };
      } else {
        // No user data returned and no explicit success
        console.error("❌ No user data in response and no success flag");
        set({ isUpdatingProfile: false });
        return {
          success: false,
          error: "No user data returned from server",
          details: res.data
        };
      }
      
    } catch (error) {
      console.error("❌ Profile update error:", error);
      
      const errorMessage = error.response?.data?.message || error.message || AUTH_CONFIG.MESSAGES.PROFILE_UPDATE_ERROR;
      set({ isUpdatingProfile: false });
      
      return {
        success: false,
        error: errorMessage,
        details: error.response?.data
      };
    }
  },

  // Enhanced socket connection with better message handling
  connectSocket: () => {
    const { authUser, socket, socketReconnectAttempts } = get();
    
    if (!authUser || socket?.connected || !AUTH_CONFIG.FEATURES.ENABLE_SOCKET) {
      console.log("🚫 Socket connection skipped:", {
        hasUser: !!authUser,
        isConnected: socket?.connected,
        socketEnabled: AUTH_CONFIG.FEATURES.ENABLE_SOCKET
      });
      return;
    }

    console.log("🔌 Connecting socket for user:", authUser._id);

    const newSocket = io(AUTH_CONFIG.SOCKET_URL, {
      ...AUTH_CONFIG.SOCKET_OPTIONS,
      auth: {
        userId: authUser._id,
        token: getStoredToken(),
      },
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("✅ Socket connected successfully");
      console.log("🆔 Socket ID:", newSocket.id);
      set({ socketReconnectAttempts: 0 });
      
      // Request initial data
      setTimeout(() => {
        newSocket.emit("getOnlineUsers");
        newSocket.emit("getUnreadMessages");
      }, 500);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Socket disconnected:", reason);
      
      if (reason === "io server disconnect") {
        setTimeout(() => {
          if (socketReconnectAttempts < 3) {
            console.log("🔄 Attempting to reconnect...");
            newSocket.connect();
            set({ socketReconnectAttempts: socketReconnectAttempts + 1 });
          }
        }, 2000);
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
      set({ socketReconnectAttempts: 0 });
    });

    // Online users events
    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("👥 Online users updated:", userIds);
      set({ onlineUsers: userIds });
    });

    newSocket.on("userConnected", (userId) => {
      console.log("✅ User connected:", userId);
      const currentOnlineUsers = get().onlineUsers;
      if (!currentOnlineUsers.includes(userId)) {
        set({ onlineUsers: [...currentOnlineUsers, userId] });
      }
    });

    newSocket.on("userDisconnected", (userId) => {
      console.log("❌ User disconnected:", userId);
      const currentOnlineUsers = get().onlineUsers;
      set({ onlineUsers: currentOnlineUsers.filter(id => id !== userId) });
    });

    // Message events for unread detection
    newSocket.on("newMessage", (message) => {
      console.log("📨 New message received:", message);
      set({ lastMessageTimestamp: Date.now() });
      window.dispatchEvent(new CustomEvent('newMessage', { detail: message }));
    });

    newSocket.on("messageRead", (data) => {
      console.log("👁️ Message marked as read:", data);
      window.dispatchEvent(new CustomEvent('messageRead', { detail: data }));
    });

    newSocket.on("unreadCount", (count) => {
      console.log("📬 Unread messages count:", count);
      window.dispatchEvent(new CustomEvent('unreadCount', { detail: count }));
    });

    newSocket.on("error", (error) => {
      console.error("🚨 Socket error:", error);
    });

    newSocket.connect();
    set({ socket: newSocket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
      console.log("🔌 Disconnecting socket...");
      socket.disconnect();
    }
    set({ socket: null, onlineUsers: [], socketReconnectAttempts: 0 });
  },

  refreshSocket: () => {
    console.log("🔄 Refreshing socket connection...");
    get().disconnectSocket();
    setTimeout(() => {
      get().connectSocket();
    }, 1000);
  },

  getSocketStatus: () => {
    const socket = get().socket;
    return {
      connected: socket?.connected || false,
      id: socket?.id || null,
      transport: socket?.io?.engine?.transport?.name || null,
      reconnectAttempts: get().socketReconnectAttempts
    };
  },

  toggleRememberMe: () => {
    if (!AUTH_CONFIG.FEATURES.ENABLE_REMEMBER_ME) return;
    
    const newRememberMe = !get().rememberMe;
    set({ rememberMe: newRememberMe });
    
    if (!newRememberMe) {
      const token = getStoredToken();
      const refreshToken = getStoredRefreshToken();
      const user = getStoredUser();
      
      if (token) {
        clearTokens();
        sessionStorage.setItem(AUTH_CONFIG.TOKEN_KEY, token);
        if (refreshToken) {
          sessionStorage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
        }
        if (user) {
          sessionStorage.setItem(AUTH_CONFIG.USER_KEY, JSON.stringify(user));
        }
      }
    }
  },

  getStorageInfo: async () => {
    try {
      const res = await axiosInstance.get(AUTH_CONFIG.ENDPOINTS.STORAGE_INFO);
      return res.data;
    } catch (error) {
      console.error("Failed to get storage info:", error);
      
      if (error.response?.status === 404) {
        console.warn("Storage info endpoint not implemented on backend");
        return {
          used: 0,
          quota: "Unknown",
          version: import.meta.env.VITE_APP_VERSION || "1.0.0",
          error: "Storage API not available"
        };
      }
      
      try {
        let storageUsed = 0;
        
        if (typeof localStorage !== 'undefined') {
          let localStorageSize = 0;
          for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
              localStorageSize += localStorage[key].length + key.length;
            }
          }
          storageUsed += localStorageSize;
        }
        
        if (typeof sessionStorage !== 'undefined') {
          let sessionStorageSize = 0;
          for (let key in sessionStorage) {
            if (sessionStorage.hasOwnProperty(key)) {
              sessionStorageSize += sessionStorage[key].length + key.length;
            }
          }
          storageUsed += sessionStorageSize;
        }
        
        return {
          used: storageUsed,
          quota: "5MB (estimated)",
          version: import.meta.env.VITE_APP_VERSION || "1.0.0",
          source: "client-calculated"
        };
        
      } catch (clientError) {
        console.error("Failed to calculate client storage:", clientError);
        return {
          used: 0,
          quota: "Unknown",
          version: import.meta.env.VITE_APP_VERSION || "1.0.0",
          error: "Storage calculation failed"
        };
      }
    }
  },

  clearUserData: async () => {
    try {
      await axiosInstance.post(AUTH_CONFIG.ENDPOINTS.CLEAR_DATA);
      showToast("success", AUTH_CONFIG.MESSAGES.DATA_CLEAR_SUCCESS);
    } catch (error) {
      console.error("Failed to clear user data:", error);
      showToast("error", AUTH_CONFIG.MESSAGES.DATA_CLEAR_ERROR);
      throw error;
    }
  }
}));

// Enhanced axios interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && AUTH_CONFIG.FEATURES.ENABLE_AUTO_REFRESH) {
      originalRequest._retry = true;
      
      const authStore = useAuthStore.getState();
      const refreshSuccess = await authStore.refreshAuthToken();
      
      if (refreshSuccess) {
        const newToken = getStoredToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } else {
        authStore.forceLogout();
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Initialize auth on store creation
if (typeof window !== "undefined") {
  const authStore = useAuthStore.getState();
  authStore.initializeAuth();
}