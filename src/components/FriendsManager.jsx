import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Check, X } from "lucide-react";

export const FriendsManager = ({ currentUser, onStartConversation }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (currentUser) {
      fetchFriends();
      fetchFriendRequests();
    }
  }, [currentUser]);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from("friends")
        .select(`
          id,
          user1_id,
          user2_id,
          created_at,
          user1:user1_id(id, username, avatar_url),
          user2:user2_id(id, username, avatar_url)
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .eq("status", "accepted");

      if (error) throw error;

      const formattedFriends = data.map(friendship => {
        const friend = friendship.user1_id === currentUser.id 
          ? friendship.user2 
          : friendship.user1;
        
        return {
          friendshipId: friendship.id,
          userId: friend.id,
          username: friend.username,
          avatarUrl: friend.avatar_url,
        };
      });

      setFriends(formattedFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast({
        title: "Error",
        description: "Failed to load friends",
        variant: "destructive",
      });
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("friends")
        .select(`
          id,
          user1_id,
          created_at,
          user1:user1_id(id, username, avatar_url)
        `)
        .eq("user2_id", currentUser.id)
        .eq("status", "pending");

      if (error) throw error;

      const formattedRequests = data.map(request => ({
        requestId: request.id,
        userId: request.user1.id,
        username: request.user1.username,
        avatarUrl: request.user1.avatar_url,
        createdAt: request.created_at,
      }));

      setFriendRequests(formattedRequests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .ilike("username", `%${searchQuery}%`)
        .neq("id", currentUser.id)
        .limit(10);

      if (error) throw error;

      // Filter out existing friends
      const friendIds = friends.map(friend => friend.userId);
      const filteredResults = data.filter(user => !friendIds.includes(user.id));
      
      setSearchResults(filteredResults);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const { error } = await supabase
        .from("friends")
        .insert({
          user1_id: currentUser.id,
          user2_id: userId,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request sent",
      });
      
      // Remove user from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send friend request",
        variant: "destructive",
      });
    }
  };

  const acceptFriendRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request accepted",
      });
      
      // Refresh friends and requests
      fetchFriends();
      fetchFriendRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept friend request",
        variant: "destructive",
      });
    }
  };

  const rejectFriendRequest = async (requestId) => {
    try {
      const { error } = await supabase
        .from("friends")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request rejected",
      });
      
      // Refresh requests
      fetchFriendRequests();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject friend request",
        variant: "destructive",
      });
    }
  };

  const startConversation = async (friendId) => {
    try {
      // Check if a direct conversation already exists
      const { data: existingConversations, error: fetchError } = await supabase
        .from("conversation_participants")
        .select(`
          conversation_id,
          conversations:conversation_id(
            id,
            is_group
          )
        `)
        .in("user_id", [currentUser.id, friendId]);
      
      if (fetchError) throw fetchError;
      
      // Group conversations by conversation_id and count participants
      const conversationCounts = {};
      existingConversations.forEach(participant => {
        if (!participant.conversations.is_group) {
          conversationCounts[participant.conversation_id] = (conversationCounts[participant.conversation_id] || 0) + 1;
        }
      });
      
      // Find direct conversations with exactly 2 participants (current user and friend)
      const directConversationId = Object.keys(conversationCounts).find(
        id => conversationCounts[id] === 2
      );
      
      if (directConversationId) {
        // Use existing conversation
        onStartConversation(directConversationId);
        return;
      }
      
      // Create a new conversation
      const { data: newConversation, error: createError } = await supabase
        .from("conversations")
        .insert({
          is_group: false,
          created_by: currentUser.id,
        })
        .select()
        .single();
      
      if (createError) throw createError;
      
      // Add participants
      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: newConversation.id, user_id: currentUser.id },
          { conversation_id: newConversation.id, user_id: friendId }
        ]);
      
      if (participantsError) throw participantsError;
      
      // Start the conversation
      onStartConversation(newConversation.id);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Error",
        description: "Failed to start conversation",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="px-4 py-3 border-b">
        <CardTitle>Friends</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 flex-1 overflow-auto">
        <div className="space-y-6">
          {/* Search Users */}
          <div>
            <div className="flex space-x-2 mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="flex-1"
              />
              <Button 
                onClick={searchUsers} 
                disabled={loading || !searchQuery.trim()}
                size="icon"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Search Results</h3>
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        {user.avatar_url ? (
                          <AvatarImage src={user.avatar_url} />
                        ) : (
                          <AvatarFallback>
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>{user.username}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => sendFriendRequest(user.id)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2">Friend Requests</h3>
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div key={request.requestId} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        {request.avatarUrl ? (
                          <AvatarImage src={request.avatarUrl} />
                        ) : (
                          <AvatarFallback>
                            {request.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>{request.username}</span>
                    </div>
                    <div className="flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => acceptFriendRequest(request.requestId)}
                        className="h-8 w-8 text-green-500"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => rejectFriendRequest(request.requestId)}
                        className="h-8 w-8 text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Friends List */}
          <div>
            <h3 className="text-sm font-medium mb-2">Your Friends</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-muted-foreground">No friends yet. Search for users to add them as friends.</p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div 
                    key={friend.userId} 
                    className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                    onClick={() => startConversation(friend.userId)}
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        {friend.avatarUrl ? (
                          <AvatarImage src={friend.avatarUrl} />
                        ) : (
                          <AvatarFallback>
                            {friend.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span>{friend.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </div>
  );
};