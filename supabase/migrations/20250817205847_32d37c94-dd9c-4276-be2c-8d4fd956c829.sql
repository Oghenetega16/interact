
-- Drop the temporary policy and create a proper one
DROP POLICY IF EXISTS "temp_allow_conversation_creation" ON public.conversations;

-- Create a proper policy that allows authenticated users to create conversations
-- where they are the creator
CREATE POLICY "Users can create conversations they own" 
ON public.conversations 
FOR INSERT 
WITH CHECK (auth.uid() = created_by AND auth.uid() IS NOT NULL);

-- Also ensure the SELECT policy works correctly
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations" 
ON public.conversations 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = created_by OR 
    id IN (
      SELECT conversation_id 
      FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
  )
);
