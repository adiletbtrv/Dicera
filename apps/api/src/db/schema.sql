-- DnD Platform Database Schema
-- PostgreSQL 15+ with pgvector extension

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================
-- AUTH / USERS
-- ============================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  is_verified BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- CORE CONTENT TABLES
-- ============================
CREATE TABLE IF NOT EXISTS spells (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 0 AND 9),
  school TEXT NOT NULL,
  casting_time TEXT NOT NULL,
  range TEXT NOT NULL,
  components JSONB NOT NULL,
  duration TEXT NOT NULL,
  concentration BOOLEAN NOT NULL DEFAULT false,
  ritual BOOLEAN NOT NULL DEFAULT false,
  description TEXT NOT NULL,
  higher_levels TEXT,
  classes TEXT[] NOT NULL DEFAULT '{}',
  subclasses TEXT[] DEFAULT '{}',
  source TEXT NOT NULL,
  page INTEGER,
  tags TEXT[] DEFAULT '{}',
  homebrew BOOLEAN DEFAULT false,
  homebrew_creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monsters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  alignment TEXT,
  armor_class INTEGER NOT NULL,
  armor_desc TEXT,
  hit_points INTEGER NOT NULL,
  hit_dice TEXT NOT NULL,
  speed JSONB NOT NULL DEFAULT '{}',
  ability_scores JSONB NOT NULL,
  saving_throws JSONB DEFAULT '{}',
  skills JSONB DEFAULT '{}',
  damage_vulnerabilities TEXT[] DEFAULT '{}',
  damage_resistances TEXT[] DEFAULT '{}',
  damage_immunities TEXT[] DEFAULT '{}',
  condition_immunities TEXT[] DEFAULT '{}',
  senses JSONB NOT NULL DEFAULT '{}',
  languages TEXT,
  challenge_rating TEXT NOT NULL,
  proficiency_bonus INTEGER NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  special_abilities JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  bonus_actions JSONB DEFAULT '[]',
  reactions JSONB DEFAULT '[]',
  legendary_actions JSONB DEFAULT '[]',
  lair_actions JSONB DEFAULT '[]',
  mythic_actions JSONB DEFAULT '[]',
  description TEXT,
  source TEXT NOT NULL,
  page INTEGER,
  environments TEXT[] DEFAULT '{}',
  image_url TEXT,
  homebrew BOOLEAN DEFAULT false,
  homebrew_creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common',
  requires_attunement BOOLEAN DEFAULT false,
  attunement_desc TEXT,
  weight NUMERIC,
  cost JSONB,
  description TEXT NOT NULL,
  properties TEXT[] DEFAULT '{}',
  damage JSONB,
  armor_class JSONB,
  range JSONB,
  magic_bonus INTEGER,
  source TEXT NOT NULL,
  page INTEGER,
  homebrew BOOLEAN DEFAULT false,
  homebrew_creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  hit_die TEXT NOT NULL,
  description TEXT NOT NULL,
  primary_ability TEXT[] NOT NULL,
  saving_throw_proficiencies TEXT[] NOT NULL,
  armor_proficiencies TEXT[] NOT NULL DEFAULT '{}',
  weapon_proficiencies TEXT[] NOT NULL DEFAULT '{}',
  tool_proficiencies TEXT[] DEFAULT '{}',
  skill_choices JSONB NOT NULL,
  starting_equipment TEXT[] DEFAULT '{}',
  spellcasting JSONB,
  subclass_level INTEGER DEFAULT 3,
  subclass_flavor TEXT DEFAULT 'Subclass',
  features JSONB DEFAULT '[]',
  source TEXT NOT NULL,
  page INTEGER
);

CREATE TABLE IF NOT EXISTS subclasses (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  flavor_name TEXT,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  features JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS races (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  size TEXT NOT NULL,
  speed INTEGER NOT NULL,
  ability_score_increases JSONB NOT NULL DEFAULT '{}',
  traits JSONB DEFAULT '[]',
  subraces JSONB DEFAULT '[]',
  languages TEXT[] DEFAULT '{}',
  source TEXT NOT NULL,
  page INTEGER
);

CREATE TABLE IF NOT EXISTS backgrounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  skill_proficiencies TEXT[] NOT NULL,
  tool_proficiencies TEXT[] DEFAULT '{}',
  languages INTEGER DEFAULT 0,
  starting_equipment TEXT[] DEFAULT '{}',
  starting_gold INTEGER DEFAULT 0,
  feature_name TEXT NOT NULL,
  feature_description TEXT NOT NULL,
  personality_traits TEXT[] DEFAULT '{}',
  ideals TEXT[] DEFAULT '{}',
  bonds TEXT[] DEFAULT '{}',
  flaws TEXT[] DEFAULT '{}',
  source TEXT NOT NULL,
  page INTEGER
);

