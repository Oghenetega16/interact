-- Fix critical security vulnerability in profiles RLS policy
-- Current policy allows ANYONE (even unauthenticated users) to read all profile data
-- This exposes usernames, display names, bios, and avatar URLs to the public internet

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

-- Create secure RLS policy that requires authentication
-- This maintains app functionality (users can find friends) while protecting against public exposure
CREATE POLICY "Profiles are viewable by authenticated users only"
ON profiles
FOR SELECT
TO authenticated
USING (true);

-- Keep existing policies for insert/update (users manage their own profiles)
-- These are already secure as they require auth.uid() = user_id