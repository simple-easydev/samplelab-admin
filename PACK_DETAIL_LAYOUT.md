# Pack Detail Page - Layout Structure

## Visual Layout Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PACK DETAIL PAGE                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 🏠 Breadcrumbs                                                               │
│ Library / Packs / [Pack Name]                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ 📋 PAGE HEADER / HERO                                                        │
├─────────────────────────────────────────────────┬───────────────────────────┤
│ [Pack Name] 🏷️Draft 🌟Premium                  │  [Edit Pack] [•••]       │
│ 👤 Creator • 🎵 5 samples • 📅 Jan 15, 2024    │                          │
└─────────────────────────────────────────────────┴───────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────────────────────────┬───────────────────────────┐
│ LEFT COLUMN (2/3 width)                         │ RIGHT COLUMN (1/3 width)  │
├─────────────────────────────────────────────────┼───────────────────────────┤
│                                                 │                           │
│ ┌─────────────────────────────────────────────┐ │ ┌───────────────────────┐ │
│ │ 📦 PACK INFORMATION                         │ │ │ 👤 CREATOR & METADATA │ │
│ ├─────────────────┬───────────────────────────┤ │ ├───────────────────────┤ │
│ │ LEFT            │ RIGHT                     │ │ │                       │ │
│ ├─────────────────┼───────────────────────────┤ │ │ Creator:              │ │
│ │ [Cover Image]   │ Premium: Yes 🌟          │ │ │ ┌─────────────────┐   │ │
│ │                 │                           │ │ │ │ 👤 Avatar       │   │ │
│ │ [300x300]       │ Genres:                   │ │ │ │ Creator Name    │   │ │
│ │                 │ Hip-Hop Soul Trap         │ │ │ │ View profile →  │   │ │
│ │                 │                           │ │ │ └─────────────────┘   │ │
│ │ Description:    │ Sample Types:             │ │ │                       │ │
│ │ This pack       │ Loop One-shot Stems       │ │ │ ───────────────────   │ │
│ │ contains...     │                           │ │ │                       │ │
│ │                 │ Tags:                     │ │ │ Created:              │ │
│ │                 │ 🏷️ Dark Vintage Dusty    │ │ │ 📅 January 15, 2024   │ │
│ └─────────────────┴───────────────────────────┘ │ │                       │ │
│                                                 │ │ Last Updated:         │ │
│ ┌─────────────────────────────────────────────┐ │ │ 📅 February 1, 2024   │ │
│ │ 💰 CREDITS & PRICING                        │ │ │                       │ │
│ ├─────────────────────────────────────────────┤ │ │ Category:             │ │
│ │ Global Default Credit Costs                 │ │ │ [Hip-Hop]             │ │
│ │ ┌─────────────┬─────────────┐              │ │ └───────────────────────┘ │
│ │ │ One-shots:  │ Loops:      │              │ │                           │
│ │ │ 2 credits   │ 3 credits   │              │ │ ┌───────────────────────┐ │
│ │ └─────────────┴─────────────┘              │ │ │ 📊 ANALYTICS          │ │
│ │ ┌─────────────────────────────┐            │ │ ├───────────────────────┤ │
│ │ │ Stems Bundle: +5 credits    │            │ │ │                       │ │
│ │ └─────────────────────────────┘            │ │ │ All-Time Downloads:   │ │
│ │                                             │ │ │ 📥 1,240             │ │
│ │ ⚠️ This is a Premium pack.                 │ │ │                       │ │
│ │    Premium costs: One-shots (8), Loops (10)│ │ │ Last 30 Days:         │ │
│ │                                             │ │ │ — Coming soon         │ │
│ │ ℹ️ Individual samples may have overrides.  │ │ │                       │ │
│ └─────────────────────────────────────────────┘ │ │ Unique Users:         │ │
│                                                 │ │ — Coming soon         │ │
│ ┌─────────────────────────────────────────────┐ │ └───────────────────────┘ │
│ │ 🎵 PACK PREVIEW                             │ │                           │
│ ├─────────────────────────────────────────────┤ │ ┌───────────────────────┐ │
│ │ [▶️] ━━━━━━━━━━━━━━━ 🔊─────              │ │ │ 🎯 CTA SECTION        │ │
│ │      0:35 / 2:15                            │ │ ├───────────────────────┤ │
│ │                                             │ │ │                       │ │
│ │ Preview: First sample from this pack        │ │ │ [▶️ Play Preview]     │ │
│ └─────────────────────────────────────────────┘ │ │                       │ │
│                                                 │ │ [••• More Actions]    │ │
│                                                 │ │   • Edit Pack         │ │
│                                                 │ │   • Disable Pack      │ │
│                                                 │ │   • Delete Pack       │ │
│                                                 │ └───────────────────────┘ │
└─────────────────────────────────────────────────┴───────────────────────────┘
```

---

## Section Breakdown

### 1. **Breadcrumbs** (Top)
- Text: `Library / Packs / [Pack Name]`
- All segments clickable
- Current page highlighted

### 2. **Header / Hero** (Full Width)
**Left Side:**
- Pack name (text-3xl, bold)
- Status badge (color-coded)
- Premium badge (if applicable)
- Meta line with icons and links

**Right Side:**
- Edit Pack button (primary)
- More actions menu (•••)

### 3. **Separator Line**
- Visual divider between header and content

### 4. **Main Content Grid** (Responsive)

#### **Left Column (2/3 width on desktop)**

##### A. Pack Information Card
**Left Sub-column:**
- Cover image (square, aspect-ratio 1:1)
- Description text (multi-line)

**Right Sub-column:**
- Premium badge (Yes/No)
- Genres (badge list)
- Sample Types (badge list)
- Tags (badge list with icons)

##### B. Credits & Pricing Card
- Global defaults grid
- Premium alert (if applicable)
- Override information note

##### C. Pack Preview Card
- Audio player with controls
- Progress bar
- Volume slider
- Preview note

#### **Right Column (1/3 width on desktop)**

##### A. Creator & Metadata Card
- Creator clickable card
- Created date
- Last updated date
- Category badge

##### B. Analytics Card
- All-time downloads (large number)
- Last 30 days (placeholder)
- Unique users (placeholder)

##### C. CTA Card
- Play Preview button (full-width)
- More Actions dropdown (full-width)

---

## Responsive Behavior

### Desktop (lg: 1024px+)
```
┌─────────────┬─────┐
│             │     │
│   Content   │ Bar │
│   (2/3)     │(1/3)│
│             │     │
└─────────────┴─────┘
```

### Tablet/Mobile (< 1024px)
```
┌─────────────┐
│   Content   │
│             │
├─────────────┤
│   Sidebar   │
│             │
└─────────────┘
```

---

## Color Coding

### Status Badges
- **Published** → Green (`default` variant)
- **Draft** → Gray (`secondary` variant)
- **Disabled** → Red (`destructive` variant)

### Premium Badge
- Amber/Gold background
- Sparkle icon (✨)

### Action States
- **Hover**: Slight background change
- **Loading**: Spinner + disabled state
- **Disabled**: Muted colors + cursor-not-allowed

---

## Icon Usage Map

| Section | Icon | Purpose |
|---------|------|---------|
| Header | `User` | Creator name |
| Header | `Music` | Sample count |
| Header | `Calendar` | Created date |
| Header | `Edit` | Edit button |
| Header | `MoreHorizontal` | Actions menu |
| Header | `Sparkles` | Premium badge |
| Pack Info | `Music` | Cover placeholder |
| Pack Info | `Tag` | Tags |
| Credits | `Sparkles` | Premium alert |
| Preview | `Play/Pause` | Playback control |
| Preview | `Volume2` | Volume control |
| Metadata | `User` | Creator avatar |
| Metadata | `Calendar` | Dates |
| Analytics | `Download` | Download metrics |
| CTA | `Play/Pause` | Play button |
| Actions | `Eye` | View |
| Actions | `Edit` | Edit |
| Actions | `Ban` | Disable |
| Actions | `Check` | Enable |
| Actions | `Trash2` | Delete |

---

## Data Flow

```
URL: /admin/library/packs/:id
        ↓
