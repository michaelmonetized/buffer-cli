/**
 * Auth Commands
 * 
 * buffer-cli auth         - Start OAuth flow
 * buffer-cli auth status  - Check auth status
 * buffer-cli auth logout  - Remove credentials
 */

import chalk from 'chalk';
import ora from 'ora';
import { startOAuthFlow } from '../lib/oauth.js';
import { loadAuth, deleteAuth, isAuthenticated, paths } from '../lib/config.js';
import { BufferApi } from '../lib/api.js';

/**
 * Start OAuth authentication flow
 */
export async function authCommand(): Promise<void> {
  // Check if already authenticated
  if (isAuthenticated()) {
    console.log(chalk.yellow('\n⚠️  You are already authenticated.'));
    console.log('Run ' + chalk.cyan('buffer-cli auth logout') + ' first to re-authenticate.\n');
    return;
  }

  const spinner = ora('Starting authentication...').start();

  try {
    spinner.stop();
    const auth = await startOAuthFlow();
    
    console.log(chalk.green('\n✅ Authentication successful!\n'));
    console.log('Your credentials are stored in:');
    console.log(chalk.dim(paths.AUTH_FILE));
    console.log('\nNext steps:');
    console.log('  ' + chalk.cyan('buffer-cli profiles') + '    - View your connected profiles');
    console.log('  ' + chalk.cyan('buffer-cli post "..."') + ' - Create your first post\n');
  } catch (error) {
    spinner.fail('Authentication failed');
    console.error(chalk.red(`\nError: ${(error as Error).message}\n`));
    process.exit(1);
  }
}

/**
 * Show authentication status
 */
export async function authStatusCommand(): Promise<void> {
  const auth = loadAuth();

  if (!auth) {
    console.log(chalk.red('\n❌ Not authenticated\n'));
    console.log('Run ' + chalk.cyan('buffer-cli auth') + ' to authenticate.\n');
    return;
  }

  console.log(chalk.green('\n✅ Authenticated\n'));

  // Check token expiry
  if (auth.token_expires) {
    const expiresDate = new Date(auth.token_expires * 1000);
    const now = new Date();
    
    if (expiresDate < now) {
      console.log(chalk.yellow('⚠️  Token expired: ' + expiresDate.toLocaleString()));
      console.log('Run ' + chalk.cyan('buffer-cli auth') + ' to re-authenticate.\n');
      return;
    }
    
    console.log('Token expires: ' + chalk.dim(expiresDate.toLocaleString()));
  } else {
    console.log('Token: ' + chalk.dim('No expiry'));
  }

  // Try to get user info
  const spinner = ora('Fetching user info...').start();
  
  try {
    const api = BufferApi.fromAuth();
    if (!api) {
      spinner.fail('Could not load credentials');
      return;
    }

    const user = await api.getUser();
    spinner.stop();

    console.log('\n' + chalk.bold('User: ') + user.name);
    console.log(chalk.bold('Email: ') + user.email);
    console.log(chalk.bold('Plan: ') + user.plan);
    console.log(chalk.bold('Timezone: ') + user.timezone);
    console.log('');
  } catch (error) {
    spinner.fail('Could not fetch user info');
    console.log(chalk.dim(`(${(error as Error).message})\n`));
  }
}

/**
 * Remove stored credentials
 */
export async function authLogoutCommand(): Promise<void> {
  const auth = loadAuth();

  if (!auth) {
    console.log(chalk.yellow('\n⚠️  Not currently authenticated.\n'));
    return;
  }

  deleteAuth();
  console.log(chalk.green('\n✅ Logged out successfully.\n'));
  console.log('Run ' + chalk.cyan('buffer-cli auth') + ' to authenticate again.\n');
}
