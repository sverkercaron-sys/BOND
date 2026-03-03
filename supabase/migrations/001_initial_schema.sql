-- ENUMS
CREATE TYPE exercise_category AS ENUM ('appreciation', 'curiosity', 'memories', 'reciprocity', 'play');
CREATE TYPE invite_type AS ENUM ('partner', 'couple_friend', 'friend');
CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'expired');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE pulse_question_key AS ENUM ('connection', 'communication', 'appreciation', 'fun', 'trust');

-- TABLES
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL,
  user2_id UUID,
  streak_current INTEGER DEFAULT 0,
  streak_best INTEGER DEFAULT 0,
  streak_last_completed_date DATE,
  total_exercises_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role DEFAULT 'user',
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  notification_time TIME DEFAULT '19:00:00',
  notification_enabled BOOLEAN DEFAULT true,
  push_subscription JSONB,
  onboarding_completed BOOLEAN DEFAULT false,
  timezone TEXT DEFAULT 'Europe/Stockholm',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign keys to couples after users exists
ALTER TABLE couples ADD CONSTRAINT fk_couples_user1 FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE couples ADD CONSTRAINT fk_couples_user2 FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category exercise_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 3,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  day_number INTEGER,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE daily_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL,
  user1_completed BOOLEAN DEFAULT false,
  user2_completed BOOLEAN DEFAULT false,
  user1_completed_at TIMESTAMPTZ,
  user2_completed_at TIMESTAMPTZ,
  both_completed BOOLEAN GENERATED ALWAYS AS (user1_completed AND user2_completed) STORED,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(couple_id, assigned_date)
);

CREATE TABLE pulse_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  connection INTEGER NOT NULL CHECK (connection BETWEEN 1 AND 5),
  communication INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 5),
  appreciation INTEGER NOT NULL CHECK (appreciation BETWEEN 1 AND 5),
  fun INTEGER NOT NULL CHECK (fun BETWEEN 1 AND 5),
  trust INTEGER NOT NULL CHECK (trust BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE TABLE pulse_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  avg_connection NUMERIC(3,1),
  avg_communication NUMERIC(3,1),
  avg_appreciation NUMERIC(3,1),
  avg_fun NUMERIC(3,1),
  avg_trust NUMERIC(3,1),
  avg_total NUMERIC(3,1),
  responses_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(couple_id, week_start)
);

CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT now(),
  shared BOOLEAN DEFAULT false,
  shared_at TIMESTAMPTZ,
  UNIQUE(couple_id, type)
);

CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  type invite_type NOT NULL,
  status invite_status DEFAULT 'pending',
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE genesis_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source TEXT,
  invite_token TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  landing_page TEXT,
  signed_up_at TIMESTAMPTZ DEFAULT now(),
  invited_partner BOOLEAN DEFAULT false,
  invited_partner_at TIMESTAMPTZ,
  first_exercise_at TIMESTAMPTZ,
  invited_friends_count INTEGER DEFAULT 0,
  cross_sell_clicked TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- INDEXES
