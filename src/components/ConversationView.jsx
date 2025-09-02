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

export const ConversationView = ({ conversation, currentUser, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
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
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`conversation:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Fetch the sender's profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, display_name, avatar_url")
            .eq("user_id", newMessage.user_id)
            .single();
            
          const messageWithProfile = {
            ...newMessage,
            sender_profile: profileData || {
              username: `User-${newMessage.user_id.slice(0, 8)}`,
              display_name: null,
              avatar_url: null,
            }
          };
          
          setMessages((prev) => [...prev, messageWithProfile]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("messages")
        .insert([
          {
            content: newMessage.trim(),
            user_id: currentUser.id,
            conversation_id: conversation.id,
          },
        ]);

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
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

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getConversationName = () => {
    if (conversation.name) return conversation.name;
    
    if (!conversation.is_group) {
      // For direct messages, show the other participant's name
      const otherParticipant = conversation.participants?.find(
        p => p.user_id !== currentUser?.id
      );
      
      if (otherParticipant) {
        return otherParticipant.profiles.display_name || 
               otherParticipant.profiles.username || 
               `User-${otherParticipant.user_id.slice(0, 8)}`;
      }
    }
    
    return "Conversation";
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="border-b px-4 py-3">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onBack} 
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              {!conversation.is_group && conversation.participants?.find(
                p => p.user_id !== currentUser?.id
              )?.profiles.avatar_url ? (
                <AvatarImage src={conversation.participants.find(
                  p => p.user_id !== currentUser?.id
                )?.profiles.avatar_url} />
              ) : (
                <AvatarFallback>
                  {getConversationName().charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <CardTitle className="text-lg">{getConversationName()}</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.user_id === currentUser?.id ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                <Avatar className="h-8 w-8">
                  {message.sender_profile?.avatar_url ? (
                    <AvatarImage src={message.sender_profile.avatar_url} />
                  ) : (
                    <AvatarFallback>
                      {(message.sender_profile?.display_name || message.sender_profile?.username || "?").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.user_id === currentUser?.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {message.sender_profile?.display_name || message.sender_profile?.username || `User-${message.user_id.slice(0, 8)}`}
                  </div>
                  
                  {message.file_url ? (
                    <FileMessage 
                      fileUrl={message.file_url} 
                      fileName={message.file_name} 
                      fileType={message.file_type} 
                    />
                  ) : (
                    <div className="text-sm break-words">{message.content}</div>
                  )}
                  
                  <div className="text-xs opacity-70 mt-1 flex justify-between items-center">
                    <span>{formatTime(message.created_at)}</span>
                    <MessageReactions messageId={message.id} currentUserId={currentUser?.id} />
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <form onSubmit={sendMessage} className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1"
            />
            <FileUpload 
              conversationId={conversation.id} 
              onUploadComplete={fetchMessages}
            />
            <Button type="submit" disabled={loading || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </div>
  );
};