-- Temporarily create a more permissive policy to test auth context
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;

-- Create a temporary policy that logs what's happening
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (
  -- Log the current user ID for debugging
  auth.uid() IS NOT NULL AND
  created_by IS NOT NULL AND
  auth.uid() = created_by
);

-- Also check if we need to handle any UUID casting issues
-- Let's also create a simple test to verify auth.uid() is working
CREATE OR REPLACE FUNCTION public.test_auth_uid()
RETURNS uuid AS $$
BEGIN
  RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';