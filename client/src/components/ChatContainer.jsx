import React, { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import UnreadNotification from "./UnreadNotification";
import { MessageReadStatus } from "./ReadStatusIcons";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead,
  } = useChatStore();
  const { authUser, typingUsers } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
      
      // Mark messages as read when opening chat
      markMessagesAsRead(selectedUser._id);
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser?._id,
    getMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    markMessagesAsRead
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as read when component is visible and user is selected
  useEffect(() => {
    if (selectedUser && !isMessagesLoading) {
      markMessagesAsRead(selectedUser._id);
    }
  }, [selectedUser, isMessagesLoading, markMessagesAsRead]);

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <UnreadNotification />
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );

  // Check if selected user is typing
  const isSelectedUserTyping = typingUsers?.includes(selectedUser?._id);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Unread notification banner */}
      <UnreadNotification />
      
      <ChatHeader />
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg text-base-content/60">
                No messages yet. Start chatting with {selectedUser?.fullName}!
              </p>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${
              message.senderId === authUser._id ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.jpg"
                      : selectedUser.profilePic || "/avatar.jpg"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="chat-bubble flex flex-col">
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {message.text && <p>{message.text}</p>}
              
              {/* Add read status indicator */}
              <MessageReadStatus message={message} authUser={authUser} />
            </div>
          </div>
        ))}
      </div>

      {/* Typing Indicator - Only show "typing..." */}
      {isSelectedUserTyping && (
        <div className="chat chat-start px-4 pb-2">
          <div className="chat-image avatar">
            <div className="size-10 rounded-full border">
              <img
                src={selectedUser.profilePic || "/avatar.jpg"}
                alt="profile pic"
              />
            </div>
          </div>
          <div className="chat-bubble bg-base-300 text-base-content">
            <div className="flex items-center gap-2">
              <span className="loading loading-dots loading-sm"></span>
              <span className="text-sm italic">typing...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messageEndRef} />
      <MessageInput />
    </div>
  );
};

export default ChatContainer;