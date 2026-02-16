# buffer-cli — Project Plan

## Overview

A command-line interface for scheduling social media posts through Buffer, with 1:1 configuration parity with WPZinc's wp-to-buffer-pro WordPress plugin. Designed for developers, automation scripts, and AI agents who need reliable social media posting without browser automation or scraping.

## Problem Statement

1. **Scraping-based CLIs get detected** — Tools like `bird` use session cookies and get flagged as bots
2. **WordPress dependency** — wp-to-buffer-pro requires WordPress
3. **No CLI alternative** — Buffer's own CLI is deprecated; no modern alternative exists
4. **AI agents need reliable posting** — OpenClaw and similar tools need unblocked social media access

## Solution

A TypeScript/Bun CLI that:
- Uses Buffer's official API through the WPZinc OAuth gateway
- Maintains 1:1 config parity with wp-to-buffer-pro
- Stores credentials securely in `~/.buffer-cli/`
- Works standalone or as an OpenClaw skill

## Architecture

### System Components

```
┌────────────────────────────────────────────────────────────────────┐
│                           User's Machine                            │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ buffer-cli  │───▶│ OAuth Handler    │───▶│ Local HTTP Server│  │
│  │   (main)    │    │ (opens browser)  │    │ (callback:9876)  │  │
│  └─────────────┘    └──────────────────┘    └──────────────────┘  │
│         │                                            │              │
│         │                                            │              │
│         ▼                                            ▼              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │                    ~/.buffer-cli/                            │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │  │
│  │  │ auth.json   │  │ config.json  │  │ cache/profiles.json│  │  │
│  │  │ - access    │  │ - defaults   │  │ - profile list     │  │  │
│  │  │ - refresh   │  │ - profiles   │  │ - last synced      │  │  │
│  │  │ - expires   │  │ - settings   │  │                    │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (x-forwarded-host: www.hustlelaunch.com)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        WPZinc Infrastructure                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────┐         ┌─────────────────────────────────┐│
│  │ OAuth Gateway      │         │ Proxy (optional)                ││
│  │ wpzinc.com/?oauth  │         │ proxy.wpzinc.net                ││
│  │                    │         │                                 ││
│  │ - Exchanges code   │         │ - Forwards requests if needed   ││
│  │   for tokens       │         │ - Rate limit handling           ││
│  └────────────────────┘         └─────────────────────────────────┘│
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          Buffer API v1                               │
│                      api.bufferapp.com/1/                           │
├─────────────────────────────────────────────────────────────────────┤
│  Endpoints:                                                          │
│  - GET  /user.json              - User info                         │
│  - GET  /profiles.json          - List connected profiles           │
│  - POST /updates/create.json    - Create/schedule post              │
│  - GET  /updates/:id.json       - Get update status                 │
│  - GET  /profiles/:id/updates/pending.json - Queue for profile      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Social Media Platforms                          │
├─────────────────────────────────────────────────────────────────────┤
│  Twitter/X │ Facebook │ LinkedIn │ Instagram │ Pinterest │ GBP     │
└─────────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
buffer-cli/
├── src/
│   ├── index.ts              # CLI entry point (commander)
│   ├── commands/
│   │   ├── auth.ts           # OAuth flow
│   │   ├── profiles.ts       # Profile management
│   │   ├── post.ts           # Create posts
│   │   ├── queue.ts          # Queue management
│   │   └── config.ts         # Config management
│   ├── lib/
│   │   ├── api.ts            # Buffer API client
│   │   ├── oauth.ts          # OAuth handler
│   │   ├── config.ts         # Config read/write
│   │   ├── auth.ts           # Token management
│   │   ├── templates.ts      # Template tag processing
│   │   └── types.ts          # TypeScript types
│   └── utils/
│       ├── logger.ts         # Console output
│       └── http.ts           # HTTP helpers
├── tests/
│   ├── api.test.ts
│   ├── config.test.ts
│   └── templates.test.ts
├── package.json
├── tsconfig.json
├── README.md
├── PLAN.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

## Configuration Schema

### auth.json (1:1 parity with wp-to-buffer-pro)

```typescript
interface AuthConfig {
  access_token: string;
  refresh_token: string;
  token_expires: number | false;  // Unix timestamp or false
}
```

### config.json (1:1 parity with wp-to-buffer-pro)

```typescript
interface Config {
  // Global settings
  proxy?: boolean;
  log?: boolean;
  test_mode?: boolean;
  
  // Default posting settings (applied to all profiles unless overridden)
  defaults: {
    publish: ActionConfig;
    update?: ActionConfig;
  };
  
  // Per-profile settings
  profiles: {
    [profileId: string]: ProfileConfig;
  };
}

interface ActionConfig {
  enabled: boolean;
  status: StatusConfig[];
}

interface StatusConfig {
  // Image handling
  image: 0 | 1 | 2;  // 0=none, 1=open_graph, 2=featured/attached
  
  // Message template
  message: string;  // Supports {title}, {url}, {excerpt}, {date}, etc.
  
  // Scheduling
  schedule: 'now' | 'queue_bottom' | 'queue_top' | 'custom' | 'custom_relative' | 'custom_field' | 'specific';
  days: number;
  hours: number;
  minutes: number;
  schedule_relative_day?: string;
  schedule_relative_time?: string;  // "HH:MM:SS"
  schedule_specific?: string;       // ISO date string
  
  // Platform-specific
  sub_profile?: string;  // Pinterest board ID
  update_type?: string;  // Instagram: reel, story, etc.
  
  // Google Business Profile
  googlebusiness?: {
    post_type: 'whats_new' | 'offer' | 'event';
    cta?: 'book' | 'order' | 'shop' | 'learn_more' | 'signup';
    title?: string;
    start_date?: string;
    end_date?: string;
    code?: string;      // Offer code
    terms?: string;     // Offer terms
  };
  
  // Text to image (for quote graphics, etc.)
  text_to_image?: string;
}

interface ProfileConfig {
  enabled: boolean;
  override: boolean;  // If true, use profile-specific settings instead of defaults
  
  // Profile info (from API)
  id: string;
  service: string;  // 'twitter', 'facebook', 'linkedin', etc.
  formatted_service: string;
  formatted_username: string;
  timezone: string;
  
  // Subprofiles (Pinterest boards)
  subprofiles?: {
    [id: string]: {
      id: string;
      name: string;
      service: string;
    };
  };
  
  // Profile-specific posting settings (when override=true)
  publish?: ActionConfig;
  update?: ActionConfig;
}
```

### cache/profiles.json

```typescript
interface ProfilesCache {
  updated_at: string;  // ISO timestamp
  profiles: {
    [profileId: string]: {
      id: string;
      social_network_id: string;
      formatted_service: string;
      formatted_username: string;
      service: string;
      timezone: string;
      subprofiles?: object;
    };
  };
}
```

## OAuth Flow

### Step 1: Initiate Auth

```
User runs: buffer-cli auth

CLI:
1. Starts local HTTP server on port 9876
2. Generates state parameter for CSRF protection
3. Opens browser to:
   https://bufferapp.com/oauth2/authorize
     ?client_id=592d41d14d97ab7e4e571edb
     &redirect_uri=https://www.wpzinc.com/?oauth=buffer
     &response_type=code
     &state=http://localhost:9876/callback
```

### Step 2: User Authorizes

```
User:
1. Logs into Buffer (if needed)
2. Clicks "Authorize"
3. Buffer redirects to WPZinc gateway with auth code
```

### Step 3: Token Exchange

```
WPZinc Gateway:
1. Receives code from Buffer
2. Exchanges code for access_token + refresh_token
3. Redirects to state URL (localhost:9876/callback) with tokens
```

### Step 4: Store Tokens

```
CLI:
1. Local server receives tokens
2. Stores in ~/.buffer-cli/auth.json
3. Closes server
4. Fetches and caches profiles
5. Displays success message
```

## API Client

### Headers

All requests to Buffer API must include:

```typescript
const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'X-Forwarded-Host': 'www.hustlelaunch.com',  // Required for WPZinc gateway
  'User-Agent': 'buffer-cli/1.0.0'
};
```

### Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/1/user.json` | Get authenticated user info |
| GET | `/1/profiles.json?subprofiles=1` | List connected profiles |
| POST | `/1/updates/create.json` | Create/schedule a post |
| GET | `/1/updates/:id.json` | Get update status |
| GET | `/1/profiles/:id/updates/pending.json` | Get queued posts for profile |

### Request Parameters for updates/create.json

```typescript
interface CreateUpdateParams {
  profile_ids: string[];        // Array of Buffer profile IDs
  text: string;                 // Post content (max varies by platform)
  media?: {
    link?: string;              // URL to link
    description?: string;       // Link description
    title?: string;             // Link title
    picture?: string;           // Image URL
    photo?: string;             // Image URL (alternative)
    thumbnail?: string;         // Video thumbnail
  };
  shorten?: boolean;            // Shorten URLs via Buffer
  now?: boolean;                // Post immediately
  top?: boolean;                // Add to top of queue
  scheduled_at?: number;        // Unix timestamp for specific time
  is_draft?: boolean;           // Save as draft
  attachment?: boolean;         // Include link attachment
  subprofile_ids?: string[];    // Pinterest board IDs
  source_url?: string;          // Original content URL
  retweet?: {                   // For retweets
    tweet_id: string;
  };
}
```

## Template Tags

Supported tags (matching wp-to-buffer-pro):

| Tag | Description | Example |
|-----|-------------|---------|
| `{title}` | Content title | "My Blog Post" |
| `{url}` | Content URL | "https://..." |
| `{excerpt}` | Short excerpt | "First 100 chars..." |
| `{content}` | Full content | "Full text..." |
| `{date}` | Current date | "2024-02-16" |
| `{time}` | Current time | "14:30" |
| `{author}` | Author name | "John Doe" |
| `{sitename}` | Site name | "My Site" |
| `{hashtags}` | Auto-generated hashtags | "#tech #news" |

## Implementation Phases

### Phase 1: Core Infrastructure ✅
- [x] Project setup (package.json, tsconfig, etc.)
- [x] Directory structure
- [x] README, PLAN, LICENSE
- [ ] Basic CLI framework with commander
- [ ] Config file read/write
- [ ] Logger utility

### Phase 2: Authentication
- [ ] OAuth URL generation
- [ ] Local callback server
- [ ] Token storage
- [ ] Token refresh logic
- [ ] Auth status command
- [ ] Logout command

### Phase 3: Profiles
- [ ] Fetch profiles from API
- [ ] Cache profiles locally
- [ ] List profiles command
- [ ] Sync profiles command
- [ ] Profile enable/disable

### Phase 4: Posting
- [ ] Template tag processing
- [ ] Create post command
- [ ] Schedule options (now, queue, specific time)
- [ ] Image upload support
- [ ] Platform-specific options

### Phase 5: Queue Management
- [ ] View queue command
- [ ] Flush queue command
- [ ] Remove from queue

### Phase 6: Polish
- [ ] Comprehensive tests
- [ ] Error handling
- [ ] Debug logging
- [ ] npm publish
- [ ] OpenClaw skill integration

## Testing Strategy

### Unit Tests
- Config parsing
- Template tag replacement
- Schedule time calculation
- API response parsing

### Integration Tests
- OAuth flow (mock server)
- API calls (mock responses)
- File I/O

### E2E Tests (Manual)
- Full OAuth flow with real Buffer account
- Post to test profiles
- Verify on social platforms

### Test Environment
```bash
# Set x-forwarded-host for API testing
export BUFFER_CLI_HOST=www.hustlelaunch.com
bun test
```

## Error Handling

### API Errors (from wp-to-buffer-pro)

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Unauthorized | Re-authenticate |
| 403 | Permission denied | Re-authenticate |
| 1001 | Access token required | Re-authenticate |
| 1003 | Invalid parameter | Check image URL |
| 1004 | Missing image/message too long | Check content |
| 1011 | No profile access | Reconnect profile in Buffer |
| 1023 | Queue limit reached | Upgrade Buffer or post immediately |
| 1025 | Duplicate post | Modify message |
| 1030 | Media error | Check image format/URL |
| 1034 | Past schedule time | Fix scheduled time |

## Security Considerations

1. **Token Storage**: Tokens stored in `~/.buffer-cli/` with 600 permissions
2. **No Secrets in Code**: Client ID is public (same as wp-to-buffer-pro)
3. **CSRF Protection**: State parameter in OAuth flow
4. **Token Refresh**: Auto-refresh before expiry
5. **Secure Callbacks**: Local server only accepts from expected sources

## Dependencies

```json
{
  "dependencies": {
    "commander": "^12.0.0",      // CLI framework
    "chalk": "^5.0.0",           // Terminal colors
    "ora": "^8.0.0",             // Spinners
    "open": "^10.0.0",           // Open browser
    "inquirer": "^9.0.0"         // Interactive prompts
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "bun-types": "latest",
    "@types/node": "^20.0.0"
  }
}
```

## Future Enhancements

1. **OpenClaw Skill** — Package as installable skill
2. **Batch Import** — Import posts from CSV/JSON
3. **Analytics** — View post performance
4. **Multi-Account** — Support multiple Buffer accounts
5. **Offline Queue** — Queue posts when offline, sync later
6. **TUI Mode** — Interactive terminal UI for post creation

---

*Last updated: 2026-02-16*
