import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Send, ArrowLeft } from "lucide-react";
import { MessageReactions } from "./MessageReactions";
import { FileUpload, FileMessage } from "./FileUpload";
import { MessageSearch } from "./MessageSearch";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  conversation_id: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  sender_profile: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  created_at: string;
  participants: {
    user_id: string;
    profiles: {
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
  }[];
  messages: Message[];
}

interface ConversationViewProps {
  conversation: Conversation;
  currentUser: any;
  onBack: () => void;
}

export const ConversationView = ({ conversation, currentUser, onBack }: ConversationViewProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Debug log to see what conversation data we're receiving
  useEffect(() => {
    console.log("ConversationView received conversation:", conversation);
    console.log("Participants:", conversation.participants);
  }, [conversation]);

  useEffect(() => {
    fetchMessages();
    subscribeToMessages();
  }, [conversation.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data: messagesData, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (messagesData && messagesData.length > 0) {
        const userIds = [...new Set(messagesData.map(msg => msg.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);

        const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

        const messagesWithProfiles = messagesData.map(message => ({
          ...message,
          sender_profile: profilesMap.get(message.user_id) || {
            username: `User-${message.user_id.slice(0, 8)}`,
            display_name: null,
            avatar_url: null,
          }
        }));

        setMessages(messagesWithProfiles);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`conversation-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          // Fetch the message and profile data separately
          const { data: messageData } = await supabase
            .from("messages")
            .select("*")
            .eq("id", payload.new.id)
            .single();

          if (messageData) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, display_name, avatar_url")
              .eq("user_id", messageData.user_id)
              .single();

            const messageWithProfile = {
              ...messageData,
              sender_profile: profileData || {
                username: `User-${messageData.user_id.slice(0, 8)}`,
                display_name: null,
                avatar_url: null,
              }
            };
            setMessages((prev) => [...prev, messageWithProfile]);
            scrollToBottom(); // Auto-scroll to new messages
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent, fileData?: { url: string; name: string; type: string }) => {
    e.preventDefault();
    if ((!newMessage.trim() && !fileData) || loading) return;

    setLoading(true);
    try {
      const messageData = {
        content: fileData ? (newMessage.trim() || fileData.name) : newMessage.trim(),
        user_id: currentUser.id,
        conversation_id: conversation.id,
        ...(fileData && {
          file_url: fileData.url,
          file_name: fileData.name,
          file_type: fileData.type
        })
      };

      const { error } = await supabase
        .from("messages")
        .insert([messageData]);

      if (error) throw error;

      if (!fileData) {
        setNewMessage("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    
    // For private conversations, show the other participant's username
    const otherParticipant = conversation.participants.find(
      p => p.user_id !== currentUser.id
    );
    
    if (otherParticipant?.profiles?.username) {
      return otherParticipant.profiles.username;
    }
    
    // If no username available, try display name
    if (otherParticipant?.profiles?.display_name) {
      return otherParticipant.profiles.display_name;
    }
    
    return "Private Chat";
  };

  const getConversationAvatar = () => {
    if (conversation.is_group) return null;
    
    const otherParticipant = conversation.participants.find(
      p => p.user_id !== currentUser.id
    );
    
    return otherParticipant?.profiles.avatar_url;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarImage src={getConversationAvatar() || undefined} />
              <AvatarFallback>
                {getConversationName().charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-lg">{getConversationName()}</CardTitle>
          </div>
          <div className="w-64">
            <MessageSearch 
              currentUserId={currentUser.id}
              onMessageClick={(conversationId, messageId) => {
                const messageElement = document.getElementById(`message-${messageId}`);
                if (messageElement) {
                  messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
                  setTimeout(() => {
                    messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
                  }, 2000);
                }
              }}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                id={`message-${message.id}`}
                className={`flex items-start space-x-3 ${
                  message.user_id === currentUser.id ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={message.sender_profile.avatar_url || undefined} />
                  <AvatarFallback>
                    {message.sender_profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.user_id === currentUser.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.sender_profile.display_name || message.sender_profile.username}
                  </div>
                  
                  {/* File content */}
                  {message.file_url && (
                    <div className="mb-2">
                      <FileMessage 
                        fileUrl={message.file_url}
                        fileName={message.file_name || "File"}
                        fileType={message.file_type || ""}
                      />
                    </div>
                  )}
                  
                  {/* Text content */}
                  {message.content && !message.file_url && (
                    <div className="text-sm">{message.content}</div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(message.created_at)}
                  </div>
                  
                  {/* Message reactions */}
                  <MessageReactions 
                    messageId={message.id}
                    currentUserId={currentUser.id}
                  />
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <FileUpload 
              currentUserId={currentUser.id}
              onFileUploaded={(url, name, type) => {
                sendMessage(new Event('submit') as any, { url, name, type });
              }}
            />
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || (!newMessage.trim())}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};