import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Edit3, Check, X, Save, Calendar, Shield, Sparkles, Settings } from "lucide-react";
import toast from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, changePreference } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedName, setEditedName] = useState(authUser?.fullName || "");
  const [editedEmail, setEditedEmail] = useState(authUser?.email || "");

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    
    try {
      console.log("Attempting to update name with:", { fullName: editedName.trim() });
      
      // Only send the fullName field
      const updateData = { fullName: editedName.trim() };
      
      const result = await updateProfile(updateData);
      console.log("Update result:", result);
      
      setIsEditingName(false);
      toast.success("Name updated successfully!");
    } catch (error) {
      console.error("Name update error:", error);
      
      // Log the full error details
      if (error.response) {
        console.error("Error response:", error.response.data);
        toast.error(error.response.data.message || "Failed to update name");
      } else {
        toast.error("Failed to update name");
      }
      
      // Reset to original value
      setEditedName(authUser?.fullName || "");
    }
  };

  const handleEmailSave = async () => {
    if (!editedEmail.trim()) {
      toast.error("Email cannot be empty");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(editedEmail)) {
      toast.error("Please enter a valid email");
      return;
    }
    
    try {
      console.log("Attempting to update email with:", { email: editedEmail.trim() });
      
      // Only send the email field
      const updateData = { email: editedEmail.trim() };
      
      const result = await updateProfile(updateData);
      console.log("Update result:", result);
      
      setIsEditingEmail(false);
      toast.success("Email updated successfully!");
    } catch (error) {
      console.error("Email update error:", error);
      
      // Log the full error details
      if (error.response) {
        console.error("Error response:", error.response.data);
        toast.error(error.response.data.message || "Failed to update email");
      } else {
        toast.error("Failed to update email");
      }
      
      // Reset to original value
      setEditedEmail(authUser?.email || "");
    }
  };

  const handleNameCancel = () => {
    setEditedName(authUser?.fullName || "");
    setIsEditingName(false);
  };

  const handleEmailCancel = () => {
    setEditedEmail(authUser?.email || "");
    setIsEditingEmail(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-20">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-indigo-500/25 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-purple-200">Manage your account settings</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-1">
                    <img
                      src={selectedImg || authUser?.profilePic || "/avatar.jpg"}
                      alt="profile"
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className={`absolute -bottom-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 p-3 rounded-full cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-110 group-hover:animate-pulse
                      ${isUpdatingProfile ? "animate-spin pointer-events-none" : ""}`}
                  >
                    <Camera className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUpdatingProfile}
                    />
                  </label>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {authUser?.fullName}
                  </h3>
                  <p className="text-purple-200 text-sm">
                    {isUpdatingProfile ? "Updating..." : "Click camera to change photo"}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-300" />
                      <span className="text-sm text-purple-200">Joined</span>
                    </div>
                    <span className="text-sm text-white font-medium">
                      {authUser?.createdAt ? formatDate(authUser.createdAt) : "Unknown"}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-300" />
                      <span className="text-sm text-purple-200">Status</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400 font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Settings className="w-6 h-6 text-purple-300" />
                <h2 className="text-2xl font-bold text-white">Profile Information</h2>
              </div>

              <div className="space-y-8">
                {/* Full Name Field */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  
                  {isEditingName ? (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                        placeholder="Enter your full name"
                        disabled={isUpdatingProfile}
                      />
                      <button
                        onClick={handleNameSave}
                        disabled={isUpdatingProfile}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleNameCancel}
                        disabled={isUpdatingProfile}
                        className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-white text-lg">{authUser?.fullName}</span>
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                      >
                        <Edit3 className="w-4 h-4 text-purple-300 group-hover:text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  
                  {isEditingEmail ? (
                    <div className="flex gap-3">
                      <input
                        type="email"
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                        placeholder="Enter your email"
                        disabled={isUpdatingProfile}
                      />
                      <button
                        onClick={handleEmailSave}
                        disabled={isUpdatingProfile}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleEmailCancel}
                        disabled={isUpdatingProfile}
                        className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-white text-lg">{authUser?.email}</span>
                      <button
                        onClick={() => setIsEditingEmail(true)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors group"
                      >
                        <Edit3 className="w-4 h-4 text-purple-300 group-hover:text-white" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Account Details */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-purple-200">
                    <Sparkles className="w-4 h-4" />
                    Account Details
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-sm text-purple-300 mb-1">Member Since</div>
                      <div className="text-white font-medium">
                        {authUser?.createdAt ? formatDate(authUser.createdAt) : "Unknown"}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-sm text-purple-300 mb-1">Account Type</div>
                      <div className="text-white font-medium flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        Premium User
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Overlay */}
        {isUpdatingProfile && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white text-lg">Updating profile...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;