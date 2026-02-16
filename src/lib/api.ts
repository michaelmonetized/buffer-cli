/**
 * Buffer API Client
 * 
 * Interfaces with Buffer API v1 through the WPZinc gateway
 */

import { loadAuth, saveAuth } from './config.js';
import type { 
  AuthConfig,
  Profile, 
  BufferUser, 
  BufferUpdate,
  CreateUpdateParams,
  CreateUpdateResponse,
  ApiError
} from './types.js';

// =============================================================================
// CONSTANTS
// =============================================================================

const API_ENDPOINT = 'https://api.bufferapp.com/1';
const PROXY_ENDPOINT = 'https://proxy.wpzinc.net/';
const OAUTH_GATEWAY = 'https://www.wpzinc.com/?oauth=buffer';
const CLIENT_ID = '592d41d14d97ab7e4e571edb';

// X-Forwarded-Host header for WPZinc gateway
const FORWARDED_HOST = process.env.BUFFER_CLI_HOST || 'www.hustlelaunch.com';

// =============================================================================
// API CLIENT CLASS
// =============================================================================

export class BufferApi {
  private accessToken: string;
  private refreshToken: string;
  private tokenExpires: number | false;
  private useProxy: boolean;

  constructor(auth: AuthConfig, useProxy: boolean = false) {
    this.accessToken = auth.access_token;
    this.refreshToken = auth.refresh_token;
    this.tokenExpires = auth.token_expires;
    this.useProxy = useProxy;
  }

  /**
   * Create API client from stored auth
   */
  static fromAuth(useProxy: boolean = false): BufferApi | null {
    const auth = loadAuth();
    if (!auth) {
      return null;
    }
    return new BufferApi(auth, useProxy);
  }

