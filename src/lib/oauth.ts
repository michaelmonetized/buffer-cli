/**
 * OAuth Flow Handler
 * 
 * Handles browser-based OAuth authentication with Buffer
 */

import { createServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';
import open from 'open';
import { BufferApi } from './api.js';
import { saveAuth, loadAuth, saveProfilesCache } from './config.js';
import type { AuthConfig, ProfilesCache } from './types.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const CALLBACK_PORT = 9876;
const CALLBACK_PATH = '/callback';

// =============================================================================
// OAUTH HANDLER
// =============================================================================

/**
 * Start OAuth flow
 * 
 * 1. Starts local HTTP server for callback
 * 2. Opens browser to Buffer auth URL
 * 3. Waits for callback with tokens
 * 4. Stores tokens and fetches profiles
 */
export async function startOAuthFlow(): Promise<AuthConfig> {
  return new Promise((resolve, reject) => {
    let server: Server;

    const handleCallback = async (req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url || '', `http://localhost:${CALLBACK_PORT}`);
      
      if (url.pathname !== CALLBACK_PATH) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      // Extract tokens from query params
      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');
      const expiresIn = url.searchParams.get('expires_in');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400);
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>Authentication Failed</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1>❌ Authentication Failed</h1>
            <p>Error: ${error}</p>
            <p>Please try again.</p>
          </body>
          </html>
        `);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!accessToken) {
        res.writeHead(400);
        res.end(`
          <!DOCTYPE html>
          <html>
          <head><title>Authentication Failed</title></head>
          <body style="font-family: system-ui; text-align: center; padding: 50px;">
            <h1>❌ Authentication Failed</h1>
            <p>No access token received.</p>
            <p>Please try again.</p>
          </body>
          </html>
        `);
        server.close();
        reject(new Error('No access token received'));
        return;
      }

      // Build auth config
      const auth: AuthConfig = {
        access_token: accessToken,
        refresh_token: refreshToken || '',
        token_expires: expiresIn ? Date.now() / 1000 + parseInt(expiresIn) : false
      };

      // Save auth
      saveAuth(auth);

      // Fetch and cache profiles
      try {
        const api = new BufferApi(auth);
        const profiles = await api.getProfiles();
        
        const cache: ProfilesCache = {
          updated_at: new Date().toISOString(),
          profiles: Object.fromEntries(profiles.map(p => [p.id, p]))
        };
        saveProfilesCache(cache);
      } catch (e) {
        // Non-fatal - profiles can be synced later
        console.warn('Warning: Could not fetch profiles:', e);
      }

      // Send success response
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: system-ui; text-align: center; padding: 50px;">
          <h1>✅ Authentication Successful!</h1>
          <p>You can close this window and return to your terminal.</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
        </html>
      `);

      // Close server and resolve
      server.close();
      resolve(auth);
    };

    // Create server
    server = createServer(handleCallback);

    server.on('error', (err) => {
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });

    server.listen(CALLBACK_PORT, async () => {
      const callbackUrl = `http://localhost:${CALLBACK_PORT}${CALLBACK_PATH}`;
      const authUrl = BufferApi.getOAuthUrl(callbackUrl);

      console.log('\n🔐 Opening browser for Buffer authentication...\n');
      console.log(`If browser doesn't open, visit:\n${authUrl}\n`);

      // Open browser
      try {
        await open(authUrl);
      } catch {
        // Browser open failed - user will need to copy URL
      }
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('Authentication timed out. Please try again.'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Check if token needs refresh and refresh if needed
 */
export async function refreshTokenIfNeeded(): Promise<boolean> {
  const auth = loadAuth();
  if (!auth) {
    return false;
  }

  // Check if token is expired or will expire soon (within 1 hour)
  if (auth.token_expires && auth.token_expires < Date.now() / 1000 + 3600) {
    // TODO: Implement token refresh via WPZinc gateway
    // For now, just return false to trigger re-auth
    return false;
  }

  return true;
}
