import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Search, UserPlus, Check, X, MessageCircle } from "lucide-react";

interface User {
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: string;
}

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  friend_profile: User;
}

interface FriendsManagerProps {
  currentUser: any;
  onStartConversation: (friendId: string) => void;
}

export const FriendsManager = ({ currentUser, onStartConversation }: FriendsManagerProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchFriends();
    fetchFriendRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const { data: friendsData, error } = await supabase
        .from("friends")
        .select("*")
        .eq("user_id", currentUser.id)
        .eq("status", "accepted");

      if (error) throw error;

      if (friendsData && friendsData.length > 0) {
        const friendIds = friendsData.map(friend => friend.friend_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url, status")
          .in("user_id", friendIds);

        const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

        const friendsWithProfiles = friendsData.map(friend => ({
          ...friend,
          status: friend.status as "pending" | "accepted" | "blocked",
          friend_profile: profilesMap.get(friend.friend_id) || {
            user_id: friend.friend_id,
            username: "Unknown",
            display_name: null,
            avatar_url: null,
            status: "offline",
          }
        }));

        setFriends(friendsWithProfiles);
      } else {
        setFriends([]);
      }
    } catch (error: any) {
      console.error("Error fetching friends:", error);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const { data: requestsData, error } = await supabase
        .from("friends")
        .select("*")
        .eq("friend_id", currentUser.id)
        .eq("status", "pending");

      if (error) throw error;
      
      if (requestsData && requestsData.length > 0) {
        const userIds = requestsData.map(request => request.user_id);
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url, status")
          .in("user_id", userIds);

        const profilesMap = new Map(profilesData?.map(profile => [profile.user_id, profile]) || []);

        const requestsWithProfiles = requestsData.map(request => ({
          ...request,
          status: request.status as "pending" | "accepted" | "blocked",
          friend_profile: profilesMap.get(request.user_id) || {
            user_id: request.user_id,
            username: "Unknown",
            display_name: null,
            avatar_url: null,
            status: "offline",
          }
        }));

        setFriendRequests(requestsWithProfiles);
      } else {
        setFriendRequests([]);
      }
    } catch (error: any) {
      console.error("Error fetching friend requests:", error);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .neq("user_id", currentUser.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from("friends")
        .insert([
          {
            user_id: currentUser.id,
            friend_id: friendId,
            status: "pending",
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Friend request sent",
      });
      
      setSearchResults(prev => 
        prev.filter(user => user.user_id !== friendId)
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const respondToFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      if (accept) {
        const { error } = await supabase
          .from("friends")
          .update({ status: "accepted" })
          .eq("id", requestId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("friends")
          .delete()
          .eq("id", requestId);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: accept ? "Friend request accepted" : "Friend request declined",
      });

      fetchFriends();
      fetchFriendRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Find Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            />
            <Button onClick={searchUsers} disabled={loading}>
              <Search className="w-4 h-4" />
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div key={user.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.display_name || user.username}</div>
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    </div>
                    <Badge variant="outline">
                      {getStatusIcon(user.status)} {user.status}
                    </Badge>
                  </div>
                  <Button size="sm" onClick={() => sendFriendRequest(user.user_id)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Friend Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={request.friend_profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {request.friend_profile.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {request.friend_profile.display_name || request.friend_profile.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{request.friend_profile.username}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => respondToFriendRequest(request.id, true)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => respondToFriendRequest(request.id, false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Friends List */}
      <Card>
        <CardHeader>
          <CardTitle>Friends ({friends.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={friend.friend_profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {friend.friend_profile.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {friend.friend_profile.display_name || friend.friend_profile.username}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        @{friend.friend_profile.username}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {getStatusIcon(friend.friend_profile.status)} {friend.friend_profile.status}
                    </Badge>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onStartConversation(friend.friend_id)}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              ))}
              {friends.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No friends yet. Start by searching for users above!
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};