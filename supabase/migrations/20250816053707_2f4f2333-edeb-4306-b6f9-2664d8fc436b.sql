-- Fix the infinite recursion by properly recreating the function and policy
-- Step 1: Drop the policy that depends on the function
DROP POLICY IF EXISTS "Users can view participants of conversations they are in" ON conversation_participants;

-- Step 2: Drop the function 
DROP FUNCTION IF EXISTS public.is_user_in_conversation(uuid, uuid);

-- Step 3: Create the function with proper search path
CREATE OR REPLACE FUNCTION public.is_user_in_conversation(conversation_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversation_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';

-- Step 4: Create a simpler policy that avoids recursion
CREATE POLICY "Users can view participants of conversations they are in"
ON public.conversation_participants
FOR SELECT
USING (auth.uid() = user_id);