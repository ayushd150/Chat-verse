import React from "react";
import { useChatStore } from "../store/useChatStore";
import { Bell, X } from "lucide-react";

const UnreadNotification = () => {
  const { 
    unreadMessages, 
    users, 
    setSelectedUser, 
    markMessagesAsRead,
    getTotalUnreadCount 
  } = useChatStore();

  const totalUnread = getTotalUnreadCount();

  if (totalUnread === 0) return null;

  const unreadUserIds = Object.keys(unreadMessages);
  const unreadUsers = users.filter(user => unreadUserIds.includes(user._id));

  const handleUserClick = (user) => {
    setSelectedUser(user);
    markMessagesAsRead(user._id);
  };

  const handleDismissAll = () => {
    unreadUserIds.forEach(userId => {
      markMessagesAsRead(userId);
    });
  };

  return (
    <div className="bg-primary/10 border-b border-primary/20 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {totalUnread} new message{totalUnread !== 1 ? 's' : ''} from {unreadUsers.length} contact{unreadUsers.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        <button
          onClick={handleDismissAll}
          className="btn btn-ghost btn-xs text-primary hover:bg-primary/20"
          title="Dismiss all"
        >
          <X className="size-3" />
        </button>
      </div>

      {/* Show individual users with unread messages */}
      <div className="mt-2 flex flex-wrap gap-2">
        {unreadUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => handleUserClick(user)}
            className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 
                     rounded-full px-3 py-1 transition-colors"
          >
            <img
              src={user.profilePic || "/avatar.jpg"}
              alt={user.fullName}
              className="size-5 rounded-full"
            />
            <span className="text-xs font-medium text-primary">
              {user.fullName}
            </span>
            <span className="bg-primary text-primary-content text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {unreadMessages[user._id]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UnreadNotification;