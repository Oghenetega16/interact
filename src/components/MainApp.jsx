import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatList } from "./ChatList";
import { ConversationView } from "./ConversationView";
import { FriendsManager } from "./FriendsManager";
import { ProfileEditor } from "./ProfileEditor";
import { LogOut, MessageSquare, Users, User } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

export const MainApp = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);
  const [activeTab, setActiveTab] = useState("chats");
  const isMobile = useMobile();

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleStartConversation = (conversationId) => {
    setActiveConversation(conversationId);
    if (isMobile) {
      setActiveTab("conversation");
    }
  };

  const handleBackToList = () => {
    setActiveConversation(null);
    if (isMobile) {
      setActiveTab("chats");
    }
  };

  // Mobile view with tabs
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <div className="flex justify-between items-center p-3 border-b">
          <h1 className="text-xl font-bold">Chat App</h1>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="chats">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="friends">
                <Users className="h-4 w-4 mr-2" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chats" className="flex-1 overflow-hidden">
              {activeConversation ? (
                <Card className="h-full border-0">
                  <ConversationView 
                    conversation={activeConversation}
                    currentUser={currentUser}
                    onBack={handleBackToList}
                  />
                </Card>
              ) : (
                <Card className="h-full border-0">
                  <ChatList 
                    currentUser={currentUser}
                    onSelectConversation={handleStartConversation}
                  />
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="friends" className="flex-1 overflow-hidden">
              <Card className="h-full border-0">
                <FriendsManager 
                  currentUser={currentUser}
                  onStartConversation={handleStartConversation}
                />
              </Card>
            </TabsContent>
            
            <TabsContent value="profile" className="flex-1 overflow-hidden">
              <Card className="h-full border-0">
                <ProfileEditor currentUser={currentUser} />
              </Card>
            </TabsContent>
            
            {activeConversation && (
              <TabsContent value="conversation" className="flex-1 overflow-hidden">
                <Card className="h-full border-0">
                  <ConversationView 
                    conversation={activeConversation}
                    currentUser={currentUser}
                    onBack={handleBackToList}
                  />
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    );
  }
  
  // Desktop view with sidebar
  return (
    <div className="h-screen flex bg-background">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-4">Chat App</h1>
          <Tabs defaultValue="chats" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="chats">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="friends">
                <Users className="h-4 w-4 mr-2" />
                Friends
              </TabsTrigger>
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chats" className="mt-4">
              <ChatList 
                currentUser={currentUser}
                onSelectConversation={handleStartConversation}
              />
            </TabsContent>
            
            <TabsContent value="friends" className="mt-4">
              <FriendsManager 
                currentUser={currentUser}
                onStartConversation={handleStartConversation}
              />
            </TabsContent>
            
            <TabsContent value="profile" className="mt-4">
              <ProfileEditor currentUser={currentUser} />
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="mt-auto p-4 border-t">
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
      
      <div className="flex-1">
        {activeConversation ? (
          <Card className="h-full rounded-none border-0">
            <ConversationView 
              conversation={activeConversation}
              currentUser={currentUser}
              onBack={handleBackToList}
            />
          </Card>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Welcome to Chat App</h2>
              <p className="text-muted-foreground">
                Select a conversation or start a new one with a friend.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};