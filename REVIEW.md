# FALLOW REVIEW

## HEALTH

## Vital Signs

| Metric | Value |
|:-------|------:|
| Total LOC | 1901 |
| Avg Cyclomatic | 2.8 |
| P90 Cyclomatic | 5 |
| Dead Files | 0.0% |
| Dead Exports | 8.9% |
| Maintainability (avg) | 88.4 |
| Circular Deps | 0 |
| Unused Deps | 0 |

## Fallow: 10 high complexity functions

| File | Function | Severity | Cyclomatic | Cognitive | CRAP | Lines |
|:-----|:---------|:---------|:-----------|:----------|:-----|:------|
| `src/commands/post.ts:18` | `postCommand` | critical | 34 **!** | 52 **!** | 1190.0 **!** | 161 |
| `src/commands/profiles.ts:48` | `profilesCommand` | critical | 19 | 26 **!** | 380.0 **!** | 82 |
| `src/lib/api.ts:242` | `createUpdate` | critical | 15 | 20 **!** | 240.0 **!** | 38 |
| `src/lib/api.ts:158` | `parseError` | critical | 12 | 3 | 156.0 **!** | 30 |
| `src/lib/api.ts:89` | `request` | high | 9 | 9 | 90.0 **!** | 56 |
| `src/lib/oauth.ts:37` | `handleCallback` | high | 8 | 7 | 72.0 **!** | 94 |
| `src/commands/post.ts:187` | `findProfile` | moderate | 6 | 9 | 42.0 **!** | 27 |
| `src/commands/auth.ts:48` | `authStatusCommand` | moderate | 6 | 7 | 42.0 **!** | 50 |
| `src/lib/config.ts:77` | `isAuthenticated` | moderate | 5 | 4 | 30.0 **!** | 13 |
| `src/commands/profiles.ts:134` | `profilesSyncCommand` | moderate | 5 | 5 | 30.0 **!** | 48 |

**9** files, **88** functions analyzed (thresholds: cyclomatic > 20, cognitive > 15, CRAP >= 30.0)



## AUDIT


Audit scope: 6 changed files vs main (9b53095..HEAD)
✓ No issues in 6 changed files (0.24s)


## DEAD

## Fallow: 7 issues found

### Unused exports (4)

- `src/lib/config.ts`
  - :98 `getDefaultStatus`
- `src/lib/oauth.ts`
  - :165 `refreshTokenIfNeeded`
- `src/lib/templates.ts`
  - :95 `extractTags`
  - :114 `validateTemplate`

### Unused class members (3)

- `src/lib/api.ts`
  - :74 `BufferApi.getRegistrationUrl`
  - :228 `BufferApi.getPendingUpdates`
  - :235 `BufferApi.getUpdate`




## DUPLICATION

note: hid 1 clone group below minOccurrences=3 (lower --min-occurrences to see them)
## Fallow: no code duplication found



## DOCSTRINGS

✔︎ 100% docstring coverage

