-- Let's check if there are any issues with the RLS setup
-- First ensure the table has proper RLS enabled
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop and recreate all conversation policies to ensure they're working
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update conversations they created" ON conversations; 
DROP POLICY IF EXISTS "Users can view their conversations" ON conversations;

-- Recreate policies with explicit checks
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update conversations they created"  
ON public.conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can view their conversations"
ON public.conversations  
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT conversation_id 
    FROM public.conversation_participants 
    WHERE user_id = auth.uid()
  )
);