PackDetail Component
        ↓
    useEffect
        ↓
Supabase Queries (3 parallel):
  1. packs (with joins)
  2. pack_genres
  3. samples
        ↓
Process & Compute:
  - samples_count
  - sample_types[]
  - has_stems
  - preview_sample_url
        ↓
Render UI Sections
        ↓
User Actions:
  - Play audio
  - Disable/Enable
  - Delete
  - Navigate
```

---

## Component Hierarchy

```
PackDetail
├── Breadcrumbs (custom)
├── Header
│   ├── Title + Badges
│   ├── Meta Line (links)
│   └── Actions
│       ├── Edit Button
│       └── Dropdown Menu
├── Separator
└── Main Grid
    ├── Left Column
    │   ├── Pack Info Card
    │   │   ├── Cover Image
    │   │   └── Metadata Grid
    │   ├── Credits Card
    │   │   ├── Global Costs
    │   │   ├── Premium Alert
    │   │   └── Override Note
    │   └── Preview Card
    │       └── Audio Player
    └── Right Column
        ├── Creator Card
        ├── Analytics Card
        └── CTA Card
            ├── Play Button
            └── Actions Dropdown
```

---

## State Management

### Component State
```typescript
- pack: PackDetail | null          // Main pack data
- isLoading: boolean                // Initial load
- error: string | null              // Error message
- isDeleting: boolean               // Delete in progress
- isUpdatingStatus: boolean         // Status update in progress
- isPlaying: boolean                // Audio playback state
- duration: number                  // Audio duration
- currentTime: number               // Audio current time
- volume: number                    // Audio volume (0-1)
```

### Refs
```typescript
- audioRef: HTMLAudioElement        // Audio element reference
```

---

**Created**: February 5, 2026  
**For**: Pack Detail Page Implementation  
**Version**: 1.0
