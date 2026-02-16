# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project structure
- OAuth authentication flow with Buffer
- Profile listing and sync commands
- Post creation with scheduling options
- Template tag support ({title}, {url}, {excerpt}, etc.)
- Per-profile configuration
- Config management commands
- Comprehensive documentation

### Technical
- TypeScript with Bun runtime
- 1:1 config parity with wp-to-buffer-pro
- X-Forwarded-Host header for WPZinc gateway compatibility
