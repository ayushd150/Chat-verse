import React, { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const {
    sendMessage,
    selectedUser
  } = useChatStore();
  const { authUser, socket } = useAuthStore();
  const typingTimeoutRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    const reader = new FileReader();

    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    
    try {
      // Stop typing when sending message
      if (isTyping) {
        handleStopTyping();
      }

      await sendMessage({ text: text.trim(), image: imagePreview });
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Emit message sent event to socket for chat ordering
      if (socket) {
        socket.emit("messageSent", {
          senderId: authUser._id,
          receiverId: selectedUser._id,
          message: text.trim()
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Handle typing start
  const handleStartTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit("typing", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
        isTyping: true,
        inputValue: text
      });
    }
  };

  // Handle typing stop
  const handleStopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit("typing", {
        senderId: authUser._id,
        receiverId: selectedUser._id,
        isTyping: false,
        inputValue: ""
      });
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setText(value);

    // Handle typing logic
    if (value.trim().length > 0) {
      handleStartTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing after 1.5 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        handleStopTyping();
      }, 1500);
    } else {
      // If input is empty, stop typing immediately
      handleStopTyping();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Cleanup timeout on component unmount or selectedUser change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      handleStopTyping();
    };
  }, [selectedUser]);

  return (
    <div className="p-4 w-full">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300 flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            className="w-full input input-bordered rounded-lg input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={handleInputChange}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="button"
            className={`hidden sm:flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-sm btn-circle"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;