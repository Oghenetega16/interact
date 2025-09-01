import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface MessageReactionsProps {
  messageId: string;
  currentUserId: string;
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

export const MessageReactions = ({ messageId, currentUserId }: MessageReactionsProps) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReactions();
    subscribeToReactions();
  }, [messageId]);

  const fetchReactions = async () => {
    try {
      const { data, error } = await supabase
        .from("message_reactions" as any)
        .select("*")
        .eq("message_id", messageId);

      if (error) throw error;
      setReactions((data as unknown as Reaction[]) || []);
    } catch (error: any) {
      console.error("Error fetching reactions:", error);
    }
  };

  const subscribeToReactions = () => {
    const channel = supabase
      .channel(`message_reactions_${messageId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
          filter: `message_id=eq.${messageId}`
        },
        () => {
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const addReaction = async (emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(
        r => r.user_id === currentUserId && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove existing reaction
        const { error } = await supabase
          .from("message_reactions" as any)
          .delete()
          .eq("id", existingReaction.id);

        if (error) throw error;
      } else {
        // Add new reaction
        const { error } = await supabase
          .from("message_reactions" as any)
          .insert([{
            message_id: messageId,
            user_id: currentUserId,
            emoji: emoji
          }]);

        if (error) throw error;
      }

      setShowEmojiPicker(false);
    } catch (error: any) {
      console.error("Error adding reaction:", error);
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  return (
    <div className="flex items-center gap-1 mt-1">
      {Object.entries(groupedReactions).map(([emoji, reactionList]) => (
        <Button
          key={emoji}
          variant="outline"
          size="sm"
          className={`h-6 px-2 text-xs ${
            reactionList.some(r => r.user_id === currentUserId)
              ? "bg-primary/10 border-primary"
              : ""
          }`}
          onClick={() => addReaction(emoji)}
        >
          {emoji} {reactionList.length}
        </Button>
      ))}
      
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          +
        </Button>
        
        {showEmojiPicker && (
          <div className="absolute bottom-full left-0 mb-1 p-2 bg-background border rounded-lg shadow-lg flex gap-1 z-10">
            {EMOJI_OPTIONS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => addReaction(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};