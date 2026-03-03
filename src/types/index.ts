export type ExerciseCategory = 'appreciation' | 'curiosity' | 'memories' | 'reciprocity' | 'play';
export type InviteType = 'partner' | 'couple_friend' | 'friend';
export type InviteStatus = 'pending' | 'accepted' | 'expired';
export type UserRole = 'user' | 'admin';
export type PulseQuestionKey = 'connection' | 'communication' | 'appreciation' | 'fun' | 'trust';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  couple_id: string | null;
  notification_time: string;
  notification_enabled: boolean;
  push_subscription: any;
  onboarding_completed: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  user1_id: string;
  user2_id: string | null;
  streak_current: number;
  streak_best: number;
  streak_last_completed_date: string | null;
  total_exercises_completed: number;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  category: ExerciseCategory;
  title: string;
  description: string;
  instructions: string;
  duration_minutes: number;
  difficulty: number;
  day_number: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DailyAssignment {
  id: string;
  couple_id: string;
  exercise_id: string;
  assigned_date: string;
  user1_completed: boolean;
  user2_completed: boolean;
  user1_completed_at: string | null;
  user2_completed_at: string | null;
  both_completed: boolean;
  created_at: string;
  exercise?: Exercise;
}

export interface PulseResponse {
  id: string;
  user_id: string;
  couple_id: string;
  week_start: string;
  connection: number;
  communication: number;
  appreciation: number;
  fun: number;
  trust: number;
  created_at: string;
}

export interface PulseWeekly {
  id: string;
  couple_id: string;
  week_start: string;
  avg_connection: number;
  avg_communication: number;
  avg_appreciation: number;
  avg_fun: number;
  avg_trust: number;
  avg_total: number;
  responses_count: number;
  created_at: string;
}

export interface Milestone {
  id: string;
  couple_id: string;
  type: string;
  achieved_at: string;
  shared: boolean;
  shared_at: string | null;
}

export interface Invite {
  id: string;
  inviter_id: string;
  couple_id: string | null;
  token: string;
  type: InviteType;
  status: InviteStatus;
  accepted_by: string | null;
  accepted_at: string | null;
  expires_at: string;
  metadata: any;
  created_at: string;
}

export interface GenesisTracking {
  id: string;
  user_id: string;
  source: string | null;
  invite_token: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  signed_up_at: string;
  invited_partner: boolean;
  invited_partner_at: string | null;
  first_exercise_at: string | null;
  invited_friends_count: number;
  cross_sell_clicked: string[];
  created_at: string;
}

// Category display helpers
export const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
  appreciation: '#E8B931',
  curiosity: '#4A90D9',
  memories: '#9B59B6',
  reciprocity: '#2ECC71',
  play: '#E74C3C',
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  appreciation: 'Uppskattning',
  curiosity: 'Nyfikenhet',
  memories: 'Minnen',
  reciprocity: 'Ömsesidighet',
  play: 'Lek',
};

export const MILESTONE_INFO: Record<string, { label: string; description: string; emoji: string }> = {
  streak_7: { label: 'Första veckan!', description: 'Bonus: Date Night-kategori', emoji: '🏆' },
  streak_30: { label: 'En månad av kärlek', description: 'Bonus: Dripline Insights 7 dagar', emoji: '💝' },
  streak_100: { label: '100 dagar!', description: 'Bonus: Premium-övningar', emoji: '🌟' },
  streak_365: { label: 'Ett helt år!', description: 'Bonus: Lifetime badge', emoji: '👑' },
  exercises_10: { label: 'Tio steg närmare', description: '10 övningar genomförda', emoji: '🎯' },
  exercises_50: { label: 'Femtio steg!', description: '50 övningar genomförda', emoji: '🚀' },
  first_pulse: { label: 'Första pulsen', description: 'Första relationstemperaturen', emoji: '💓' },
};
