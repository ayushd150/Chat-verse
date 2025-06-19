import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const rafId = useRef(null);

  // Throttled resize handler using requestAnimationFrame
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    
    // Cancel previous animation frame if it exists
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    // Use requestAnimationFrame to throttle updates
    rafId.current = requestAnimationFrame(() => {
      const newWidth = e.clientX;
      const minWidth = 80;
      const maxWidth = 400;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    });
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  const handleMouseDown = useCallback((e) => {
    setIsResizing(true);
    e.preventDefault();
  }, []);

  // Optimized mouse event listeners
  useEffect(() => {
    if (isResizing) {
      // Use passive listeners for better performance
      document.addEventListener('mousemove', handleMouseMove, { passive: true });
      document.addEventListener('mouseup', handleMouseUp, { passive: true });
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  // Memoize filtered users to prevent unnecessary re-calculations
  const filteredUsers = useMemo(() => {
    return showOnlineOnly
      ? users.filter((user) => onlineUsers.includes(user._id))
      : users;
  }, [showOnlineOnly, users, onlineUsers]);

  // Memoize online users count
  const onlineUsersCount = useMemo(() => {
    return Math.max(0, onlineUsers.length - (authUser ? 1 : 0));
  }, [onlineUsers.length, authUser]);

  // Memoized user item component to prevent unnecessary re-renders
  const UserItem = React.memo(({ user, isSelected, onSelect, sidebarWidth }) => {
    const unreadCount = getUnreadCount(user._id);
    const isOnline = onlineUsers.includes(user._id);
    
    return (
      <button
        onClick={() => onSelect(user)}
        className={`
          w-full p-3 flex items-center gap-3
          hover:bg-base-300 transition-colors relative
          ${isSelected ? "bg-base-300 ring-1 ring-base-300" : ""}
        `}
      >
        <div className="relative mx-auto lg:mx-0">
          <img
            src={user.profilePic || "/avatar.jpg"}
            alt={user.fullName || user.name || "User"}
            className="size-12 object-cover rounded-full"
          />
          {isOnline && (
            <span
              className="absolute bottom-0 right-0 size-3 bg-green-500 
              rounded-full ring-2 ring-white border border-gray-300
              shadow-sm"
              title="Online"
            />
          )}
        </div>

        {sidebarWidth > 120 && (
          <div className="block text-left min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <div className="font-medium truncate text-sm lg:text-base">
                {user.fullName || user.name}
              </div>
              {unreadCount > 0 && (
                <span className="bg-primary text-primary-content text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </div>
            {sidebarWidth > 180 && (
              <div className="text-xs lg:text-sm text-zinc-400">
                {isOnline ? "Online" : "Offline"}
              </div>
            )}
          </div>
        )}

        {sidebarWidth <= 120 && unreadCount > 0 && (
          <div className="absolute top-2 right-2">
            <span className="bg-primary size-3 rounded-full"></span>
          </div>
        )}
      </button>
    );
  });

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <div className="flex relative">
      <aside 
        ref={sidebarRef}
        className="h-full flex flex-col relative bg-base-100"
        style={{ 
          width: `${sidebarWidth}px`,
          // Remove transition during resize for smoother performance
          transition: isResizing ? 'none' : 'all 0.2s ease'
        }}
      >
        <div className="border-b border-base-300 w-full p-5">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            {sidebarWidth > 150 && (
              <span className="font-medium">Contacts</span>
            )}
          </div>
          {sidebarWidth > 200 && (
            <div className="mt-3 flex items-center gap-2">
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
          )}
        </div>

        <div className="overflow-y-auto w-full py-3">
          {filteredUsers.map((user) => (
            <UserItem
              key={user._id}
              user={user}
              isSelected={selectedUser?._id === user._id}
              onSelect={setSelectedUser}
              sidebarWidth={sidebarWidth}
            />
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center text-zinc-500 py-4">
              {showOnlineOnly ? "No online users" : "No contacts yet"}
            </div>
          )}
        </div>
      </aside>

      {/* Optimized resize handle */}
      <div
        className={`w-1 h-full cursor-col-resize transition-colors duration-200 relative group flex-shrink-0 ${
          isResizing ? 'bg-blue-400' : 'bg-base-300 hover:bg-blue-400'
        }`}
        onMouseDown={handleMouseDown}
        style={{
          userSelect: 'none',
          position: 'relative'
        }}
      >
        <div className="absolute inset-0 w-3 -translate-x-1 bg-transparent"></div>
        
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-full transition-opacity duration-200 pointer-events-none ${
          isResizing ? 'opacity-60' : 'opacity-0 group-hover:opacity-60'
        }`}></div>
      </div>
    </div>
  );
};

export default Sidebar;