/**
 * Configuration management for buffer-cli
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Config, AuthConfig, ProfilesCache, StatusConfig } from './types.js';

// =============================================================================
// PATHS
// =============================================================================

const CONFIG_DIR = process.env.BUFFER_CLI_CONFIG || join(homedir(), '.buffer-cli');
const AUTH_FILE = join(CONFIG_DIR, 'auth.json');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');
const CACHE_DIR = join(CONFIG_DIR, 'cache');
const PROFILES_CACHE_FILE = join(CACHE_DIR, 'profiles.json');

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Ensure config directory exists
 */
export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true, mode: 0o700 });
  }
}

// =============================================================================
// AUTH
// =============================================================================

/**
 * Load auth tokens from disk
 */
export function loadAuth(): AuthConfig | null {
  try {
    if (!existsSync(AUTH_FILE)) {
      return null;
    }
    const data = readFileSync(AUTH_FILE, 'utf-8');
    return JSON.parse(data) as AuthConfig;
  } catch {
    return null;
  }
}

/**
 * Save auth tokens to disk
 */
export function saveAuth(auth: AuthConfig): void {
  ensureConfigDir();
  writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2));
  chmodSync(AUTH_FILE, 0o600); // Secure permissions
}

/**
 * Delete auth tokens
 */
export function deleteAuth(): void {
  if (existsSync(AUTH_FILE)) {
    const { unlinkSync } = require('node:fs');
    unlinkSync(AUTH_FILE);
  }
}

/**
 * Check if authenticated
 */
export function isAuthenticated(): boolean {
  const auth = loadAuth();
  if (!auth || !auth.access_token) {
    return false;
  }
  
  // Check if token is expired
  if (auth.token_expires && auth.token_expires < Date.now() / 1000) {
    return false;
  }
  
  return true;
}

// =============================================================================
// CONFIG
// =============================================================================

/**
 * Get default status config (matches wp-to-buffer-pro)
 */
export function getDefaultStatus(): StatusConfig {
  return {
    image: 2,
    message: '{title} {url}',
    schedule: 'queue_bottom',
    days: 0,
    hours: 0,
    minutes: 0,
    schedule_relative_day: '',
    schedule_relative_time: '00:00:00',
    schedule_custom_field_name: '',
    schedule_custom_field_relation: 'after',
    schedule_specific: '',
    sub_profile: '',
    update_type: '',
    text_to_image: ''
  };
}

/**
 * Get default config
 */
export function getDefaultConfig(): Config {
  return {
    proxy: false,
    log: false,
    test_mode: false,
    defaults: {
      publish: {
        enabled: true,
        status: [getDefaultStatus()]
      },
      update: {
        enabled: false,
        status: [getDefaultStatus()]
      }
    },
    profiles: {}
  };
}

/**
 * Load config from disk
 */
export function loadConfig(): Config {
  try {
    if (!existsSync(CONFIG_FILE)) {
      return getDefaultConfig();
    }
    const data = readFileSync(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data) as Config;
    
    // Merge with defaults to ensure all keys exist
    return {
      ...getDefaultConfig(),
      ...config,
      defaults: {
        ...getDefaultConfig().defaults,
        ...config.defaults
      }
    };
  } catch {
    return getDefaultConfig();
  }
}

/**
 * Save config to disk
 */
export function saveConfig(config: Config): void {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

/**
 * Update a specific config value
 */
export function updateConfig(key: string, value: unknown): void {
  const config = loadConfig();
  
  // Handle nested keys like "defaults.publish.enabled"
  const keys = key.split('.');
  let current: Record<string, unknown> = config as Record<string, unknown>;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (typeof current[keys[i]] !== 'object') {
      current[keys[i]] = {};
    }
    current = current[keys[i]] as Record<string, unknown>;
  }
  
  current[keys[keys.length - 1]] = value;
  saveConfig(config);
}

// =============================================================================
// PROFILES CACHE
// =============================================================================

/**
 * Load cached profiles
 */
export function loadProfilesCache(): ProfilesCache | null {
  try {
    if (!existsSync(PROFILES_CACHE_FILE)) {
      return null;
    }
    const data = readFileSync(PROFILES_CACHE_FILE, 'utf-8');
    return JSON.parse(data) as ProfilesCache;
  } catch {
    return null;
  }
}

/**
 * Save profiles cache
 */
export function saveProfilesCache(cache: ProfilesCache): void {
  ensureConfigDir();
  writeFileSync(PROFILES_CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Check if profiles cache is stale (older than 12 hours)
 */
export function isProfilesCacheStale(): boolean {
  const cache = loadProfilesCache();
  if (!cache) {
    return true;
  }
  
  const cacheAge = Date.now() - new Date(cache.updated_at).getTime();
  const twelveHours = 12 * 60 * 60 * 1000;
  
  return cacheAge > twelveHours;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const paths = {
  CONFIG_DIR,
  AUTH_FILE,
  CONFIG_FILE,
  CACHE_DIR,
  PROFILES_CACHE_FILE
};
