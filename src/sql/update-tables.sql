DO $$ BEGIN

    ALTER TABLE IF EXISTS votes
        ADD COLUMN IF NOT EXISTS vote_type votetype DEFAULT 'UPVOTE',
        ALTER COLUMN vote_type TYPE votetype USING cast_to_votetype(vote_type::text),
        ALTER COLUMN vote_type DROP DEFAULT,
        ALTER COLUMN vote_type SET DEFAULT 'UPVOTE';

    ALTER TABLE IF EXISTS posts
        ALTER COLUMN type TYPE posttype USING cast_to_posttype(type::text),
        ALTER COLUMN type DROP DEFAULT,
        ALTER COLUMN type SET DEFAULT 'MISC',
        DROP COLUMN IF EXISTS upvotes,
        DROP COLUMN IF EXISTS downvotes;

    ALTER TABLE requests
        ADD COLUMN IF NOT EXISTS type requesttype DEFAULT 'FRIENDREQUEST';

END $$;
