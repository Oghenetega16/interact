import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, X } from "lucide-react";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  conversation_id: string;
  profiles: {
    username: string;
    display_name: string | null;
  };
}

interface MessageSearchProps {
  currentUserId: string;
  onMessageClick?: (conversationId: string, messageId: string) => void;
}

export const MessageSearch = ({ currentUserId, onMessageClick }: MessageSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const performSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    try {
      // First get conversations where the user is a participant
      const { data: userConversations } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", currentUserId);

      if (!userConversations?.length) {
        setSearchResults([]);
        setShowResults(true);
        return;
      }

      const conversationIds = userConversations.map(c => c.conversation_id);

      // Search messages in user's conversations
      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          id,
          content,
          created_at,
          user_id,
          conversation_id
        `)
        .in("conversation_id", conversationIds)
        .ilike("content", `%${searchTerm}%`)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get profiles for the message users
      if (messages && messages.length > 0) {
        const userIds = [...new Set(messages.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, username, display_name")
          .in("user_id", userIds);

        const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
        
        const messagesWithProfiles = messages.map(message => ({
          ...message,
          profiles: profilesMap.get(message.user_id) || {
            username: "Unknown",
            display_name: null
          }
        }));

        setSearchResults(messagesWithProfiles);
      } else {
        setSearchResults([]);
      }
      setShowResults(true);
    } catch (error: any) {
      console.error("Error searching messages:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleMessageClick = (message: Message) => {
    onMessageClick?.(message.conversation_id, message.id);
    setShowResults(false);
    setSearchTerm("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const highlightSearchTerm = (text: string, term: string) => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setShowResults(false);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-2">
            {isSearching ? (
              <div className="text-center py-4 text-muted-foreground">
                Searching...
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((message) => (
                  <div
                    key={message.id}
                    className="p-2 hover:bg-muted rounded cursor-pointer"
                    onClick={() => handleMessageClick(message)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">
                        {message.profiles?.display_name || message.profiles?.username || "Unknown"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                    <div className="text-sm">
                      {highlightSearchTerm(message.content, searchTerm)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No messages found
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};