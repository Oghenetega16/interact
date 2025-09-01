import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Settings, Users, MessageSquare } from "lucide-react";
import { ProfileEditor } from "./ProfileEditor";
import { FriendsManager } from "./FriendsManager";
import { ConversationView } from "./ConversationView";
import { MessageSearch } from "./MessageSearch";

interface Profile {
  user_id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  status: string;
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
  messages: any[];
}

export const MainApp = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations");
  const { toast } = useToast();

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
      fetchConversations();
    }
  }, [currentUser]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data: conversationsData, error } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(user_id),
          messages(id, content, created_at, user_id)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      if (conversationsData && conversationsData.length > 0) {
        // Get all unique user IDs from participants
        const allUserIds = new Set<string>();
        conversationsData.forEach(conv => {
          conv.participants.forEach(p => allUserIds.add(p.user_id));
        });

        // Fetch all profiles for these users
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", Array.from(allUserIds));

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        }

        console.log("Profiles data:", profilesData); // Debug log to see what we're getting
        console.log("Conversations data:", conversationsData); // Debug conversations

        const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

        // Combine data and ensure we have all participants
        const conversationsWithProfiles = conversationsData.map(conversation => {
          console.log("Processing conversation:", conversation.id, "participants:", conversation.participants);
          
          // For conversations where we might be missing participants, 
          // ensure we show the conversation even if participant data is incomplete
          const participantsWithProfiles = conversation.participants.map(participant => {
            const profile = profilesMap.get(participant.user_id);
            console.log("Mapping participant:", participant.user_id, "to profile:", profile);
            
            return {
              user_id: participant.user_id,
              profiles: profile || {
                username: `User-${participant.user_id.slice(0, 8)}`,
                display_name: null,
                avatar_url: null,
              }
            };
          });

          return {
            ...conversation,
            participants: participantsWithProfiles,
            messages: conversation.messages || []
          };
        });

        setConversations(conversationsWithProfiles);
      } else {
        setConversations([]);
      }
    } catch (error: any) {
      console.error("Error fetching conversations:", error);
    }
  };

  const startConversation = async (friendId: string) => {
    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          conversations!inner(
            *,
            participants:conversation_participants(user_id)
          )
        `)
        .eq("user_id", currentUser.id);

      const existing = existingConversation?.find(cp => 
        cp.conversations.participants.some(p => p.user_id === friendId) &&
        cp.conversations.participants.length === 2 &&
        !cp.conversations.is_group
      );

      if (existing) {
        // Fetch profiles for participants
        const userIds = existing.conversations.participants.map(p => p.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .in("user_id", userIds);

        const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

        const conversationWithProfiles = {
          ...existing.conversations,
          participants: existing.conversations.participants.map(participant => ({
            user_id: participant.user_id,
          profiles: profilesMap.get(participant.user_id) || {
            username: `User-${participant.user_id.slice(0, 8)}`,
            display_name: null,
            avatar_url: null,
          }
          })),
          messages: []
        };

        setActiveConversation(conversationWithProfiles);
        setActiveTab("chat");
        return;
      }

      // Create new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from("conversations")
        .insert([
          {
            is_group: false,
            created_by: currentUser.id,
          },
        ])
        .select()
        .single();

      if (conversationError) throw conversationError;

      // Add participants
      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConversation.id, user_id: currentUser.id },
          { conversation_id: newConversation.id, user_id: friendId },
        ]);

      if (participantsError) throw participantsError;

      // Fetch the complete conversation
      const { data: completeConversation, error: fetchError } = await supabase
        .from("conversations")
        .select(`
          *,
          participants:conversation_participants(user_id)
        `)
        .eq("id", newConversation.id)
        .single();

      if (fetchError) throw fetchError;

      // Fetch profiles for participants
      const userIds = completeConversation.participants.map(p => p.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

      const conversationWithProfiles = {
        ...completeConversation,
        participants: completeConversation.participants.map(participant => ({
          user_id: participant.user_id,
          profiles: profilesMap.get(participant.user_id) || {
            username: `User-${participant.user_id.slice(0, 8)}`,
            display_name: null,
            avatar_url: null,
          }
        })),
        messages: []
      };

      setActiveConversation(conversationWithProfiles);
      setActiveTab("chat");
      fetchConversations();
    } catch (error: any) {
      console.error("Failed to start conversation:", error);
      toast({
        title: "Error",
        description: `Failed to start conversation: ${error?.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'away': return '🟡';
      case 'busy': return '🔴';
      case 'offline': return '⚫';
      default: return '⚫';
    }
  };

  const formatConversationPreview = (conversation: Conversation) => {
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];
    if (!lastMessage) return "No messages yet";
    return lastMessage.content.length > 50 
      ? lastMessage.content.substring(0, 50) + "..." 
      : lastMessage.content;
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.name) return conversation.name;
    
    const otherParticipant = conversation.participants.find(
      p => p.user_id !== currentUser?.id
    );
    
    if (otherParticipant?.profiles?.username) {
      return otherParticipant.profiles.username;
    }
    
    if (otherParticipant?.profiles?.display_name) {
      return otherParticipant.profiles.display_name;
    }
    
    return "Private Chat";
  };

  if (showProfileEditor) {
    return (
      <div className="min-h-screen bg-background p-4">
        <ProfileEditor
          profile={profile}
          onProfileUpdate={(updatedProfile) => {
            setProfile(updatedProfile);
            setShowProfileEditor(false);
          }}
          onClose={() => setShowProfileEditor(false)}
        />
      </div>
    );
  }

  if (activeConversation) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="h-[calc(100vh-2rem)]">
          <ConversationView
            conversation={activeConversation}
            currentUser={currentUser}
            onBack={() => {
              setActiveConversation(null);
              setActiveTab("conversations");
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Card className="h-screen rounded-none border-0">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {profile?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {profile?.display_name || profile?.username || "User"}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {getStatusIcon(profile?.status || 'offline')} {profile?.status || 'offline'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => setShowProfileEditor(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversations">
                <MessageSquare className="w-4 h-4 mr-2" />
                Conversations
              </TabsTrigger>
              <TabsTrigger value="friends">
                <Users className="w-4 h-4 mr-2" />
                Friends
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="conversations" className="h-[calc(100%-48px)] p-4">
              <div className="space-y-4">
                <div className="mb-4">
                  <MessageSearch 
                    currentUserId={currentUser?.id || ""}
                    onMessageClick={(conversationId, messageId) => {
                      const conversation = conversations.find(c => c.id === conversationId);
                      if (conversation) {
                        setActiveConversation(conversation);
                        setActiveTab("chat");
                      }
                    }}
                  />
                </div>
                {conversations.length > 0 ? (
                  conversations.map((conversation) => (
                    <Card 
                      key={conversation.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setActiveConversation(conversation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {getConversationName(conversation).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {getConversationName(conversation)}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {formatConversationPreview(conversation)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start by adding some friends!</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="friends" className="h-[calc(100%-48px)] p-4">
              <FriendsManager
                currentUser={currentUser}
                onStartConversation={startConversation}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};