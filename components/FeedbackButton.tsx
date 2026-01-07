"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackDialog } from "./FeedbackDialog";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-md bg-gradient-to-r from-[#00d4ff]/20 via-[#8b5cf6]/20 to-[#c026d3]/20 border border-white/20 hover:from-[#00d4ff]/30 hover:via-[#8b5cf6]/30 hover:to-[#c026d3]/30 transition-all duration-300 hover:scale-105 shadow-lg outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="w-5 h-5 text-[#00d4ff]" />
        <span className="text-white font-medium hidden md:inline">Feedback</span>
      </button>

      {/* Feedback Dialog */}
      <FeedbackDialog open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