CREATE INDEX idx_users_couple ON users(couple_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_daily_assignments_couple_date ON daily_assignments(couple_id, assigned_date);
CREATE INDEX idx_daily_assignments_date ON daily_assignments(assigned_date);
CREATE INDEX idx_pulse_responses_couple_week ON pulse_responses(couple_id, week_start);
CREATE INDEX idx_invites_token ON invites(token);
CREATE INDEX idx_invites_inviter ON invites(inviter_id);
CREATE INDEX idx_genesis_tracking_user ON genesis_tracking(user_id);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_active ON exercises(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_weekly ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE genesis_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_log ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_select_partner" ON users FOR SELECT USING (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "admin_all_users" ON users FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_all_couples" ON couples FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_all_exercises" ON exercises FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_all_daily" ON daily_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "admin_all_log" ON admin_log FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "exercises_select" ON exercises FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "daily_select_own" ON daily_assignments FOR SELECT USING (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "daily_update_own" ON daily_assignments FOR UPDATE USING (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "daily_insert_own" ON daily_assignments FOR INSERT WITH CHECK (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "pulse_insert_own" ON pulse_responses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pulse_select_own" ON pulse_responses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pulse_weekly_select" ON pulse_weekly FOR SELECT USING (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "pulse_weekly_insert" ON pulse_weekly FOR INSERT WITH CHECK (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "pulse_weekly_update" ON pulse_weekly FOR UPDATE USING (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "milestones_select" ON milestones FOR SELECT USING (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "milestones_update" ON milestones FOR UPDATE USING (
  couple_id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "invites_select_own" ON invites FOR SELECT USING (auth.uid() = inviter_id);
CREATE POLICY "invites_insert_own" ON invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "invites_select_by_token" ON invites FOR SELECT USING (true);
CREATE POLICY "invites_update_accept" ON invites FOR UPDATE USING (true);
CREATE POLICY "genesis_select_own" ON genesis_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "genesis_insert_own" ON genesis_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "couples_select_own" ON couples FOR SELECT USING (
  id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "couples_update_own" ON couples FOR UPDATE USING (
  id IN (SELECT couple_id FROM users WHERE id = auth.uid())
);
CREATE POLICY "couples_insert_own" ON couples FOR INSERT WITH CHECK (
  user1_id = auth.uid()
);

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER couples_updated_at BEFORE UPDATE ON couples FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION calculate_pulse_weekly()
RETURNS TRIGGER AS $$
DECLARE
  v_couple_id UUID;
  v_week DATE;
BEGIN
  v_couple_id := NEW.couple_id;
  v_week := NEW.week_start;
  INSERT INTO pulse_weekly (couple_id, week_start, avg_connection, avg_communication, avg_appreciation, avg_fun, avg_trust, avg_total, responses_count)
  SELECT v_couple_id, v_week,
    ROUND(AVG(connection)::numeric, 1),
    ROUND(AVG(communication)::numeric, 1),
    ROUND(AVG(appreciation)::numeric, 1),
    ROUND(AVG(fun)::numeric, 1),
    ROUND(AVG(trust)::numeric, 1),
    ROUND(AVG((connection + communication + appreciation + fun + trust)::numeric / 5), 1),
    COUNT(*)::integer
  FROM pulse_responses WHERE couple_id = v_couple_id AND week_start = v_week
  ON CONFLICT (couple_id, week_start) DO UPDATE SET
    avg_connection = EXCLUDED.avg_connection,
    avg_communication = EXCLUDED.avg_communication,
    avg_appreciation = EXCLUDED.avg_appreciation,
    avg_fun = EXCLUDED.avg_fun,
    avg_trust = EXCLUDED.avg_trust,
    avg_total = EXCLUDED.avg_total,
    responses_count = EXCLUDED.responses_count;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pulse_calculate_weekly AFTER INSERT ON pulse_responses FOR EACH ROW EXECUTE FUNCTION calculate_pulse_weekly();

CREATE OR REPLACE FUNCTION check_milestones(p_couple_id UUID)
RETURNS VOID AS $$
DECLARE
  v_couple RECORD;
BEGIN
  SELECT * INTO v_couple FROM couples WHERE id = p_couple_id;
  IF v_couple.streak_current >= 7 THEN INSERT INTO milestones (couple_id, type) VALUES (p_couple_id, 'streak_7') ON CONFLICT DO NOTHING; END IF;
  IF v_couple.streak_current >= 30 THEN INSERT INTO milestones (couple_id, type) VALUES (p_couple_id, 'streak_30') ON CONFLICT DO NOTHING; END IF;
  IF v_couple.streak_current >= 100 THEN INSERT INTO milestones (couple_id, type) VALUES (p_couple_id, 'streak_100') ON CONFLICT DO NOTHING; END IF;
  IF v_couple.streak_current >= 365 THEN INSERT INTO milestones (couple_id, type) VALUES (p_couple_id, 'streak_365') ON CONFLICT DO NOTHING; END IF;
  IF v_couple.total_exercises_completed >= 10 THEN INSERT INTO milestones (couple_id, type) VALUES (p_couple_id, 'exercises_10') ON CONFLICT DO NOTHING; END IF;
  IF v_couple.total_exercises_completed >= 50 THEN INSERT INTO milestones (couple_id, type) VALUES (p_couple_id, 'exercises_50') ON CONFLICT DO NOTHING; END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_streak()
RETURNS TRIGGER AS $$
DECLARE
  v_couple RECORD;
  v_yesterday DATE;
BEGIN
  IF NEW.user1_completed AND NEW.user2_completed THEN
    SELECT * INTO v_couple FROM couples WHERE id = NEW.couple_id;
    v_yesterday := NEW.assigned_date - INTERVAL '1 day';
    IF v_couple.streak_last_completed_date = v_yesterday OR v_couple.streak_current = 0 THEN
      UPDATE couples SET
        streak_current = streak_current + 1,
        streak_best = GREATEST(streak_best, streak_current + 1),
        streak_last_completed_date = NEW.assigned_date,
        total_exercises_completed = total_exercises_completed + 1
      WHERE id = NEW.couple_id;
    ELSIF v_couple.streak_last_completed_date < v_yesterday THEN
      UPDATE couples SET
        streak_current = 1,
        streak_last_completed_date = NEW.assigned_date,
        total_exercises_completed = total_exercises_completed + 1
      WHERE id = NEW.couple_id;
    END IF;
    PERFORM check_milestones(NEW.couple_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER daily_assignment_streak AFTER UPDATE ON daily_assignments
  FOR EACH ROW
  WHEN (NEW.user1_completed IS DISTINCT FROM OLD.user1_completed OR NEW.user2_completed IS DISTINCT FROM OLD.user2_completed)
  EXECUTE FUNCTION update_streak();

-- Cron functions (to be scheduled via pg_cron in Supabase)
CREATE OR REPLACE FUNCTION assign_daily_exercises()
RETURNS VOID AS $$
DECLARE
  v_couple RECORD;
  v_exercise_id UUID;
BEGIN
  FOR v_couple IN SELECT c.* FROM couples c WHERE c.user2_id IS NOT NULL LOOP
    IF NOT EXISTS (SELECT 1 FROM daily_assignments WHERE couple_id = v_couple.id AND assigned_date = CURRENT_DATE) THEN
      SELECT e.id INTO v_exercise_id FROM exercises e
        WHERE e.is_active = true
        AND e.id NOT IN (SELECT da.exercise_id FROM daily_assignments da WHERE da.couple_id = v_couple.id AND da.assigned_date > CURRENT_DATE - INTERVAL '30 days')
        ORDER BY random() LIMIT 1;
      IF v_exercise_id IS NULL THEN
        SELECT id INTO v_exercise_id FROM exercises WHERE is_active = true ORDER BY random() LIMIT 1;
      END IF;
      IF v_exercise_id IS NOT NULL THEN
        INSERT INTO daily_assignments (couple_id, exercise_id, assigned_date) VALUES (v_couple.id, v_exercise_id, CURRENT_DATE);
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION send_pulse_reminders()
RETURNS VOID AS $$
BEGIN
  -- This is a placeholder. Actual implementation would use edge functions or external service.
  -- Log that reminders should be sent
  RAISE NOTICE 'Pulse reminders should be sent';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
