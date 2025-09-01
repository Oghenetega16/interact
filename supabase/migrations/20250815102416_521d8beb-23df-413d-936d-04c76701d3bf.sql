-- Fix infinite recursion in conversation_participants RLS policy
-- The current policy has infinite recursion because it references the same table

-- First, create a security definer function to check if user is in conversation
CREATE OR REPLACE FUNCTION public.is_user_in_conversation(conversation_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversation_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants of conversations they are in" ON conversation_participants;

-- Create new policy using the security definer function
CREATE POLICY "Users can view participants of conversations they are in"
ON public.conversation_participants
FOR SELECT
USING (
  auth.uid() = user_id OR 
  public.is_user_in_conversation(conversation_id, auth.uid())
);