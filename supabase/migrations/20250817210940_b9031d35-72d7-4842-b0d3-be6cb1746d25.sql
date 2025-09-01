-- Fix the RLS policy for conversation_participants to allow adding participants
-- to conversations the user created

DROP POLICY IF EXISTS "Users can add themselves to conversations" ON public.conversation_participants;

CREATE POLICY "Users can add participants to conversations they created"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE id = conversation_id AND created_by = auth.uid()
    )
  )
);