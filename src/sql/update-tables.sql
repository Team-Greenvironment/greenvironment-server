ALTER TABLE IF EXISTS votes
    ADD COLUMN IF NOT EXISTS vote_type varchar(8) DEFAULT 'upvote',
    ALTER COLUMN vote_type SET DEFAULT 'upvote';
