export interface User {
  id: string;
  email: string;
  name: string;
  role: 'brand' | 'creator';
  avatar_url?: string;
  company?: string;
  specialization?: string;
}

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  location: string;
  tier: string;
  is_verified: boolean;
  rating?: number;
  rate_per_day: number;
  sla_index: number;
  commissions_count: number;
  on_time_rate: number;
  compatibility_score?: number;
  velocity_days?: string;
  licensing?: string;
  tools_and_pipeline: string[];
  hero_image: string;
  hero_title?: string;
  hero_category?: string;
  bio?: string;
  prompt_architecture?: string;
  featured_works?: Array<{
    title: string;
    image: string;
    aspect?: string;
    tag?: string;
  }>;
}

export interface RecommendedCreator {
  creator: Creator;
  match_score: number;
  recommendation_reason: string;
  match_reasons: string[];
}

export interface Brief {
  id: string;
  title: string;
  prompt?: string;
  objective?: string;
  content_type?: string;
  aesthetic?: string;
  aesthetic_desc?: string;
  style_tags: string[];
  distribution_channels?: string[];
  deliverables?: string[];
  aspect_ratio?: string;
  duration?: string;
  budget_range?: string;
  sla_timeline?: string;
  license_terms?: string;
  escrow_amount?: number;
  status?: string;
  created_at?: string;
}


export interface PostCommentItem {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user_name: string;
  user_role?: string;
  user_avatar?: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_initial?: string;
  author_title: string;
  author_location: string;
  author_badge?: string;
  badge_class?: string;
  time_ago: string;
  title: string;
  body: string;
  post_type: 'Showcase' | 'Looking for creator' | 'Offering service' | 'Collaboration' | 'Open brief';
  pipeline_badges: string[];
  media_url?: string;
  media_caption?: string;
  prompt_notes?: string;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  is_hireable?: boolean;
  creator_id?: string;
  comments?: PostCommentItem[];
}

export interface Milestone {
  id: string;
  step_number: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'pending';
  amount: number;
  payout_percentage: number;
  completion_date?: string;
}

export interface WorkspaceMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  sender_role: 'brand' | 'creator' | 'system';
  content: string;
  created_at: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export interface WorkspaceDeliverable {
  id: string;
  title: string;
  type: string;
  resolution: string;
  file_size: string;
  url: string;
  status: string;
}

export interface Workspace {
  id: string;
  brief_id: string;
  brief_ref: string;
  title: string;
  description: string;
  brand_id: string;
  brand_name: string;
  creator: Creator;
  total_budget: number;
  milestones: Milestone[];
  deliverables: WorkspaceDeliverable[];
  messages: WorkspaceMessage[];
  unread_count: number;
  stage_tag: string;
  category_tag: string;
  created_at: string;
}

export interface LeaderboardStats {
  median_sla: string;
  total_briefs: number;
  escrow_integrity: string;
}

export interface Proposal {
  id: number;
  brand_user_id: number;
  creator_user_id: number;
  workspace_id?: number | null;
  project_title: string;
  project_requirement: string;
  budget_in_rupees: number;
  deadline: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  recruiter_name?: string;
  creator_name?: string;
  creator_avatar?: string;
}

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  link?: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}
