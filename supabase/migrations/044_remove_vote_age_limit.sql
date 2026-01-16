-- Remove the 48h account age restriction for voting
-- This addresses issues where users cannot vote despite having older accounts,
-- or where the service role key is misconfigured causing the API to enforce RLS.

DROP POLICY IF EXISTS "Authenticated users can vote (48h account age)" ON votes;

CREATE POLICY "Authenticated users can vote"
ON votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
