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
    type varchar(16) NOT NULL
);

CREATE TABLE IF NOT EXISTS votes (
    user_id SERIAL REFERENCES users (id) ON DELETE CASCADE,
    item_id BIGSERIAL REFERENCES posts (id) ON DELETE CASCADE,
    vote_type varchar(8) DEFAULT 'upvote'
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
