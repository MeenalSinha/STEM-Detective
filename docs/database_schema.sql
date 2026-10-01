-- STEM Detective Database Schema
-- Run this in your Supabase SQL editor or as an Alembic migration

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    avatar_url VARCHAR,
    grade_level VARCHAR DEFAULT 'middle',
    role VARCHAR DEFAULT 'student',
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    detective_rank VARCHAR DEFAULT 'Rookie Detective',
    learning_profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ
);

-- Cases table
CREATE TABLE IF NOT EXISTS cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    grade_level VARCHAR NOT NULL,
    difficulty VARCHAR NOT NULL,
    topic VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'active',
    story TEXT,
    characters JSONB DEFAULT '[]',
    clues JSONB DEFAULT '[]',
    evidence_chain JSONB DEFAULT '[]',
    stem_concepts JSONB DEFAULT '[]',
    investigation_path JSONB DEFAULT '[]',
    world_state JSONB DEFAULT '{}',
    conversation_history JSONB DEFAULT '[]',
    progress_percentage FLOAT DEFAULT 0.0,
    xp_earned INTEGER DEFAULT 0,
    solution TEXT,
    student_hypothesis TEXT,
    is_solved BOOLEAN DEFAULT FALSE,
    thumbnail_url VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    evidence_type VARCHAR,
    content JSONB,
    image_url VARCHAR,
    is_key_evidence BOOLEAN DEFAULT FALSE,
    relevance_score FLOAT DEFAULT 0.0,
    ai_analysis TEXT,
    embedding vector(1536),
    collected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab experiments table
CREATE TABLE IF NOT EXISTS lab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    lab_type VARCHAR,
    experiment_name VARCHAR,
    hypothesis TEXT,
    procedure JSONB,
    variables JSONB,
    results JSONB,
    conclusion TEXT,
    is_correct BOOLEAN,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hint usage table
CREATE TABLE IF NOT EXISTS hint_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    hint_level INTEGER,
    hint_text TEXT,
    used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR,
    badge_type VARCHAR,
    xp_reward INTEGER DEFAULT 0,
    criteria JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id),
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge nodes table
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    concept VARCHAR NOT NULL,
    subject VARCHAR,
    mastery_level FLOAT DEFAULT 0.0,
    times_encountered INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    join_code VARCHAR UNIQUE,
    grade_level VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classroom members table
CREATE TABLE IF NOT EXISTS classroom_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    classroom_id UUID REFERENCES classrooms(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    mystery_config JSONB,
    due_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEM concepts vector store
CREATE TABLE IF NOT EXISTS stem_concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    concept VARCHAR NOT NULL,
    subject VARCHAR,
    grade_level VARCHAR,
    explanation TEXT,
    examples JSONB,
    related_concepts JSONB,
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cases_student_id ON cases(student_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_lab_experiments_case_id ON lab_experiments(case_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_user_id ON knowledge_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom_id ON classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_user_id ON classroom_members(user_id);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);

-- Vector similarity search index
CREATE INDEX IF NOT EXISTS idx_evidence_embedding ON evidence USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_stem_concepts_embedding ON stem_concepts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Seed default achievements
INSERT INTO achievements (id, name, description, badge_type, xp_reward, criteria) VALUES
    (uuid_generate_v4(), 'First Case', 'Solve your very first mystery', 'bronze', 50, '{"type": "first_case"}'::jsonb),
    (uuid_generate_v4(), 'Triple Threat', 'Solve 3 mysteries', 'bronze', 100, '{"type": "cases_solved", "count": 3}'::jsonb),
    (uuid_generate_v4(), 'STEM Sleuth', 'Solve 10 mysteries', 'silver', 250, '{"type": "cases_solved", "count": 10}'::jsonb),
    (uuid_generate_v4(), 'Master Detective', 'Solve 25 mysteries', 'gold', 500, '{"type": "cases_solved", "count": 25}'::jsonb),
    (uuid_generate_v4(), 'XP Milestone: 1000', 'Earn 1,000 XP', 'bronze', 0, '{"type": "xp", "amount": 1000}'::jsonb),
    (uuid_generate_v4(), 'XP Milestone: 5000', 'Earn 5,000 XP', 'silver', 0, '{"type": "xp", "amount": 5000}'::jsonb),
    (uuid_generate_v4(), 'Science Pioneer', 'Complete experiments in all 4 lab types', 'gold', 300, '{"type": "all_labs"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Cases belong to students
CREATE POLICY "Students can manage own cases" ON cases FOR ALL USING (auth.uid()::text = student_id::text);

-- Service role bypasses RLS (for backend API)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
