"""Initial migration

Revision ID: 001_initial
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable pgvector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # Users
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('username', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('full_name', sa.String()),
        sa.Column('avatar_url', sa.String()),
        sa.Column('grade_level', sa.String(), server_default='middle'),
        sa.Column('role', sa.String(), server_default='student'),
        sa.Column('xp', sa.Integer(), server_default='0'),
        sa.Column('level', sa.Integer(), server_default='1'),
        sa.Column('detective_rank', sa.String(), server_default='Rookie Detective'),
        sa.Column('learning_profile', postgresql.JSONB(), server_default='{}'),
        sa.Column('preferences', postgresql.JSONB(), server_default='{}'),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('username'),
    )

    # Cases
    op.create_table('cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('student_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('grade_level', sa.String(), nullable=False),
        sa.Column('difficulty', sa.String(), nullable=False),
        sa.Column('topic', sa.String(), nullable=False),
        sa.Column('status', sa.String(), server_default='active'),
        sa.Column('story', sa.Text()),
        sa.Column('characters', postgresql.JSONB(), server_default='[]'),
        sa.Column('clues', postgresql.JSONB(), server_default='[]'),
        sa.Column('evidence_chain', postgresql.JSONB(), server_default='[]'),
        sa.Column('stem_concepts', postgresql.JSONB(), server_default='[]'),
        sa.Column('investigation_path', postgresql.JSONB(), server_default='[]'),
        sa.Column('world_state', postgresql.JSONB(), server_default='{}'),
        sa.Column('conversation_history', postgresql.JSONB(), server_default='[]'),
        sa.Column('progress_percentage', sa.Float(), server_default='0'),
        sa.Column('xp_earned', sa.Integer(), server_default='0'),
        sa.Column('solution', sa.Text()),
        sa.Column('student_hypothesis', sa.Text()),
        sa.Column('is_solved', sa.Boolean(), server_default='false'),
        sa.Column('thumbnail_url', sa.String()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True)),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(['student_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Evidence
    op.create_table('evidence',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('evidence_type', sa.String()),
        sa.Column('content', postgresql.JSONB()),
        sa.Column('image_url', sa.String()),
        sa.Column('is_key_evidence', sa.Boolean(), server_default='false'),
        sa.Column('relevance_score', sa.Float(), server_default='0'),
        sa.Column('ai_analysis', sa.Text()),
        sa.Column('collected_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Lab experiments
    op.create_table('lab_experiments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('lab_type', sa.String()),
        sa.Column('experiment_name', sa.String()),
        sa.Column('hypothesis', sa.Text()),
        sa.Column('procedure', postgresql.JSONB()),
        sa.Column('variables', postgresql.JSONB()),
        sa.Column('results', postgresql.JSONB()),
        sa.Column('conclusion', sa.Text()),
        sa.Column('is_correct', sa.Boolean()),
        sa.Column('xp_earned', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Hint usage
    op.create_table('hint_usage',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('hint_level', sa.Integer()),
        sa.Column('hint_text', sa.Text()),
        sa.Column('used_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Achievements
    op.create_table('achievements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('icon', sa.String()),
        sa.Column('badge_type', sa.String()),
        sa.Column('xp_reward', sa.Integer(), server_default='0'),
        sa.Column('criteria', postgresql.JSONB()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name'),
    )

    # User achievements
    op.create_table('user_achievements',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('achievement_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('earned_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['achievement_id'], ['achievements.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Knowledge nodes
    op.create_table('knowledge_nodes',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('concept', sa.String(), nullable=False),
        sa.Column('subject', sa.String()),
        sa.Column('mastery_level', sa.Float(), server_default='0'),
        sa.Column('times_encountered', sa.Integer(), server_default='0'),
        sa.Column('times_correct', sa.Integer(), server_default='0'),
        sa.Column('last_seen', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Classrooms
    op.create_table('classrooms',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('teacher_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('join_code', sa.String()),
        sa.Column('grade_level', sa.String()),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('settings', postgresql.JSONB(), server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['teacher_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('join_code'),
    )

    # Classroom members
    op.create_table('classroom_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('classroom_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Assignments
    op.create_table('assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('classroom_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('mystery_config', postgresql.JSONB()),
        sa.Column('due_date', sa.DateTime(timezone=True)),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['classroom_id'], ['classrooms.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # Indexes
    op.create_index('idx_cases_student_id', 'cases', ['student_id'])
    op.create_index('idx_cases_status', 'cases', ['status'])
    op.create_index('idx_evidence_case_id', 'evidence', ['case_id'])
    op.create_index('idx_knowledge_nodes_user_id', 'knowledge_nodes', ['user_id'])
    op.create_index('idx_user_achievements_user_id', 'user_achievements', ['user_id'])
    op.create_index('idx_users_xp', 'users', ['xp'], postgresql_ops={'xp': 'DESC'})


def downgrade() -> None:
    op.drop_table('assignments')
    op.drop_table('classroom_members')
    op.drop_table('classrooms')
    op.drop_table('knowledge_nodes')
    op.drop_table('user_achievements')
    op.drop_table('achievements')
    op.drop_table('hint_usage')
    op.drop_table('lab_experiments')
    op.drop_table('evidence')
    op.drop_table('cases')
    op.drop_table('users')
