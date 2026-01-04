# Personal Tracker - Add/Edit Page

This directory contains the add/edit page for the Personal Tracker app.

## Route Structure

The page uses SvelteKit's **optional parameter** syntax:

```
src/routes/(apps)/personal-tracker/add/[...timestamp]/
```

The double brackets `[...timestamp]` make the parameter optional, allowing two distinct behaviors:

### Routes

1. **Create Mode**: `/personal-tracker/add`
    - No timestamp parameter
    - Creates a new entry for today
    - All sections start disabled (unchecked)
    - Timestamp = start of current day in UTC

2. **Edit Mode**: `/personal-tracker/add/1704326400`
    - Timestamp parameter provided (Unix timestamp in seconds)
    - Loads existing event with that timestamp
    - Pre-populates form with existing data
    - Sections with data are automatically enabled (checked)

## How It Works

### Timestamp Handling

The page uses **start-of-day UTC timestamps** to ensure all entries for the same day share the same timestamp, allowing the server to update existing entries instead of creating duplicates.

**Key Functions:**

```typescript
// Returns start of today in UTC (e.g., 2026-01-04 00:00:00 UTC)
getTodayTimestamp() → Unix timestamp

// Returns timestamp from URL or falls back to today
getTargetTimestamp() → Unix timestamp
```

**Example:**

- Multiple submissions on Jan 4, 2026 all use timestamp `1704326400`
- Server receives same timestamp → updates existing event instead of creating new one

### Create vs Edit Mode

Mode is determined by presence of the `timestamp` parameter:

```typescript
const isEditMode = $derived(!!page.params.timestamp);
```

**UI Differences:**

- **Create Mode**:
    - Title: "Today's Personal Metrics"
    - Button: "Create Entry"
    - Toast: "Entry created"

- **Edit Mode**:
    - Title: "Edit Entry"
    - Button: "Update Entry"
    - Toast: "Entry updated"

### Data Loading (onMount)

When the page loads:

1. **Fetch all encrypted events** from server
2. **Calculate target timestamp**:
    - Edit mode: Use timestamp from URL
    - Create mode: Use today's timestamp
3. **Find matching event** (exact timestamp match)
4. **Pre-populate form** if event exists:
    - Restore `mood` value
    - Restore `weight` value (convert from centikgs to kg)
    - Restore `emotionwheel` selection
    - Enable sections that have data

### Encryption Flow

All data is encrypted client-side before sending to server:

1. **Salt generation**: Random salt per event
2. **Key derivation**: `getUserKey(password, salt)`
3. **Encryption**: `encryptData(JSON.stringify(data), key)`
4. **Server storage**: Only encrypted data, salt, and nonce are stored

The server never sees plaintext data. Decryption happens client-side when loading events.

## Component Structure

```
[[timestamp]]/
├── +page.svelte           # Main page component
└── components/
    ├── EventFormEmotionWheel.svelte
    ├── EventFormMood.svelte
    └── EventFormWeight.svelte
```

Each form component:

- Exposes value via bindable props
- Handles its own validation (where applicable)
- Renders only when section is enabled