  /**
   * Get OAuth URL to start authorization
   */
  static getOAuthUrl(callbackUrl: string): string {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: OAUTH_GATEWAY,
      response_type: 'code',
      state: callbackUrl
    });
    return `https://bufferapp.com/oauth2/authorize?${params}`;
  }

  /**
   * Get URL for user to register with Buffer
   */
  static getRegistrationUrl(): string {
    return 'https://login.buffer.com/signup?product=publish&plan=free';
  }

  /**
   * Get URL for user to connect profiles in Buffer
   */
  static getConnectProfilesUrl(): string {
    return 'https://account.buffer.com/channels/connect';
  }

  // ===========================================================================
  // HTTP METHODS
  // ===========================================================================

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    params: Record<string, unknown> = {}
  ): Promise<T> {
    // Check token exists
    if (!this.accessToken) {
      throw new Error('No access token. Please run: buffer-cli auth');
    }

    // Build URL
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_ENDPOINT}${endpoint}${separator}access_token=${this.accessToken}`;

    // Headers
    const headers: Record<string, string> = {
      'User-Agent': 'buffer-cli/1.0.0',
      'X-Forwarded-Host': FORWARDED_HOST
    };

    // Make request
    let response: Response;

    if (this.useProxy) {
      // Route through WPZinc proxy
      const proxyParams = new URLSearchParams({
        url,
        method: method.toLowerCase(),
        params: new URLSearchParams(params as Record<string, string>).toString()
      });
      response = await fetch(`${PROXY_ENDPOINT}?${proxyParams}`, { headers });
    } else {
      // Direct request
      const options: RequestInit = {
        method,
        headers
      };

      if (method === 'POST') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        options.body = new URLSearchParams(params as Record<string, string>).toString();
      }

      response = await fetch(url, options);
    }

    // Parse response
    const data = await response.json();

    // Handle errors
    if (!response.ok || data.error || (data.code && data.code !== 200)) {
      throw this.parseError(data, response.status);
    }

    return data as T;
  }

  private async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, 'GET');
  }

  private async post<T>(endpoint: string, params: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, 'POST', params);
  }

  // ===========================================================================
  // ERROR HANDLING
  // ===========================================================================

  private parseError(data: ApiError, httpCode: number): Error {
    const code = data.code || httpCode;
    let message = data.message || data.error || 'Unknown error';

    // Add helpful context based on error code
    switch (code) {
      case 401:
      case 403:
      case 1001:
        message += '\n→ Run: buffer-cli auth';
        break;
      case 1003:
        message += '\n→ Image URL must be publicly accessible';
        break;
      case 1023:
        message += '\n→ Buffer queue is full. Use --now to post immediately or upgrade your Buffer plan';
        break;
      case 1025:
        message += '\n→ Duplicate post detected. Modify your message';
        break;
      case 1030:
        message += '\n→ Check image URL is valid and accessible';
        break;
      case 1034:
        message += '\n→ Scheduled time is in the past';
        break;
    }

    return new Error(`Buffer API Error #${code}: ${message}`);
  }

  // ===========================================================================
  // API METHODS
  // ===========================================================================

  /**
   * Get authenticated user info
   */
  async getUser(): Promise<BufferUser> {
    return this.get<BufferUser>('/user.json');
  }

  /**
   * Get connected social media profiles
   */
  async getProfiles(): Promise<Profile[]> {
    const response = await this.get<RawProfile[]>('/profiles.json?subprofiles=1');
    
    // Transform response to our Profile type
    return response.map(p => ({
      id: p.id,
      social_network_id: p.service_id,
      formatted_service: p.formatted_service,
      formatted_username: p.formatted_username || '',
      service: p.service,
      timezone: p.timezone,
      can_be_subprofile: false,
      subprofiles: p.subprofiles ? Object.fromEntries(
        p.subprofiles.map(sp => [sp.id, {
          id: sp.id,
          name: sp.name,
          service: sp.service
        }])
      ) : undefined
    }));
  }

  /**
   * Get pending updates for a profile
   */
  async getPendingUpdates(profileId: string): Promise<{ updates: BufferUpdate[] }> {
    return this.get<{ updates: BufferUpdate[] }>(`/profiles/${profileId}/updates/pending.json`);
  }

  /**
   * Get a specific update
   */
  async getUpdate(updateId: string): Promise<BufferUpdate> {
    return this.get<BufferUpdate>(`/updates/${updateId}.json`);
  }

  /**
   * Create a new update (post)
   */
  async createUpdate(params: CreateUpdateParams): Promise<CreateUpdateResponse> {
    // Build form data
    const formData: Record<string, string> = {
      text: params.text
    };

    // Add profile IDs
    params.profile_ids.forEach((id, i) => {
      formData[`profile_ids[${i}]`] = id;
    });

    // Add media
    if (params.media) {
      if (params.media.link) formData['media[link]'] = params.media.link;
      if (params.media.description) formData['media[description]'] = params.media.description;
      if (params.media.title) formData['media[title]'] = params.media.title;
      if (params.media.picture) formData['media[picture]'] = params.media.picture;
      if (params.media.photo) formData['media[photo]'] = params.media.photo;
      if (params.media.thumbnail) formData['media[thumbnail]'] = params.media.thumbnail;
    }

    // Add scheduling options
    if (params.now) formData['now'] = 'true';
    if (params.top) formData['top'] = 'true';
    if (params.scheduled_at) formData['scheduled_at'] = params.scheduled_at.toString();
    if (params.is_draft) formData['is_draft'] = 'true';
    if (params.shorten !== undefined) formData['shorten'] = params.shorten.toString();
    if (params.attachment !== undefined) formData['attachment'] = params.attachment.toString();

    // Add subprofile IDs (Pinterest boards)
    if (params.subprofile_ids) {
      params.subprofile_ids.forEach((id, i) => {
        formData[`subprofile_ids[${i}]`] = id;
      });
    }

    return this.post<CreateUpdateResponse>('/updates/create.json', formData);
  }
}

// =============================================================================
// RAW API RESPONSE TYPES
// =============================================================================

interface RawProfile {
  id: string;
  service_id: string;
  formatted_service: string;
  formatted_username?: string;
  service: string;
  timezone: string;
  subprofiles?: Array<{
    id: string;
    name: string;
    service: string;
  }>;
}
