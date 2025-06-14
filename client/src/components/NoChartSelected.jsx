import React from "react";
import { MessageSquare, Users, ArrowLeft } from "lucide-react";

const NoChartSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
      <div className="max-w-md text-center space-y-6">
        {/* Icon */}
        <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
          <MessageSquare className="w-12 h-12 text-primary" />
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-base-content">
            Welcome to Chatverse!
          </h3>
          <p className="text-base-content/60">
            Select a conversation from the sidebar to start messaging
          </p>
        </div>

        {/* Helpful Tips */}
        <div className="bg-base-200/50 rounded-lg p-6 space-y-3">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">Find Friends</p>
              <p className="text-xs text-base-content/70">
                Browse your contacts and see who's online
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium">Real-time Chat</p>
              <p className="text-xs text-base-content/70">
                Enjoy instant messaging with typing indicators
              </p>
            </div>
          </div>
        </div>

        {/* Mobile hint */}
        <div className="lg:hidden">
          <div className="flex items-center gap-2 text-sm text-base-content/60">
            <ArrowLeft className="w-4 h-4" />
            <span>Tap a contact to start chatting</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoChartSelected;       