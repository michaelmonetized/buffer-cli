/**
 * Post Command
 * 
 * buffer-cli post <message> [options]
 */

import chalk from 'chalk';
import ora from 'ora';
import { BufferApi } from '../lib/api.js';
import { loadConfig, loadProfilesCache } from '../lib/config.js';
import { processTemplate } from '../lib/templates.js';
import type { PostOptions, CreateUpdateParams, Profile } from '../lib/types.js';

// =============================================================================
// POST COMMAND
// =============================================================================

export async function postCommand(message: string, options: PostOptions): Promise<void> {
  const api = BufferApi.fromAuth();
  if (!api) {
    console.log(chalk.red('\n❌ Not authenticated. Run: buffer-cli auth\n'));
    process.exit(1);
  }

  const config = loadConfig();
  const cache = loadProfilesCache();

  if (!cache || Object.keys(cache.profiles).length === 0) {
    console.log(chalk.red('\n❌ No profiles found. Run: buffer-cli profiles sync\n'));
    process.exit(1);
  }

  // Determine which profiles to post to
  let targetProfiles: Profile[] = [];

  if (options.profile) {
    // Single profile specified by service name or ID
    const profile = findProfile(cache.profiles, options.profile);
    if (!profile) {
      console.log(chalk.red(`\n❌ Profile not found: ${options.profile}\n`));
      console.log('Available profiles:');
      for (const p of Object.values(cache.profiles)) {
        console.log(`  - ${p.service}: ${p.formatted_username || p.id}`);
      }
      console.log('');
      process.exit(1);
    }
    targetProfiles = [profile];
  } else if (options.profiles) {
    // Multiple profiles specified
    for (const name of options.profiles) {
      const profile = findProfile(cache.profiles, name);
      if (profile) {
        targetProfiles.push(profile);
      } else {
        console.log(chalk.yellow(`⚠️  Profile not found: ${name}`));
      }
    }
  } else {
    // Use all enabled profiles from config
    for (const [id, profile] of Object.entries(cache.profiles)) {
      const configProfile = config.profiles[id];
      if (!configProfile || configProfile.enabled) {
        targetProfiles.push(profile);
      }
    }
  }

  if (targetProfiles.length === 0) {
    console.log(chalk.red('\n❌ No profiles to post to.\n'));
    process.exit(1);
  }

  // Process template tags in message
  const processedMessage = processTemplate(message, {
    title: options.title,
    url: options.url
  });

  // Build create params
  const params: CreateUpdateParams = {
    profile_ids: targetProfiles.map(p => p.id),
    text: processedMessage
  };

  // Add media if specified
  if (options.image) {
    params.media = {
      picture: options.image
    };
  }

  if (options.url) {
    params.media = {
      ...params.media,
      link: options.url
    };
  }

  // Scheduling
  if (options.now) {
    params.now = true;
  } else if (options.queue) {
    // Default queue behavior (add to bottom)
  } else if (options.schedule) {
    // Parse schedule time
    const scheduledAt = parseScheduleTime(options.schedule);
    if (!scheduledAt) {
      console.log(chalk.red(`\n❌ Invalid schedule time: ${options.schedule}\n`));
      console.log('Use ISO format: 2024-12-25T09:00:00 or "2024-12-25 09:00"\n');
      process.exit(1);
    }
    params.scheduled_at = Math.floor(scheduledAt.getTime() / 1000);
  }

  // Draft mode
  if (options.draft) {
    params.is_draft = true;
  }

  // Pinterest board
  if (options.board) {
    const pinterestProfile = targetProfiles.find(p => p.service === 'pinterest');
    if (pinterestProfile?.subprofiles) {
      const board = Object.values(pinterestProfile.subprofiles).find(
        b => b.name.toLowerCase() === options.board?.toLowerCase()
      );
      if (board) {
        params.subprofile_ids = [board.id];
      } else {
        console.log(chalk.yellow(`⚠️  Pinterest board not found: ${options.board}`));
      }
    }
  }

  // Test mode check
  if (config.test_mode) {
    console.log(chalk.yellow('\n⚠️  Test mode enabled - not actually posting\n'));
    console.log('Would post to:');
    for (const p of targetProfiles) {
      console.log(`  - ${p.formatted_service}: ${p.formatted_username}`);
    }
    console.log('\nMessage:', processedMessage);
    console.log('\nParams:', JSON.stringify(params, null, 2));
    return;
  }

  // Create the post
  const spinner = ora('Creating post...').start();

  try {
    const response = await api.createUpdate(params);
    
    if (response.success) {
      spinner.succeed('Post created!');
      console.log('');

      for (const update of response.updates) {
        const profile = targetProfiles.find(p => p.id === update.profile_id);
        const status = update.due_at ? 
          `Scheduled for ${new Date(update.due_at * 1000).toLocaleString()}` :
          'Queued';
        
        console.log(`${chalk.green('✓')} ${profile?.formatted_service || 'Unknown'}: ${status}`);
      }

      console.log('');
    } else {
      spinner.fail('Post creation failed');
      console.log(chalk.red(`\nError: ${response.message}\n`));
      process.exit(1);
    }
  } catch (error) {
    spinner.fail('Post creation failed');
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Find a profile by service name, username, or ID
 */
function findProfile(profiles: Record<string, Profile>, query: string): Profile | null {
  const q = query.toLowerCase();
  
  for (const profile of Object.values(profiles)) {
    // Match by ID
    if (profile.id === query) {
      return profile;
    }
    
    // Match by service name
    if (profile.service.toLowerCase() === q) {
      return profile;
    }
    
    // Match by formatted service
    if (profile.formatted_service.toLowerCase() === q) {
      return profile;
    }
    
    // Match by username
    if (profile.formatted_username?.toLowerCase().includes(q)) {
      return profile;
    }
  }
  
  return null;
}

/**
 * Parse a schedule time string
 */
function parseScheduleTime(input: string): Date | null {
  // Try parsing as-is
  let date = new Date(input);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try with T separator
  date = new Date(input.replace(' ', 'T'));
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  return null;
}
