-- Fix the security definer function to address search path warning
DROP FUNCTION IF EXISTS public.is_user_in_conversation(uuid, uuid);

CREATE OR REPLACE FUNCTION public.is_user_in_conversation(conversation_uuid uuid, user_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.conversation_participants 
    WHERE conversation_id = conversation_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = '';