import React from "react";

// Single tick icon for sent messages
export const SingleTick = ({ className = "text-gray-400" }) => (
  <svg
    width="16"
    height="12"
    viewBox="0 0 16 12"
    fill="none"
    className={className}
  >
    <path
      d="M1 6L4 9L9 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Double tick icon for read messages
export const DoubleTick = ({ className = "text-blue-500" }) => (
  <div className="flex items-center gap-0.5">
    <svg
      width="16"
      height="12"
      viewBox="0 0 16 12"
      fill="none"
      className={className}
    >
      <path
        d="M1 6L4 9L9 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <svg
      width="16"
      height="12"
      viewBox="0 0 16 12"
      fill="none"
      className={`${className} -ml-2`}
    >
      <path
        d="M1 6L4 9L9 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

// Combined component that shows appropriate status
export const MessageReadStatus = ({ 
  message, 
  authUser, 
  size = "sm",
  showText = false 
}) => {
  // Only show ticks for messages sent by the current user
  if (message.senderId !== authUser._id) {
    return null;
  }

  const isRead = message.isRead;
  const isSent = message._id; // If message has ID, it's been sent
  const isDelivered = message.deliveredAt; // If you have delivery status

  // Size classes
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4", 
    md: "w-5 h-5",
    lg: "w-6 h-6"
  };

  if (!isSent) {
    // Message is still being sent
    return (
      <div className="flex items-center gap-1 mt-1">
        <div className={`loading loading-spinner loading-xs opacity-50`}></div>
        {showText && <span className="text-xs opacity-50">Sending...</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end mt-1" title={isRead ? "Read" : "Sent"}>
      {isRead ? (
        <DoubleTick className="text-blue-500" />
      ) : (
        <SingleTick className="text-gray-400" />
      )}
      {showText && (
        <span className="text-xs opacity-70 ml-1">
          {isRead ? "Read" : "Sent"}
        </span>
      )}
    </div>
  );
};

// Compact version for message lists
export const CompactReadStatus = ({ message, authUser }) => {
  if (message.senderId !== authUser._id) return null;
  
  const isRead = message.isRead;
  
  return (
    <span className="inline-flex items-center ml-2">
      {isRead ? (
        <DoubleTick className="text-blue-400 w-3 h-3" />
      ) : (
        <SingleTick className="text-gray-400 w-3 h-3" />
      )}
    </span>
  );
};

export default MessageReadStatus;