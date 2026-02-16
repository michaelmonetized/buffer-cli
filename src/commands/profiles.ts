/**
 * Profiles Commands
 * 
 * buffer-cli profiles       - List connected profiles
 * buffer-cli profiles sync  - Refresh profiles from Buffer
 */

import chalk from 'chalk';
import ora from 'ora';
import { BufferApi } from '../lib/api.js';
import { 
  loadProfilesCache, 
  saveProfilesCache, 
  isProfilesCacheStale,
  loadConfig,
  saveConfig
} from '../lib/config.js';
import type { Profile, ProfilesCache, Config } from '../lib/types.js';

// =============================================================================
// SERVICE ICONS
// =============================================================================

const SERVICE_ICONS: Record<string, string> = {
  twitter: '𝕏',
  facebook: '📘',
  linkedin: '💼',
  instagram: '📷',
  pinterest: '📌',
  googlebusiness: '🏢',
  tiktok: '🎵',
  mastodon: '🐘',
  threads: '🧵',
  default: '📱'
};

function getServiceIcon(service: string): string {
  return SERVICE_ICONS[service] || SERVICE_ICONS.default;
}

// =============================================================================
// COMMANDS
// =============================================================================

/**
 * List connected profiles
 */
export async function profilesCommand(): Promise<void> {
  const api = BufferApi.fromAuth();
  if (!api) {
    console.log(chalk.red('\n❌ Not authenticated. Run: buffer-cli auth\n'));
    process.exit(1);
  }

  let profiles: Record<string, Profile>;

  // Check cache
  if (isProfilesCacheStale()) {
    const spinner = ora('Fetching profiles...').start();
    try {
      const profilesList = await api.getProfiles();
      profiles = Object.fromEntries(profilesList.map(p => [p.id, p]));
      
      // Update cache
      const cache: ProfilesCache = {
        updated_at: new Date().toISOString(),
        profiles
      };
      saveProfilesCache(cache);
      
      spinner.succeed('Profiles synced');
    } catch (error) {
      spinner.fail('Failed to fetch profiles');
      console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
      process.exit(1);
    }
  } else {
    const cache = loadProfilesCache();
    profiles = cache?.profiles || {};
  }

  // Load config to check enabled status
  const config = loadConfig();

  console.log(chalk.bold('\n📱 Connected Profiles\n'));

  const profileList = Object.values(profiles);
  
  if (profileList.length === 0) {
    console.log(chalk.yellow('No profiles connected.'));
    console.log('\nConnect profiles at: ' + chalk.cyan(BufferApi.getConnectProfilesUrl()) + '\n');
    return;
  }

  // Group by service
  const byService: Record<string, Profile[]> = {};
  for (const profile of profileList) {
    const service = profile.service;
    if (!byService[service]) {
      byService[service] = [];
    }
    byService[service].push(profile);
  }

  // Display grouped profiles
  for (const [service, serviceProfiles] of Object.entries(byService)) {
    console.log(chalk.bold(`${getServiceIcon(service)} ${serviceProfiles[0].formatted_service}`));
    
    for (const profile of serviceProfiles) {
      const configProfile = config.profiles[profile.id];
      const enabled = configProfile?.enabled ?? true;
      const status = enabled ? chalk.green('✓') : chalk.gray('○');
      
      console.log(`  ${status} ${profile.formatted_username || profile.id}`);
      console.log(chalk.dim(`    ID: ${profile.id} | TZ: ${profile.timezone}`));
      
      // Show subprofiles (Pinterest boards)
      if (profile.subprofiles) {
        for (const sub of Object.values(profile.subprofiles)) {
          console.log(chalk.dim(`    └─ ${sub.name}`));
        }
      }
    }
    console.log('');
  }

  console.log(chalk.dim(`Last synced: ${loadProfilesCache()?.updated_at || 'never'}`));
  console.log(chalk.dim('Run ' + chalk.cyan('buffer-cli profiles sync') + ' to refresh.\n'));
}

/**
 * Sync profiles from Buffer
 */
export async function profilesSyncCommand(): Promise<void> {
  const api = BufferApi.fromAuth();
  if (!api) {
    console.log(chalk.red('\n❌ Not authenticated. Run: buffer-cli auth\n'));
    process.exit(1);
  }

  const spinner = ora('Syncing profiles from Buffer...').start();

  try {
    const profilesList = await api.getProfiles();
    const profiles = Object.fromEntries(profilesList.map(p => [p.id, p]));
    
    // Update cache
    const cache: ProfilesCache = {
      updated_at: new Date().toISOString(),
      profiles
    };
    saveProfilesCache(cache);

    // Update config with new profiles
    const config = loadConfig();
    
    for (const profile of profilesList) {
      if (!config.profiles[profile.id]) {
        config.profiles[profile.id] = {
          enabled: true,
          override: false,
          id: profile.id,
          service: profile.service as any,
          formatted_service: profile.formatted_service,
          formatted_username: profile.formatted_username,
          timezone: profile.timezone,
          subprofiles: profile.subprofiles
        };
      }
    }
    
    saveConfig(config);
    
    spinner.succeed(`Synced ${profilesList.length} profiles`);
    console.log('');
  } catch (error) {
    spinner.fail('Failed to sync profiles');
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  }
}
