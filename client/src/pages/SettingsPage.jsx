import React, { useState } from "react";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { 
  Palette, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff, 
  Globe, 
  MessageSquare, 
  Send, 
  Download,
  Trash2,
  Settings,
  Sparkles
} from "lucide-react";
import { THEMES } from "../constants";
import toast from "react-hot-toast";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { authUser, updateProfile } = useAuthStore();
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    darkMode: theme === 'dark',
    showOnlineStatus: true,
    showTypingIndicator: true,
    autoDownloadMedia: false,
    language: 'en'
  });

  const handleSettingChange = async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'showTypingIndicator') {
      try {
        // Update typing indicator preference in backend
        await updateProfile({ showTypingMessage: value });
        toast.success('Typing indicator preference updated');
      } catch (error) {
        toast.error('Failed to update preference');
      }
    }

    if (key === 'darkMode') {
      setTheme(value ? 'dark' : 'light');
    }
    
    toast.success('Settings updated');
  };

  const clearChatHistory = () => {
    toast.success('Chat history cleared');
  };

  const exportData = () => {
    toast.success('Data export started');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto p-6">
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
              <p className="text-purple-200">Customize your chat experience</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Theme Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="w-6 h-6 text-purple-300" />
                <h2 className="text-2xl font-bold text-white">Theme Selection</h2>
              </div>
              <p className="text-purple-200 mb-6">Choose a theme that matches your style</p>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t}
                    className={`
                      group flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 transform hover:scale-105
                      ${theme === t 
                        ? "bg-gradient-to-r from-purple-500/30 to-pink-500/30 border-2 border-purple-400 shadow-lg" 
                        : "bg-white/5 hover:bg-white/10 border border-white/10"
                      }
                    `}
                    onClick={() => setTheme(t)}
                  >
                    <div className="relative h-10 w-full rounded-lg overflow-hidden shadow-inner" data-theme={t}>
                      <div className="absolute inset-0 grid grid-cols-2 gap-1 p-1">
                        <div className="rounded bg-primary"></div>
                        <div className="rounded bg-secondary"></div>
                        <div className="rounded bg-accent"></div>
                        <div className="rounded bg-neutral"></div>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-white group-hover:text-purple-200 transition-colors">
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </span>
                    {theme === t && (
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* App Settings */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-6 h-6 text-purple-300" />
                <h2 className="text-2xl font-bold text-white">App Settings</h2>
              </div>

              <div className="space-y-6">
                {/* Notifications */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-purple-300" />
                    <div>
                      <h3 className="text-white font-medium">Notifications</h3>
                      <p className="text-purple-200 text-sm">Receive push notifications for new messages</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.notifications}
                      onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Sound Effects */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    {settings.soundEffects ? <Volume2 className="w-5 h-5 text-purple-300" /> : <VolumeX className="w-5 h-5 text-purple-300" />}
                    <div>
                      <h3 className="text-white font-medium">Sound Effects</h3>
                      <p className="text-purple-200 text-sm">Play sounds for message notifications</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.soundEffects}
                      onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Online Status */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    {settings.showOnlineStatus ? <Eye className="w-5 h-5 text-purple-300" /> : <EyeOff className="w-5 h-5 text-purple-300" />}
                    <div>
                      <h3 className="text-white font-medium">Show Online Status</h3>
                      <p className="text-purple-200 text-sm">Let others see when you're online</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.showOnlineStatus}
                      onChange={(e) => handleSettingChange('showOnlineStatus', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Typing Indicator */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-purple-300" />
                    <div>
                      <h3 className="text-white font-medium">Typing Indicator</h3>
                      <p className="text-purple-200 text-sm">Show when you're typing to others</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.showTypingIndicator}
                      onChange={(e) => handleSettingChange('showTypingIndicator', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Auto Download Media */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-purple-300" />
                    <div>
                      <h3 className="text-white font-medium">Auto Download Media</h3>
                      <p className="text-purple-200 text-sm">Automatically download images and files</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.autoDownloadMedia}
                      onChange={(e) => handleSettingChange('autoDownloadMedia', e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                  </label>
                </div>

                {/* Language */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-purple-300" />
                    <div>
                      <h3 className="text-white font-medium">Language</h3>
                      <p className="text-purple-200 text-sm">Choose your preferred language</p>
                    </div>
                  </div>
                  <select 
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                  >
                    <option value="en" className="bg-slate-800">English</option>
                    <option value="es" className="bg-slate-800">Español</option>
                    <option value="fr" className="bg-slate-800">Français</option>
                    <option value="de" className="bg-slate-800">Deutsch</option>
                    <option value="hi" className="bg-slate-800">हिंदी</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Preview & Actions */}
          <div className="lg:col-span-1 space-y-8">
            {/* Theme Preview */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Preview
              </h3>
              
              <div className="rounded-xl border border-white/20 overflow-hidden bg-white/5 shadow-lg">
                <div className="p-3 bg-white/10">
                  <div className="bg-white/10 rounded-lg shadow-sm overflow-hidden">
                    {/* Chat Header */}
                    <div className="px-3 py-2 border-b border-white/10 bg-white/5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-medium">
                          J
                        </div>
                        <div>
                          <h4 className="font-medium text-xs text-white">John Doe</h4>
                          <p className="text-[10px] text-purple-200">Online</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="p-3 space-y-2 min-h-[120px] bg-white/5">
                      {PREVIEW_MESSAGES.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`
                              max-w-[80%] rounded-lg p-2 text-xs
                              ${message.isSent 
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" 
                                : "bg-white/10 text-white border border-white/20"
                              }
                            `}
                          >
                            <p>{message.content}</p>
                            <p className="text-[9px] mt-1 opacity-70">12:00 PM</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Chat Input */}
                    <div className="p-2 border-t border-white/10 bg-white/5">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-xs text-white placeholder-purple-300 focus:outline-none"
                          placeholder="Type a message..."
                          value="This is a preview"
                          readOnly
                        />
                        <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-1 rounded">
                          <Send size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={exportData}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all duration-200 group"
                >
                  <Download className="w-4 h-4 text-blue-300 group-hover:text-blue-200" />
                  <span className="text-white text-sm">Export Data</span>
                </button>
                
                <button
                  onClick={clearChatHistory}
                  className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-red-500/20 rounded-xl border border-white/10 hover:border-red-400/50 transition-all duration-200 group"
                >
                  <Trash2 className="w-4 h-4 text-red-300 group-hover:text-red-200" />
                  <span className="text-white text-sm">Clear Chat History</span>
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Account Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-200">Version</span>
                  <span className="text-white font-medium">1.2.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">Storage Used</span>
                  <span className="text-white font-medium">2.3 MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-200">Messages</span>
                  <span className="text-white font-medium">1,247</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;