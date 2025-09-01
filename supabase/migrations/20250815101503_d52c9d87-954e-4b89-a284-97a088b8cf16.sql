-- Fix critical security vulnerability in messages RLS policy
-- The current policy allows any authenticated user to read messages where conversation_id IS NULL
-- This exposes private messages that should only be visible to their sender

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

-- Create secure RLS policy that properly restricts access
CREATE POLICY "Users can view messages in their conversations"
ON messages
FOR SELECT
TO authenticated
USING (
  -- For messages without conversation_id (private/direct messages), 
  -- only the sender can see them
  (conversation_id IS NULL AND user_id = auth.uid()) 
  OR 
  -- For messages in conversations, user must be a participant
  (conversation_id IS NOT NULL AND EXISTS (
    SELECT 1
    FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  ))
);