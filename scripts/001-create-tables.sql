-- Create tables for Cultivate

-- Users table already exists in neon_auth schema, so we'll reference it

-- Plants in user's garden
CREATE TABLE IF NOT EXISTS user_plants (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE,
  plant_id TEXT NOT NULL,
  plant_name TEXT NOT NULL,
  plant_type TEXT NOT NULL,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garden layouts
CREATE TABLE IF NOT EXISTS garden_layouts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE,
  shape_type TEXT NOT NULL, -- 'rectangle', 'l-shape', 'curved', 'custom'
  dimensions JSONB NOT NULL, -- Store width/height or custom points
  area DECIMAL(10, 2),
  plants JSONB DEFAULT '[]', -- Array of plant positions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Care schedule tasks
CREATE TABLE IF NOT EXISTS care_tasks (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL, -- 'water', 'fertilize', 'prune', etc.
  plant_name TEXT,
  frequency TEXT NOT NULL,
  last_completed TIMESTAMP WITH TIME ZONE,
  next_due TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences (hardiness zone, etc)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES neon_auth.users_sync(id) ON DELETE CASCADE,
  hardiness_zone TEXT,
  location_address TEXT,
  preferred_view TEXT DEFAULT 'home', -- last active tab
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_plants_user_id ON user_plants(user_id);
CREATE INDEX IF NOT EXISTS idx_garden_layouts_user_id ON garden_layouts(user_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_user_id ON care_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_next_due ON care_tasks(next_due);
