import React, { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";

const Sidebar = () => {
  const {
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    getUsers,
    getUnreadCount,
    getTotalUnreadCount
  } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  if (isUsersLoading) return <SidebarSkeleton />;

  const totalUnread = getTotalUnreadCount();

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      {/* Header */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-content font-bold text-sm">💬</span>
              </div>
              {/* Total unread indicator */}
              {totalUnread > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <h1 className="font-bold text-lg">Messages</h1>
              <p className="text-sm text-base-content/60">
                {totalUnread > 0 ? `${totalUnread} unread` : "All caught up!"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact List */}
      <div className="overflow-y-auto w-full py-3">
        {users.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const unreadCount = getUnreadCount(user._id);
          const isSelected = selectedUser?._id === user._id;

          return (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`
                w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors
                ${isSelected ? "bg-base-300 ring-1 ring-ring" : ""}
              `}
            >
              {/* Avatar with online indicator */}
              <div className="relative">
                <div className="avatar">
                  <div className="size-12 rounded-full">
                    <img 
                      src={user.profilePic || "/avatar.jpg"} 
                      alt={user.fullName}
                    />
                  </div>
                </div>
                {/* Online indicator */}
                {isOnline && (
                  <span 
                    className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-white"
                    title="Online"
                  />
                )}
              </div>

              {/* User Info - Hidden on small screens */}
              <div className="hidden lg:block text-left min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate">
                    {user.fullName}
                  </div>
                  {/* Unread badge */}
                  {unreadCount > 0 && (
                    <div className="bg-blue-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 ml-2">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </div>
                <div className="text-sm text-base-content/60 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {isOnline ? 'Online' : 'Offline'}
                </div>
              </div>

              {/* Mobile unread indicator */}
              {unreadCount > 0 && (
                <div className="lg:hidden absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full min-w-[18px] h-4 flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </button>
          );
        })}

        {/* Empty state */}
        {users.length === 0 && (
          <div className="text-center p-4">
            <div className="text-base-content/60">
              <div className="text-4xl mb-2">👥</div>
              <p className="hidden lg:block">No users found</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;