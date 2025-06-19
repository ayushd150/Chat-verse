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
    clearAllMessages, 
    exportChatData, 
    setMessages,
    selectedUser,
    // Add these if they exist in your store
    clearChatHistory,
    deleteAllMessages
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
      // Try multiple approaches to ensure messages are cleared
      const clearPromises = [];
      
      // Method 1: Use the existing clearAllMessages function
      if (clearAllMessages) {
        clearPromises.push(clearAllMessages());
      }
      
      // Method 2: Use alternative clear functions if they exist
      if (clearChatHistory) {
        clearPromises.push(clearChatHistory());
      }
      
      if (deleteAllMessages) {
        clearPromises.push(deleteAllMessages());
      }
      
      // Method 3: Direct API call if the store functions don't work
      if (clearPromises.length === 0) {
        // Make direct API call to clear messages
        const response = await fetch('/api/messages/clear', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            // Add auth headers if needed
            'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth setup
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to clear messages from server');
        }
        
        clearPromises.push(Promise.resolve());
      }
      
      // Wait for all clear operations to complete
      await Promise.all(clearPromises);
      
      // Force clear local state as backup
      if (setMessages) {
        setMessages([]);
      }
      
      // If there's a way to refresh the chat data, do it
      if (typeof window !== 'undefined' && window.location) {
        // Optionally reload the page to ensure clean state
        // window.location.reload();
      }
      
      toast.success(`Successfully cleared ${messages?.length || 0} messages`);
      
    } catch (error) {
      console.error("Failed to clear messages:", error);
      
      // Try fallback method - direct state manipulation
      try {
        if (setMessages) {
          setMessages([]);
          toast.success('Messages cleared from local storage');
        } else {
          toast.error('Failed to clear messages. Please try refreshing the page.');
        }
      } catch (fallbackError) {
        console.error("Fallback clear also failed:", fallbackError);
        toast.error('Failed to clear messages. Please contact support.');
      }
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
      // Filter out messages with the selected user
      const remainingMessages = messages?.filter(msg => 
        msg.senderId !== selectedUser._id && msg.receiverId !== selectedUser._id
      ) || [];
      
      if (setMessages) {
        setMessages(remainingMessages);
      }
      
      // Make API call to clear specific user messages
      try {
        await fetch(`/api/messages/clear/${selectedUser._id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
      } catch (apiError) {
        console.warn('API call failed, but local state updated:', apiError);
      }
      
      toast.success(`Cleared ${userMessages.length} messages with ${selectedUser.fullName}`);
      
    } catch (error) {
      console.error("Failed to clear user messages:", error);
      toast.error('Failed to clear user messages');
    } finally {
      setIsClearingMessages(false);
    }
  };

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

            <div className="grid grid-cols-4 gap-3">
              {THEMES.slice(0, 8).map((t) => (
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
                  onClick={() => setTheme(t)}
                >
                  <div className="relative h-8 w-full rounded-lg overflow-hidden" data-theme={t}>
                    <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
                      <div className="rounded bg-primary"></div>
                      <div className="rounded bg-secondary"></div>
                      <div className="rounded bg-accent"></div>
                      <div className="rounded bg-neutral"></div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-white">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </button>
              ))}
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