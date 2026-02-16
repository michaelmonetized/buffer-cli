/**
 * buffer-cli Type Definitions
 * 
 * 1:1 parity with wp-to-buffer-pro settings schema
 */

// =============================================================================
// AUTH
// =============================================================================

export interface AuthConfig {
  access_token: string;
  refresh_token: string;
  token_expires: number | false;
}

// =============================================================================
// PROFILES
// =============================================================================

export interface Profile {
  id: string;
  social_network_id: string;
  formatted_service: string;
  formatted_username: string;
  service: ProfileService;
  timezone: string;
  can_be_subprofile: boolean;
  subprofiles?: Record<string, SubProfile>;
}

export interface SubProfile {
  id: string;
  name: string;
  service: string;
}

export type ProfileService = 
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'instagram'
  | 'pinterest'
  | 'googlebusiness'
  | 'tiktok'
  | 'mastodon'
  | 'threads';

// =============================================================================
// STATUS / POST CONFIGURATION
// =============================================================================

export interface StatusConfig {
  /** Image handling: 0=none, 1=open_graph, 2=featured/attached */
  image: 0 | 1 | 2;
  
  /** Message template with tags like {title}, {url}, {excerpt} */
  message: string;
  
  /** Scheduling method */
  schedule: ScheduleType;
  
  /** Days to delay (for 'custom' schedule) */
  days: number;
  
  /** Hours to delay (for 'custom' schedule) */
  hours: number;
  
  /** Minutes to delay (for 'custom' schedule) */
  minutes: number;
  
  /** Day of week for relative scheduling */
  schedule_relative_day?: string;
  
  /** Time for relative scheduling (HH:MM:SS) */
  schedule_relative_time?: string;
  
  /** Custom field name for schedule */
  schedule_custom_field_name?: string;
  
  /** Custom field relation (before/after) */
  schedule_custom_field_relation?: 'before' | 'after';
  
  /** Specific date/time (ISO string) */
  schedule_specific?: string;
  
  /** Pinterest board ID */
  sub_profile?: string;
  
  /** Instagram update type */
  update_type?: string;
  
  /** Google Business Profile settings */
  googlebusiness?: GoogleBusinessConfig;
  
  /** Text to image template */
  text_to_image?: string;
}

export type ScheduleType = 
  | 'now'
  | 'queue_bottom'
  | 'queue_top'
  | 'custom'
  | 'custom_relative'
  | 'custom_field'
  | 'specific';

export interface GoogleBusinessConfig {
  post_type: 'whats_new' | 'offer' | 'event';
  cta?: 'book' | 'order' | 'shop' | 'learn_more' | 'signup';
  title?: string;
  start_date_option?: string;
  start_date?: string;
  end_date_option?: string;
  end_date?: string;
  code?: string;
  terms?: string;
}

// =============================================================================
// ACTION CONFIG (publish/update)
// =============================================================================

export interface ActionConfig {
  enabled: boolean;
  status: StatusConfig[];
}

// =============================================================================
// PROFILE CONFIG (per-profile settings)
// =============================================================================

export interface ProfileConfig {
  enabled: boolean;
  override: boolean;
  
  // Profile info (from API)
  id: string;
  service: ProfileService;
  formatted_service: string;
  formatted_username: string;
  timezone: string;
  subprofiles?: Record<string, SubProfile>;
  
  // Profile-specific settings (when override=true)
  publish?: ActionConfig;
  update?: ActionConfig;
}

// =============================================================================
// MAIN CONFIG
// =============================================================================

export interface Config {
  /** Use WPZinc proxy for requests */
  proxy?: boolean;
  
  /** Enable logging */
  log?: boolean;
  
  /** Test mode (don't actually post) */
  test_mode?: boolean;
  
  /** Default posting settings */
  defaults: {
    publish: ActionConfig;
    update?: ActionConfig;
  };
  
  /** Per-profile settings */
  profiles: Record<string, ProfileConfig>;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface BufferUser {
  id: string;
  name: string;
  email: string;
  timezone: string;
  plan: string;
}

export interface BufferUpdate {
  id: string;
  profile_id: string;
  text: string;
  created_at: number;
  due_at: number;
  status: 'pending' | 'sent' | 'error';
  media?: {
    picture?: string;
    thumbnail?: string;
    link?: string;
  };
}

export interface CreateUpdateParams {
  profile_ids: string[];
  text: string;
  media?: {
    link?: string;
    description?: string;
    title?: string;
    picture?: string;
    photo?: string;
    thumbnail?: string;
  };
  shorten?: boolean;
  now?: boolean;
  top?: boolean;
  scheduled_at?: number;
  is_draft?: boolean;
  attachment?: boolean;
  subprofile_ids?: string[];
  source_url?: string;
}

export interface CreateUpdateResponse {
  success: boolean;
  message: string;
  updates: BufferUpdate[];
}

export interface ApiError {
  code: number;
  error?: string;
  message?: string;
}

// =============================================================================
// CLI TYPES
// =============================================================================

export interface PostOptions {
  profile?: string;
  profiles?: string[];
  schedule?: string;
  queue?: boolean;
  now?: boolean;
  image?: string;
  url?: string;
  title?: string;
  board?: string;
  draft?: boolean;
}

export interface ProfilesCache {
  updated_at: string;
  profiles: Record<string, Profile>;
}
