import React, { useState, useEffect } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { 
  Palette, 
  Bell, 
  Volume2, 
  VolumeX, 
  Settings,
  Loader2,
  Download,
  Trash2
} from "lucide-react";
import { THEMES } from "../constants";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { authUser, updateProfile } = useAuthStore();
  const { 
    messages, 
    selectedUser,
    users,
    getUsers
  } = useChatStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingMessages, setIsClearingMessages] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    darkMode: theme === 'dark'
  });

  useEffect(() => {
    if (authUser?.settings) {
      setSettings({
        notifications: authUser.settings.notifications ?? true,
        soundEffects: authUser.settings.soundEffects ?? true,
        darkMode: theme === 'dark'
      });
    }
  }, [authUser, theme]);

  const handleSettingChange = async (key, value) => {
    setIsLoading(true);
    
    try {
      setSettings(prev => ({ ...prev, [key]: value }));
      
      if (key === 'darkMode') {
        setTheme(value ? 'dark' : 'light');
      }
      
      if (updateProfile) {
        await updateProfile({ 
          settings: { ...settings, [key]: value }
        });
      }
      
      toast.success('Setting updated successfully');
    } catch (error) {
      console.error(`Failed to update ${key}:`, error);
      setSettings(prev => ({ ...prev, [key]: !value }));
      toast.error('Failed to update setting');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const exportData = {
        user: {
          id: authUser?.id,
          fullName: authUser?.fullName,
          email: authUser?.email
        },
        messages: messages || [],
        settings: settings,
        exportDate: new Date().toISOString()
      };
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `chat-export-${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error("Failed to export data:", error);
      toast.error('Failed to export data');
    }
  };

  const handleClearMessages = async () => {
    const confirmMessage = `Are you sure you want to clear all messages? This will delete ${messages?.length || 0} messages permanently and cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsClearingMessages(true);
    
    try {
      const messageCount = messages?.length || 0;
      
      // Try to clear from backend using your existing store methods or API
      try {
        const store = useChatStore.getState();
        
        // Check if there are any clear methods in the store
        if (typeof store.clearAllMessages === 'function') {
          await store.clearAllMessages();
        } else if (typeof store.clearMessages === 'function') {
          await store.clearMessages();
        } else {
          const response = await fetch('/api/messages/clear-all', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            credentials:'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to clear messages from server');
          }
        }
        
        toast.success(`Successfully cleared ${messageCount} messages`);
        
        // Refresh users list and messages to reflect changes
        if (getUsers) {
          await getUsers();
        }
        
        // If there's a way to refresh messages, do it
        if (selectedUser && typeof store.getMessages === 'function') {
          await store.getMessages(selectedUser._id);
        }
        
      } catch (apiError) {
        console.warn('Failed to clear messages from backend:', apiError);
        toast.error('Failed to clear messages from server. Please try again or contact support.');
      }
      
    } catch (error) {
      console.error("Failed to clear messages:", error);
      toast.error('Failed to clear messages. Please try again.');
    } finally {
      setIsClearingMessages(false);
    }
  };

  // Enhanced clear with specific user messages
  const handleClearUserMessages = async () => {
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }
    
    const userMessages = messages?.filter(msg => 
      msg.senderId === selectedUser._id || msg.receiverId === selectedUser._id
    ) || [];
    
    if (userMessages.length === 0) {
      toast.info('No messages to clear with this user');
      return;
    }
    
    const confirmMessage = `Are you sure you want to clear ${userMessages.length} messages with ${selectedUser.fullName}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setIsClearingMessages(true);
    
    try {
      // Try to clear specific user messages from backend
      try {
        const response = await fetch(`/api/messages/clear/${selectedUser._id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          credentials:'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear user messages from server');
        }
        
        toast.success(`Cleared ${userMessages.length} messages with ${selectedUser.fullName}`);
        
        // Refresh data
        if (getUsers) {
          await getUsers();
        }
        
        // Refresh current conversation messages
        const store = useChatStore.getState();
        if (typeof store.getMessages === 'function') {
          await store.getMessages(selectedUser._id);
        }
        
      } catch (apiError) {
        console.warn('API call failed:', apiError);
        toast.error('Failed to clear messages from server. Please try again.');
      }
      
    } catch (error) {
      console.error("Failed to clear user messages:", error);
      toast.error('Failed to clear user messages');
    } finally {
      setIsClearingMessages(false);
    }
  };

  // Define a smaller set of popular themes
  const availableThemes = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 
    'synthwave', 'retro', 'halloween', 'forest', 'lofi', 'dracula'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-purple-200">
                Welcome, {authUser?.fullName || 'User'}!
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Theme Selection */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="w-6 h-6 text-purple-300" />
              <h2 className="text-2xl font-bold text-white">Theme</h2>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {availableThemes.map((t) => (
                <button
                  key={t}
                  disabled={isLoading}
                  className={`
                    group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50
                    ${theme === t 
                      ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400" 
                      : "bg-white/5 hover:bg-white/10 border border-white/10"
                    }
                  `}
                  onClick={() => {
                    setTheme(t);
                    // Apply theme to current document for immediate visual feedback
                    document.documentElement.setAttribute('data-theme', t);
                    document.body.className = `theme-${t}`;
                    toast.success(`Theme changed to ${t}`);
                  }}
                >
                  <div className="relative h-6 w-full rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500">
                    {/* Theme preview colors */}
                    <div className="absolute inset-0 grid grid-cols-3 gap-0.5 p-0.5">
                      <div className={`rounded ${
                        t === 'dark' ? 'bg-gray-800' : 
                        t === 'light' ? 'bg-white' :
                        t === 'cupcake' ? 'bg-pink-200' :
                        t === 'bumblebee' ? 'bg-yellow-300' :
                        t === 'emerald' ? 'bg-emerald-500' :
                        t === 'corporate' ? 'bg-blue-600' :
                        t === 'synthwave' ? 'bg-purple-600' :
                        t === 'retro' ? 'bg-orange-400' :
                        t === 'halloween' ? 'bg-orange-600' :
                        t === 'forest' ? 'bg-green-700' :
                        t === 'lofi' ? 'bg-gray-400' :
                        t === 'dracula' ? 'bg-purple-800' :
                        'bg-blue-500'
                      }`}></div>
                      <div className={`rounded ${
                        t === 'dark' ? 'bg-gray-600' : 
                        t === 'light' ? 'bg-gray-100' :
                        'bg-white/50'
                      }`}></div>
                      <div className={`rounded ${
                        t === 'dark' ? 'bg-gray-400' : 
                        t === 'light' ? 'bg-gray-300' :
                        'bg-white/30'
                      }`}></div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-white">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-sm text-purple-200">
                Current theme: <span className="text-white font-medium">{theme}</span>
              </p>
            </div>
          </div>

          {/* App Settings */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">App Settings</h2>

            <div className="space-y-4">
              {/* Notifications */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-purple-300" />
                  <div>
                    <h3 className="text-white font-medium">Notifications</h3>
                    <p className="text-purple-200 text-sm">Get notified of new messages</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.notifications}
                    disabled={isLoading}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 peer-disabled:opacity-50"></div>
                </label>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  {settings.soundEffects ? 
                    <Volume2 className="w-5 h-5 text-purple-300" /> : 
                    <VolumeX className="w-5 h-5 text-purple-300" />
                  }
                  <div>
                    <h3 className="text-white font-medium">Sound Effects</h3>
                    <p className="text-purple-200 text-sm">Play sounds for notifications</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.soundEffects}
                    disabled={isLoading}
                    onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 peer-disabled:opacity-50"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Data Management</h2>
          
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={handleExportData}
              disabled={isLoading}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-xl text-white transition-all duration-300 disabled:opacity-50"
            >
              <Download className="w-5 h-5" />
              <div className="text-left">
                <div className="font-medium">Export Data</div>
                <div className="text-sm text-green-200">Download your messages</div>
              </div>
            </button>

            <button
              onClick={handleClearMessages}
              disabled={isClearingMessages}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 rounded-xl text-white transition-all duration-300 disabled:opacity-50"
            >
              {isClearingMessages ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              <div className="text-left">
                <div className="font-medium">
                  {isClearingMessages ? 'Clearing...' : 'Clear All Messages'}
                </div>
                <div className="text-sm text-red-200">
                  {isClearingMessages ? 'Please wait...' : 'Delete all chat history'}
                </div>
              </div>
            </button>
          </div>

          {/* Additional clear option for current user */}
          {selectedUser && (
            <button
              onClick={handleClearUserMessages}
              disabled={isClearingMessages}
              className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/30 rounded-xl text-white transition-all duration-300 disabled:opacity-50"
            >
              {isClearingMessages ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
              <div className="text-left">
                <div className="font-medium">
                  Clear Messages with {selectedUser.fullName}
                </div>
                <div className="text-sm text-orange-200">
                  Delete only messages with this user
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Enhanced Stats */}
        <div className="mt-8 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
          <div className="text-center">
            <p className="text-purple-200 text-lg mb-2">
              Total Messages: <span className="text-white font-bold">{messages?.length || 0}</span>
            </p>
            {selectedUser && (
              <p className="text-purple-200 text-sm">
                Messages with {selectedUser.fullName}: 
                <span className="text-white font-bold ml-1">
                  {messages?.filter(msg => 
                    msg.senderId === selectedUser._id || msg.receiverId === selectedUser._id
                  ).length || 0}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;