import React, { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { 
    getUsers, 
    users, 
    selectedUser, 
    setSelectedUser, 
    isUsersLoading,
    getUnreadCount 
  } = useChatStore();
  
  const { onlineUsers, authUser, socket } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Debug logging to help troubleshoot
  useEffect(() => {
    console.log("🔍 Sidebar Debug Info:");
    console.log("📊 Online users:", onlineUsers);
    console.log("👤 Auth user:", authUser?._id);
    console.log("🔌 Socket connected:", socket?.connected);
    console.log("👥 Total users:", users.length);
  }, [onlineUsers, authUser, socket, users]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  // Calculate online users count excluding current user
  const onlineUsersCount = Math.max(0, onlineUsers.length - (authUser ? 1 : 0));

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Contacts</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">
            ({onlineUsersCount} online)
          </span>
        </div>
        
        {/* Debug info - remove this in production */}
        <div className="mt-2 text-xs text-gray-500 hidden lg:block">
          Socket: {socket?.connected ? '✅' : '❌'} | 
          Online IDs: [{onlineUsers.join(', ')}]
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => {
          const unreadCount = getUnreadCount(user._id);
          const isOnline = onlineUsers.includes(user._id);
          
          // Debug logging for each user
          console.log(`👤 User ${user.fullName} (${user._id}): ${isOnline ? 'Online' : 'Offline'}`);
          
          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3
                hover:bg-base-300 transition-colors relative
                ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
              `}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.jpg"}
                  alt={user.fullName || user.name || "User"}
                  className="size-12 object-cover rounded-full"
                />
                {/* Enhanced online indicator with better visibility */}
                {isOnline && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-white border border-gray-300
                    shadow-sm"
                    title="Online"
                  />
                )}
              </div>

              {/* User info - only visible on large screens */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">{user.fullName || user.name}</div>
                  {unreadCount > 0 && (
                    <span className="bg-primary text-primary-content text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
                <div className="text-sm text-zinc-400">
                  {isOnline ? "Online" : "Offline"}
                </div>
              </div>

              {/* Unread indicator for mobile - small dot */}
              {unreadCount > 0 && (
                <div className="lg:hidden absolute top-2 right-2">
                  <span className="bg-primary size-3 rounded-full"></span>
                </div>
              )}
            </button>
          );
        })}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            {showOnlineOnly ? "No online users" : "No contacts yet"}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;