--create functions
DO $$BEGIN

    IF NOT EXISTS(SELECT 1 from pg_proc WHERE proname = 'function_exists') THEN
        CREATE FUNCTION function_exists(text) RETURNS boolean LANGUAGE plpgsql AS $BODY$
        BEGIN
            RETURN EXISTS(SELECT 1 from pg_proc WHERE proname = $1);
        END $BODY$;
    END IF;

    IF NOT function_exists('type_exists') THEN
        CREATE FUNCTION type_exists(text) RETURNS boolean LANGUAGE plpgsql AS $BODY$
        BEGIN
            RETURN EXISTS (SELECT 1 FROM pg_type WHERE typname = $1);
        END $BODY$;
    END IF;

    IF NOT function_exists('cast_to_votetype') THEN
        CREATE FUNCTION cast_to_votetype(text) RETURNS votetype LANGUAGE plpgsql AS $BODY$
        BEGIN
            RETURN CASE WHEN $1::votetype IS NULL THEN 'UPVOTE' ELSE $1::votetype END;
        END $BODY$;
    END IF;

    IF NOT function_exists('cast_to_posttype') THEN
        CREATE FUNCTION cast_to_posttype(text) RETURNS posttype LANGUAGE plpgsql AS $BODY$
        BEGIN
            RETURN CASE WHEN $1::posttype IS NULL THEN 'MISC' ELSE $1::posttype END;
        END $BODY$;
    END IF;

END$$;

--create types
DO $$ BEGIN

    IF NOT type_exists('votetype') THEN
        CREATE TYPE votetype AS enum ('DOWNVOTE', 'UPVOTE');
    END IF;

    IF NOT type_exists('posttype') THEN
        CREATE TYPE posttype AS enum ('MISC', 'ACTION', 'IMAGE', 'TEXT');
    END IF;

    IF NOT type_exists('requesttype') THEN
        CREATE TYPE requesttype AS enum ('FRIENDREQUEST');
    END IF;

END$$;

-- create tables
DO $$ BEGIN

    CREATE TABLE IF NOT EXISTS "user_sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    ) WITH (OIDS=FALSE);

    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name varchar(128) NOT NULL,
        handle varchar(128) UNIQUE NOT NULL,
        password varchar(1024) NOT NULL,
        email varchar(128) UNIQUE NOT NULL,
        greenpoints INTEGER DEFAULT 0,
        joined_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS posts (
        id BIGSERIAL PRIMARY KEY,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT now(),
        content text,
        author SERIAL REFERENCES users (id) ON DELETE CASCADE,
        type posttype NOT NULL DEFAULT 'MISC'
    );

    CREATE TABLE IF NOT EXISTS votes (
        user_id SERIAL REFERENCES users (id) ON DELETE CASCADE,
        item_id BIGSERIAL REFERENCES posts (id) ON DELETE CASCADE,
        vote_type votetype DEFAULT 'DOWNVOTE'
    );

    CREATE TABLE IF NOT EXISTS events (
        id BIGSERIAL PRIMARY KEY,
        time TIMESTAMP,
        owner SERIAL REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS event_members (
        event BIGSERIAL REFERENCES events (id),
        member SERIAL REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS chats (
        id BIGSERIAL PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        chat BIGSERIAL REFERENCES chats (id) ON DELETE CASCADE,
        author SERIAL REFERENCES users (id) ON DELETE SET NULL,
        content VARCHAR(1024) NOT NULL,
        created_at TIMESTAMP DEFAULT now(),
        PRIMARY KEY (chat, author, created_at)
    );

    CREATE TABLE IF NOT EXISTS chat_members (
        chat BIGSERIAL REFERENCES chats (id) ON DELETE CASCADE,
        member SERIAL REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_friends (
        user_id SERIAL REFERENCES users (id) ON DELETE CASCADE,
        friend_id SERIAL REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requests (
        sender SERIAL REFERENCES users (id) ON DELETE CASCADE,
        receiver SERIAL REFERENCES users (id) ON DELETE CASCADE
    );

END $$;
