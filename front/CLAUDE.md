# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development

```bash
npm run build            # Build for production
npm run preview          # Preview production build
```

### Code Quality

```bash
npm run check            # Run svelte-check with TypeScript validation
npm run lint             # Run ESLint on src/
npm run lint:fix         # Auto-fix ESLint issues
npm run prettier         # Check Prettier formatting
npm run prettier:fix     # Auto-fix Prettier formatting
```

### Git Hooks

This should be run only once when cloning the repo. The main hook runs `npm install` when a change in package.json is detected after pulling the main branch

```bash
npm run setup-githooks   # Install pre-commit hooks from ./githooks/
```

## Architecture Overview

This is a **SvelteKit 5** static site serving multiple personal apps/utilities deployed to GitHub Pages.

### Key Technologies

- **SvelteKit 2** with `@sveltejs/adapter-static` (builds to `/docs`)
- **Svelte 5** with modern runes-based reactivity
- **Vite 7** with TypeScript 5 (strict mode)
- **Auto-generated API client** from backend OpenAPI specs

### Route Organization

Routes use SvelteKit's layout grouping feature:

- **`src/routes/(apps)/`** - Main application collection (20+ apps)
    - Music tools: Songbook, Metronome, Scales, Chord Wheel, Tap Tempo
    - Utilities: Notes, Clipboard, Web Watcher, Cookbook
    - Personal: Home Tracker, Personal Tracker, Ephemerides
    - Entry point: `/+page.svelte` shows app directory

- **`src/routes/(garden)/`** - Creative experiments (p5.js projects)

- **`src/routes/(noso)/`** - Test/demo routes

Each group has its own `+layout.svelte` for shared UI (header, modals, toasts).

## API Framework

### Architecture

The codebase uses a **unified API framework** for backend communication:

```
Routes → Feature APIs → client2 → Auto-generated SDK → Backend (api.statox.fr)
```

### Implementation Details

1. **Auto-generated SDK**: `src/vendor/statox-api/index.ts`
    - Generated from backend OpenAPI spec
    - Full TypeScript type safety via `json-schema-to-ts`
    - Runtime validation with AJV
    - Methods organized by domain: `client.auth`, `client.clipboard`, `client.homeTracker`, etc.

2. **Client Instance**: `src/lib/api/client2.ts`

    ```typescript
    export const client2 = new APIClient({
        baseURL: getApiUrl(), // from $lib/helpers.ts
        credentials: 'include'
    });
    ```

3. **Feature-level API Wrappers**: Pattern used throughout (e.g., `src/lib/Clipboard/api.ts`)
    - Wrap raw SDK calls with business logic
    - Transform/enrich data for UI (e.g., date formatting with Luxon)
    - Handle feature-specific error cases

4. **Usage Example**:

    ```typescript
    // In src/lib/Clipboard/api.ts
    import { client2 } from '$lib/api/client2';

    export const getPublicClipboard = async () => {
        const entries = await client2.clipboard.getPublicEntries();
        return entries.map(enrichEntry);
    };
    ```

### Environment Configuration

API URL is environment-specific:

- `env.local` for development
- `env.prod` for production
- `svelte.config.js` copies the appropriate file to `.env` at build time
- Access via: `import { getApiUrl } from '$lib/helpers'` then `getApiUrl()` returns the API url.

## Component Architecture

### Module Organization

#### Feature modules

Each feature module in `src/lib/` follows this pattern:

```
src/lib/FeatureName/
├── index.ts           # Clean exports
├── api.ts             # Backend API wrapper
├── types.ts           # TypeScript definitions
└── service.ts         # Logic which doesn't belong in UI components
```

These modules start with a capital letter.

#### helper modules

Modules like `src/lib/api`, `src/lib/auth` and `src/lib/encryption` are modules with similar structure to feature modules but contain common features.

### Reusable Components

Components use indexed structure:

