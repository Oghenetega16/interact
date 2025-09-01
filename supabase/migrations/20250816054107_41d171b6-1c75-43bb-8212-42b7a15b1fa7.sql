-- Check and fix conversations RLS policy for INSERT
-- The current policy might be having issues with auth.uid() matching

-- Let's recreate the INSERT policy to be more explicit
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = created_by::text);