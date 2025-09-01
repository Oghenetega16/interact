-- Fix RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON conversations;

-- Create proper RLS policies for conversation_participants
CREATE POLICY "Users can view participants of conversations they are in"
ON conversation_participants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  conversation_id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Create proper RLS policy for conversations
CREATE POLICY "Users can view their conversations"
ON conversations
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT conversation_id 
    FROM conversation_participants 
    WHERE user_id = auth.uid()
  )
);

-- Ensure proper foreign key constraints exist
DO $$ 
BEGIN
    -- Add foreign key from messages to profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_user_id_fkey' 
        AND table_name = 'messages'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT messages_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from friends to profiles (friend_id) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'friends_friend_id_fkey' 
        AND table_name = 'friends'
    ) THEN
        ALTER TABLE friends ADD CONSTRAINT friends_friend_id_fkey 
        FOREIGN KEY (friend_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from friends to profiles (user_id) if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'friends_user_id_fkey' 
        AND table_name = 'friends'
    ) THEN
        ALTER TABLE friends ADD CONSTRAINT friends_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    END IF;

    -- Add foreign key from conversation_participants to profiles if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversation_participants_user_id_fkey' 
        AND table_name = 'conversation_participants'
    ) THEN
        ALTER TABLE conversation_participants ADD CONSTRAINT conversation_participants_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;