```
src/lib/components/ComponentName/
├── index.ts           # Export main component
├── Main.svelte        # Actual component
├── store.ts           # Optional state
└── types.ts           # Type definitions
```

Key shared components:

- `Header` - Global navigation with auth
- `AuthGuard` - Permission checking wrapper
- `Toast` - Notifications (based on svelte-toast)
- `Modal` - Dialogs (svelte-modals)
- Form controls: `ButtonSwitch`, `NumericSliderPicker`, `DurationPicker`

### State Management Patterns

1. **Writable Stores** (preferred):

    ```typescript
    import { writable } from 'svelte/store';
    export const user = writable<UserProfile | undefined>();
    ```

2. **Custom localStore** (when needing to persist the value in local storage. Can only be used in svelte components like in `src/routes/(apps)/p5-terrain/+page.svelte`):

    ```typescript
    import { localStore } from '$lib/localStore.svelte';
    let myState = localStore('key', initialValue);
    myState.value = newValue; // Auto-syncs to localStorage
    ```

3. **Page Metadata** (global, required in each page to properly setup header and tab title):
    ```typescript
    import { pageMetadataStore } from '$lib/components/Header/store';
    pageMetadataStore.set({
        name: 'Page Title',
        iconPath: '/icon.png',
        showAuthInHeader: true
    });
    ```

### Auth Pattern

Protected content uses the `AuthGuard` component:

```svelte
<AuthGuard requiredScope="homeTracker" message="Login required">
    <ProtectedContent />
</AuthGuard>
```

Permission checking logic in `src/lib/auth/service.ts`:

```typescript
isAllowedForUser(scope: AuthScope, userProfile?: UserProfile): boolean
```

## Style

The CSS styles used by the application is defined in `src/lib/styles`. These styles are imported in `src/routes/(apps)/+layout.svelte`. The following files are used:

```
- new.css   # The base theme, originally taken from https://newcss.net/
- new_theme.css # Definition of the variables holding the color of the light and dark themes
- new_override.css # The customizations of new.css
- highlightjs_gruvbox_dark.css # Used in markdown rendering to color code
- highlightjs_override.css # Customize the original gruvbox theme
- helpers.css # Legacy file containing some utils which should not be used in new components.
```

Each Svelte component also contains its own CSS style. Prefer using nested CSS properties when possible.

## Important Patterns

### Static Site Generation

- SSR disabled to avoid build-time API calls
- Uses `export const ssr = false;` in `+layout.js` files
- 404.html fallback for SPA routing

### Path Aliases

Configured in `svelte.config.js`:

- `$lib` → `src/lib` (SvelteKit default)
- `$config` → `src/config`
- `$packages` → `src/packages`
- `$vendor` → `src/vendor`

### Markdown Support

- A custom commponent is available in `src/lib/components/Markdown`
- Uses `@humanspeak/svelte-markdown` for rendering
- Markdown files loaded as text via vite-plugin-plain-text
- Syntax highlighting with highlight.js (Gruvbox Dark theme)
- Custom styles in `src/lib/styles/highlightjs_override.css`

### Development Notes

- Dev server runs on HTTPS (self-signed cert) for secure cookie testing
- Pre-commit hooks available via `npm run setup-githooks`
- TypeScript strict mode enabled
- ESLint with modern flat config + TypeScript + Svelte plugins

## Major Features

Each major feature has its own module in `src/lib/`:

- **Clipboard** - Universal clipboard manager with public/private entries
- **HomeTracker** - Home sensor monitoring with time-series visualization
- **PersonalTracker** - Encrypted personal event tracking (uses libsodium)
- **Cookbook** - Recipe management with ingredients
- **WebWatcher** - Website monitoring with CSS selector watching
- **Reactor** - Image collection with S3 integration
- **Scales/ChordWheel** - Music theory tools
- **Metronome/TapTempo** - Audio-based tempo tools
- **Notes** - Simple note management
