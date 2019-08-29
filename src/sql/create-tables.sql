CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name varchar(128) NOT NULL,
    password varchar(1024) NOT NULL,
    email varchar(128) UNIQUE NOT NULL,
    greenpoints INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS feed_items (
    id BIGSERIAL PRIMARY KEY,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now(),
    content text,
    author SERIAL REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
    user_id SERIAL REFERENCES users (id) ON DELETE CASCADE,
    item_id BIGSERIAL REFERENCES feed_items (id) ON DELETE CASCADE
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
