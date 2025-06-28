import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    // NEW: Voice message support
    voice: {
      url: {
        type: String, // File path or URL to the voice message
      },
      duration: {
        type: Number, // Duration in seconds
      },
      size: {
        type: Number, // File size in bytes
      },
      filename: {
        type: String, // Original filename
      },
      mimeType: {
        type: String, // audio/webm, audio/mp3, etc
      }
    },
    // Enhanced location support with live location features
    location: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      accuracy: {
        type: Number, // GPS accuracy in meters
      },
      timestamp: {
        type: Number, // Unix timestamp when location was captured
      },
      address: {
        type: String, // Optional formatted address
      },
      isLive: {
        type: Boolean,
        default: false, // Whether this is a live location share
      },
      duration: {
        type: Number, // Duration in minutes for live location sharing
      },
      isActive: {
        type: Boolean,
        default: false, // Whether live location is currently active
      },
      startedAt: {
        type: Date, // When live location sharing started
      },
      stoppedAt: {
        type: Date, // When live location sharing stopped
      }
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'voice', 'location', 'location_live', 'location_stop'], // Added 'voice'
      default: 'text'
    },
    deletedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for efficient location queries
messageSchema.index({ senderId: 1, receiverId: 1, messageType: 1 });
messageSchema.index({ "location.isActive": 1, "location.isLive": 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;