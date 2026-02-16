#!/usr/bin/env node

/**
 * buffer-cli
 * 
 * A powerful CLI for scheduling social media posts through Buffer
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { authCommand, authStatusCommand, authLogoutCommand } from './commands/auth.js';
import { profilesCommand, profilesSyncCommand } from './commands/profiles.js';
import { postCommand } from './commands/post.js';
import { ensureConfigDir, loadConfig, saveConfig, updateConfig, paths } from './lib/config.js';
import { getAvailableTags } from './lib/templates.js';

// =============================================================================
// BANNER
// =============================================================================

const BANNER = `
${chalk.cyan('╔══════════════════════════════════════╗')}
${chalk.cyan('║')}  ${chalk.bold('buffer-cli')} ${chalk.dim('v0.1.0')}                   ${chalk.cyan('║')}
${chalk.cyan('║')}  ${chalk.dim('Schedule posts through Buffer')}        ${chalk.cyan('║')}
${chalk.cyan('╚══════════════════════════════════════╝')}
`;

// =============================================================================
// PROGRAM
// =============================================================================

const program = new Command();

program
  .name('buffer-cli')
  .description('A powerful CLI for scheduling social media posts through Buffer')
  .version('0.1.0')
  .hook('preAction', () => {
    // Ensure config directory exists before any command
    ensureConfigDir();
  });

// =============================================================================
// AUTH COMMANDS
// =============================================================================

const auth = program
  .command('auth')
  .description('Authenticate with Buffer');

auth
  .command('login', { isDefault: true })
  .description('Start OAuth authentication flow')
  .action(authCommand);

auth
  .command('status')
  .description('Check authentication status')
  .action(authStatusCommand);

auth
  .command('logout')
  .description('Remove stored credentials')
  .action(authLogoutCommand);

// =============================================================================
// PROFILES COMMANDS
// =============================================================================

const profiles = program
  .command('profiles')
  .description('Manage connected profiles');

profiles
  .command('list', { isDefault: true })
  .description('List connected profiles')
  .action(profilesCommand);

profiles
  .command('sync')
  .description('Refresh profiles from Buffer')
  .action(profilesSyncCommand);

// =============================================================================
// POST COMMAND
// =============================================================================

program
  .command('post <message>')
  .description('Create a new post')
  .option('-p, --profile <name>', 'Post to specific profile (by service name or ID)')
  .option('--profiles <names...>', 'Post to multiple profiles')
  .option('-s, --schedule <time>', 'Schedule for specific time (ISO format)')
  .option('-q, --queue', 'Add to queue (default)')
  .option('-n, --now', 'Post immediately')
  .option('-i, --image <url>', 'Attach image URL')
  .option('-u, --url <url>', 'Attach link URL')
  .option('-t, --title <title>', 'Title for template tags')
  .option('-b, --board <name>', 'Pinterest board name')
  .option('-d, --draft', 'Save as draft')
  .action(postCommand);

// =============================================================================
// CONFIG COMMANDS
// =============================================================================

const config = program
  .command('config')
  .description('Manage configuration');

config
  .command('show', { isDefault: true })
  .description('Show current configuration')
  .action(() => {
    const cfg = loadConfig();
    console.log(chalk.bold('\n⚙️  Configuration\n'));
    console.log(chalk.dim(`Location: ${paths.CONFIG_FILE}\n`));
    console.log(JSON.stringify(cfg, null, 2));
    console.log('');
  });

config
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action((key: string, value: string) => {
    // Parse value
    let parsedValue: unknown = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(Number(value))) parsedValue = Number(value);
    
    updateConfig(key, parsedValue);
    console.log(chalk.green(`\n✅ Set ${key} = ${JSON.stringify(parsedValue)}\n`));
  });

config
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    const inquirer = (await import('inquirer')).default;
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Reset all configuration to defaults?',
      default: false
    }]);
    
    if (confirm) {
      const { getDefaultConfig } = await import('./lib/config.js');
      saveConfig(getDefaultConfig());
      console.log(chalk.green('\n✅ Configuration reset to defaults.\n'));
    }
  });

// =============================================================================
// TAGS COMMAND
// =============================================================================

program
  .command('tags')
  .description('List available template tags')
  .action(() => {
    const tags = getAvailableTags();
    console.log(chalk.bold('\n📝 Available Template Tags\n'));
    
    for (const [tag, description] of Object.entries(tags)) {
      console.log(`  ${chalk.cyan(tag.padEnd(20))} ${description}`);
    }
    
    console.log('\n' + chalk.dim('Example: buffer-cli post "{title} - Check it out! {url}" --title "My Post" --url "https://..."') + '\n');
  });

// =============================================================================
// INFO COMMAND
// =============================================================================

program
  .command('info')
  .description('Show version and configuration info')
  .action(() => {
    console.log(BANNER);
    console.log('  Config directory: ' + chalk.dim(paths.CONFIG_DIR));
    console.log('  Auth file:        ' + chalk.dim(paths.AUTH_FILE));
    console.log('  Config file:      ' + chalk.dim(paths.CONFIG_FILE));
    console.log('');
    console.log('  Documentation:    ' + chalk.cyan('https://github.com/michaelmonetized/buffer-cli'));
    console.log('  Report issues:    ' + chalk.cyan('https://github.com/michaelmonetized/buffer-cli/issues'));
    console.log('');
  });

// =============================================================================
// PARSE
// =============================================================================

// Show banner for help
if (process.argv.length === 2 || process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(BANNER);
}

program.parse();
