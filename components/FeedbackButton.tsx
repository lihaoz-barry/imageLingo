"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(name.trim() && { name: name.trim() }),
          ...(email.trim() && { email: email.trim() }),
          feedback: feedback.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send feedback");
      }

      toast.success("Thank you for your feedback!");
      setIsOpen(false);
      // Reset form
      setName("");
      setEmail("");
      setFeedback("");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send feedback"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-6 py-3 rounded-full backdrop-blur-md bg-gradient-to-r from-[#00d4ff]/20 via-[#8b5cf6]/20 to-[#c026d3]/20 border border-white/20 hover:from-[#00d4ff]/30 hover:via-[#8b5cf6]/30 hover:to-[#c026d3]/30 transition-all duration-300 hover:scale-105 shadow-lg"
        aria-label="Send feedback"
      >
        <MessageSquarePlus className="w-5 h-5 text-[#00d4ff]" />
        <span className="text-white font-medium hidden md:inline">Feedback</span>
      </button>

      {/* Feedback Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-[#1a1a2e] border-white/20 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl bg-gradient-to-r from-[#00d4ff] via-[#8b5cf6] to-[#c026d3] bg-clip-text text-transparent">
              Send Feedback
            </DialogTitle>
            <DialogDescription className="text-[#9ca3af]">
              We&apos;d love to hear your thoughts! Share your feedback with us.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Name (Optional)
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-[#9ca3af]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email (Optional)
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-[#9ca3af]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-white">
                Feedback <span className="text-[#c026d3]">*</span>
              </Label>
              <Textarea
                id="feedback"
                placeholder="Share your thoughts, suggestions, or report issues..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-[#9ca3af] min-h-[120px]"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-[#00d4ff] via-[#8b5cf6] to-[#c026d3] text-white hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? "Sending..." : "Send Feedback"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
