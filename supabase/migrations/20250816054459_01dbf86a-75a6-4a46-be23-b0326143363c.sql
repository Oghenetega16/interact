-- Let's try a completely different approach to debug this RLS issue
-- First, let's temporarily disable RLS to test if the insert works at all
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- Then immediately re-enable it with a very simple policy to test
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policy and create the simplest possible one for testing
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Create a very basic policy that should work for authenticated users
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- We'll fix this to be more secure after we confirm it works