-- ============================
-- CHARACTERS
-- ============================
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID,
  name TEXT NOT NULL,
  race_id TEXT NOT NULL,
  race_name TEXT NOT NULL,
  subrace_id TEXT,
  subrace_name TEXT,
  background_id TEXT NOT NULL,
  background_name TEXT NOT NULL,
  alignment TEXT NOT NULL DEFAULT 'true neutral',
  experience_points INTEGER NOT NULL DEFAULT 0,
  classes JSONB NOT NULL DEFAULT '[]',
  total_level INTEGER NOT NULL DEFAULT 1,
  ability_scores JSONB NOT NULL,
  saving_throw_proficiencies TEXT[] DEFAULT '{}',
  skill_proficiencies TEXT[] DEFAULT '{}',
  skill_expertises TEXT[] DEFAULT '{}',
  max_hit_points INTEGER NOT NULL,
  current_hit_points INTEGER NOT NULL,
  temporary_hit_points INTEGER NOT NULL DEFAULT 0,
  hit_dice_total TEXT NOT NULL,
  hit_dice_used INTEGER DEFAULT 0,
  death_save_successes INTEGER DEFAULT 0 CHECK (death_save_successes BETWEEN 0 AND 3),
  death_save_failures INTEGER DEFAULT 0 CHECK (death_save_failures BETWEEN 0 AND 3),
  armor_class INTEGER NOT NULL,
  initiative_bonus INTEGER NOT NULL DEFAULT 0,
  speed INTEGER NOT NULL DEFAULT 30,
  proficiency_bonus INTEGER NOT NULL DEFAULT 2,
  passive_perception INTEGER NOT NULL DEFAULT 10,
  inspiration BOOLEAN DEFAULT false,
  feat_ids TEXT[] DEFAULT '{}',
  equipment JSONB DEFAULT '[]',
  copper INTEGER DEFAULT 0,
  silver INTEGER DEFAULT 0,
  electrum INTEGER DEFAULT 0,
  gold INTEGER DEFAULT 0,
  platinum INTEGER DEFAULT 0,
  prepared_spell_ids TEXT[] DEFAULT '{}',
  known_spell_ids TEXT[] DEFAULT '{}',
  spell_slots JSONB DEFAULT '[]',
  languages TEXT[] DEFAULT '{}',
  personality_traits TEXT DEFAULT '',
  ideals TEXT DEFAULT '',
  bonds TEXT DEFAULT '',
  flaws TEXT DEFAULT '',
  backstory TEXT DEFAULT '',
  appearance TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- CAMPAIGNS
-- ============================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  setting TEXT DEFAULT '',
  system TEXT DEFAULT 'D&D 5e',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hiatus', 'completed', 'archived')),
  player_ids UUID[] DEFAULT '{}',
  character_ids UUID[] DEFAULT '{}',
  image_url TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_campaign'
  ) THEN
    ALTER TABLE characters ADD CONSTRAINT fk_campaign
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS npcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  race TEXT,
  occupation TEXT,
  location_id UUID,
  alignment TEXT,
  description TEXT DEFAULT '',
  personality TEXT DEFAULT '',
  motivations TEXT DEFAULT '',
  secrets TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  monster_stat_block_id TEXT,
  is_alive BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'other',
  parent_location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  map_id UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS session_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  date_played DATE,
  summary TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  xp_awarded INTEGER DEFAULT 0,
  loot_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- ENCOUNTERS
-- ============================
CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  monsters JSONB DEFAULT '[]',
  party_size INTEGER NOT NULL DEFAULT 4,
  party_level INTEGER NOT NULL DEFAULT 5,
  difficulty TEXT,
  total_xp INTEGER DEFAULT 0,
  adjusted_xp INTEGER DEFAULT 0,
  xp_per_player INTEGER DEFAULT 0,
  environment TEXT,
  notes TEXT DEFAULT '',
  is_template BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- MAPS
-- ============================
CREATE TABLE IF NOT EXISTS maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  width_px INTEGER NOT NULL,
  height_px INTEGER NOT NULL,
  grid_size_px INTEGER DEFAULT 50,
  grid_enabled BOOLEAN DEFAULT true,
  fog_of_war_enabled BOOLEAN DEFAULT false,
  fog_revealed_cells JSONB DEFAULT '[]',
  tokens JSONB DEFAULT '[]',
  annotations JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- HOMEBREW
-- ============================
CREATE TABLE IF NOT EXISTS homebrew (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  likes INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  version TEXT DEFAULT '1.0',
  parent_id UUID REFERENCES homebrew(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- RAG VECTOR STORE
-- ============================
CREATE TABLE IF NOT EXISTS rag_chunks (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  page INTEGER,
  section TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS rag_chunks_embedding_idx
  ON rag_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================
-- DICE ROLL HISTORY
-- ============================
CREATE TABLE IF NOT EXISTS dice_roll_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  expression TEXT NOT NULL,
  result INTEGER NOT NULL,
  rolls JSONB NOT NULL DEFAULT '[]',
  modifier INTEGER DEFAULT 0,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX IF NOT EXISTS spells_level_idx ON spells(level);
CREATE INDEX IF NOT EXISTS spells_school_idx ON spells(school);
CREATE INDEX IF NOT EXISTS spells_classes_idx ON spells USING gin(classes);
CREATE INDEX IF NOT EXISTS spells_name_trgm_idx ON spells USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS monsters_cr_idx ON monsters(challenge_rating);
CREATE INDEX IF NOT EXISTS monsters_type_idx ON monsters(type);
CREATE INDEX IF NOT EXISTS monsters_name_trgm_idx ON monsters USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS items_category_idx ON items(category);
CREATE INDEX IF NOT EXISTS items_rarity_idx ON items(rarity);
CREATE INDEX IF NOT EXISTS items_name_trgm_idx ON items USING gin(name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS characters_user_id_idx ON characters(user_id);
CREATE INDEX IF NOT EXISTS characters_campaign_id_idx ON characters(campaign_id);

CREATE INDEX IF NOT EXISTS campaigns_owner_id_idx ON campaigns(owner_id);
CREATE INDEX IF NOT EXISTS encounters_campaign_id_idx ON encounters(campaign_id);
CREATE INDEX IF NOT EXISTS homebrew_creator_id_idx ON homebrew(creator_id);
CREATE INDEX IF NOT EXISTS homebrew_type_idx ON homebrew(type);

-- ============================
-- UPDATED_AT TRIGGERS
-- ============================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON npcs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_notes_updated_at BEFORE UPDATE ON session_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_encounters_updated_at BEFORE UPDATE ON encounters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maps_updated_at BEFORE UPDATE ON maps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_homebrew_updated_at BEFORE UPDATE ON homebrew
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
