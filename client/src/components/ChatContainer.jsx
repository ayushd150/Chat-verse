import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import UnreadNotification from "./UnreadNotification";
import { MessageReadStatus } from "./ReadStatusIcons";
import LocationMessage from "./location/LocationMessage";
import LiveLocationMessage from "./location/LiveLocationMessage";
import VoicePlayer from "./VoicePlayer";
import { useAuthStore } from "../store/useAuthStore";
import { useLocation } from "../hooks/useLocation";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    sendMessage, // Add this from your chat store
    initializeSocketListeners,
    unsubscribeFromMessages,
    markMessagesAsRead,
  } = useChatStore();
  const { authUser, typingUsers } = useAuthStore();
  const { getCurrentLocation } = useLocation();
  const messageEndRef = useRef(null);
  const [userLocation, setUserLocation] = useState(null);

  // Get user's current location for distance calculations
  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } catch (error) {
        console.log('Could not get user location for distance calculations');
      }
    };
    
    getUserLocation();
  }, [getCurrentLocation]);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      initializeSocketListeners();
      markMessagesAsRead(selectedUser._id);
    }

    return () => {
      unsubscribeFromMessages();
    };
  }, [
    selectedUser?._id,
    getMessages,
    initializeSocketListeners,
    unsubscribeFromMessages,
    markMessagesAsRead
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedUser && !isMessagesLoading) {
      markMessagesAsRead(selectedUser._id);
    }
  }, [selectedUser, isMessagesLoading, markMessagesAsRead]);

  // FIXED: Handle sending messages from MessageInput with proper FormData handling
  const handleSendMessage = async (messageData) => {
    if (!selectedUser?._id) {
      throw new Error('No user selected');
    }

    console.log('📤 handleSendMessage called with:', messageData);
    console.log('📤 messageData type:', typeof messageData);
    console.log('📤 Is FormData?', messageData instanceof FormData);

    try {
      // Check if this is a voice message (FormData)
      if (messageData instanceof FormData) {
        console.log('🎤 Processing voice message...');
        
        // For voice messages, we need to send the FormData directly
        // and add the receiverId to it
        messageData.append('receiverId', selectedUser._id);
        
        // Log FormData contents
        for (let pair of messageData.entries()) {
          console.log('📤 FormData entry:', pair[0], pair[1]);
        }
        
        // Send the FormData directly to your chat store
        await sendMessage(messageData);
        
      } else {
        console.log('💬 Processing regular message...');
        
        // For regular messages (text/image), send as object
        await sendMessage({
          receiverId: selectedUser._id,
          ...messageData
        });
      }
      
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      throw error;
    }
  };

  // Render individual message
  const renderMessage = (message) => {
    const isOwn = message.senderId === authUser._id;

    if (message.messageType === 'voice' && message.voice && message.voice.url) {
      return (
        <div
          key={message._id}
          className={`chat ${isOwn ? "chat-end" : "chat-start"}`}
        >
          <div className="chat-image avatar">
            <div className="size-10 rounded-full border">
              <img
                src={
                  isOwn
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
          <div className="chat-bubble p-2">
            <VoicePlayer 
              audioUrl={message.voice.url}
              duration={message.voice.duration}
              isOwnMessage={isOwn}
              messageTime={new Date(message.createdAt).getTime()}
            />
            <MessageReadStatus message={message} authUser={authUser} />
          </div>
        </div>
      );
    }
    
    // Check if message has location data
    if (message.messageType === 'location' && message.location) {
      // Use LiveLocationMessage for live locations, regular LocationMessage for static ones
      if (message.location.isLive) {
        return (
          <LiveLocationMessage 
            key={message._id}
            location={message.location}
            fromMe={isOwn}
            messageTimestamp={new Date(message.createdAt).getTime()}
          />
        );
      } else {
        return (
          <LocationMessage 
            key={message._id}
            location={message.location}
            fromMe={isOwn}
          />
        );
      }
    }

    // Regular text/image message
    return (
      <div
        key={message._id}
        className={`chat ${isOwn ? "chat-end" : "chat-start"}`}
      >
        <div className="chat-image avatar">
          <div className="size-10 rounded-full border">
            <img
              src={
                isOwn
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
          
          <MessageReadStatus message={message} authUser={authUser} />
        </div>
      </div>
    );
  };

  if (isMessagesLoading)
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <UnreadNotification />
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
    );

  const isSelectedUserTyping = typingUsers?.includes(selectedUser?._id);

  return (
    <div className="flex-1 flex flex-col overflow-auto">
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
        
        {messages.map(renderMessage)}
      </div>

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
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatContainer;