# buffer-cli

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)](https://bun.sh/)
[![Buffer API](https://img.shields.io/badge/Buffer-API%20v1-168eea.svg)](https://buffer.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> 🚀 A powerful CLI for scheduling social media posts through Buffer — no browser, no WordPress, just your terminal.

**buffer-cli** brings the power of [WPZinc's wp-to-buffer-pro](https://www.wpzinc.com/plugins/wp-to-buffer-pro/) to the command line. Authenticate once via OAuth, configure your posting preferences, and schedule content to all your connected social media profiles.

## ✨ Features

- 🔐 **Secure OAuth Authentication** — Browser-based OAuth flow, tokens stored locally
- 📱 **Multi-Platform Support** — Twitter/X, Facebook, LinkedIn, Instagram, Pinterest, Google Business, and more
- 📝 **Template Tags** — Use `{title}`, `{url}`, `{excerpt}`, and custom tags in your posts
- ⏰ **Flexible Scheduling** — Post now, queue, or schedule for specific times
- 🖼️ **Image Support** — Attach images to your posts
- ⚙️ **Per-Profile Settings** — Configure different defaults for each social profile
- 🔄 **Config Parity** — 1:1 compatibility with wp-to-buffer-pro settings schema
- 🤖 **Agent-Friendly** — Perfect for AI agents and automation (no scraping, no detection)

## 📦 Installation

```bash
# Install globally with bun
bun add -g buffer-cli

# Or with npm
npm install -g buffer-cli

# Or run directly with bunx
bunx buffer-cli
```

## 🚀 Quick Start

### 1. Authenticate with Buffer

```bash
buffer-cli auth
```

This opens your browser to authorize the app. Once complete, your tokens are securely stored in `~/.buffer-cli/auth.json`.

### 2. List Your Profiles

```bash
buffer-cli profiles
```

### 3. Post Something

```bash
# Post to all enabled profiles
buffer-cli post "Just shipped a new feature! 🚀 https://example.com"

# Post to specific profiles
buffer-cli post "Hello Twitter!" --profile twitter

# Schedule for later
buffer-cli post "Scheduled post" --schedule "2024-12-25 09:00"

# Add to queue
buffer-cli post "Queued post" --queue
```

## 📖 Commands

| Command | Description |
|---------|-------------|
| `auth` | Authenticate with Buffer via OAuth |
| `auth status` | Check authentication status |
| `auth logout` | Remove stored credentials |
| `profiles` | List connected social media profiles |
| `profiles sync` | Refresh profiles from Buffer |
| `post <message>` | Create a new post |
| `queue` | View queued posts |
| `queue flush` | Post all queued items |
| `config` | View current configuration |
| `config set <key> <value>` | Update configuration |
| `config reset` | Reset to defaults |

## ⚙️ Configuration

Configuration is stored in `~/.buffer-cli/config.json`:

```json
{
  "defaults": {
    "publish": {
      "enabled": true,
      "status": [{
        "image": 2,
        "message": "{title} {url}",
        "schedule": "queue_bottom"
      }]
    }
  },
  "profiles": {
    "abc123": {
      "enabled": true,
      "override": false,
      "service": "twitter",
      "formatted_username": "@youraccount"
    }
  }
}
```

### Template Tags

Use these tags in your post messages:

| Tag | Description |
|-----|-------------|
| `{title}` | Post title (from `--title` flag) |
| `{url}` | URL (from `--url` flag) |
| `{excerpt}` | Short excerpt |
| `{date}` | Current date |
| `{time}` | Current time |

### Schedule Options

| Option | Description |
|--------|-------------|
| `now` | Post immediately |
| `queue_bottom` | Add to end of Buffer queue |
| `queue_top` | Add to start of Buffer queue |
| `custom` | Delay by days/hours/minutes |
| `specific` | Post at specific date/time |

## 🔧 Advanced Usage

### Post with Image

```bash
buffer-cli post "Check out this screenshot!" --image ./screenshot.png
```

### Post to Pinterest Board

```bash
buffer-cli post "New pin!" --profile pinterest --board "My Board"
```

### Use Config File for Batch Posts

```bash
buffer-cli post --from ./posts.json
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BUFFER_CLI_CONFIG` | Custom config directory path |
| `BUFFER_CLI_DEBUG` | Enable debug logging |

## 🏗️ Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   buffer-cli    │────▶│  WPZinc Gateway  │────▶│ Buffer API  │
│   (your CLI)    │     │  proxy.wpzinc.net│     │   v1        │
└─────────────────┘     └──────────────────┘     └─────────────┘
        │
        ▼
┌─────────────────┐
│ ~/.buffer-cli/  │
│  ├── auth.json  │
│  ├── config.json│
│  └── cache/     │
└─────────────────┘
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

```bash
# Clone the repo
git clone https://github.com/michaelmonetized/buffer-cli.git
cd buffer-cli

# Install dependencies
bun install

# Run in development
bun run dev

# Run tests
bun test

# Build
bun run build
```

## 📄 License

MIT © [Michael Hurley](https://github.com/michaelmonetized)

## 🙏 Acknowledgments

- [WPZinc](https://www.wpzinc.com/) for the original wp-to-buffer-pro plugin
- [Buffer](https://buffer.com/) for their excellent API
- The [OpenClaw](https://openclaw.ai/) community

---

<p align="center">
  Made with ☕ by <a href="https://hurleyus.com">HurleyUS</a>
</p>
