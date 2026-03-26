-- Run this in Supabase SQL Editor
-- Table: open_events
CREATE TABLE IF NOT EXISTS open_events (
    id          BIGSERIAL PRIMARY KEY,
    token       TEXT NOT NULL,
    ip          TEXT,
    user_agent  TEXT,
    country     TEXT,
    region      TEXT,
    city        TEXT,
    isp         TEXT,
    opened_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by token
CREATE INDEX IF NOT EXISTS idx_open_events_token ON open_events(token);
CREATE INDEX IF NOT EXISTS idx_open_events_opened_at ON open_events(opened_at DESC);

-- Table: tracked_emails (optional metadata store)
CREATE TABLE IF NOT EXISTS tracked_emails (
    id          BIGSERIAL PRIMARY KEY,
    token       TEXT UNIQUE NOT NULL,
    recipient   TEXT,
    subject     TEXT,
    company     TEXT,
    role        TEXT,
    platform    TEXT,  -- linkedin, naukrigulf, indeed, email
    sent_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_emails_token ON tracked_emails(token);
