# SampleLab Admin Panel - Architecture Summary

Quick reference guide for key architectural decisions.

## 📦 Data Structure: Pack-First Architecture

```
Pack (1) ──── Contains ──── (1+) Samples
```

**Golden Rule:** Every sample MUST belong to a pack.

- Single sample products → Still a pack (with 1 sample)
- No orphaned samples allowed
- `pack_id` is REQUIRED on all samples

📖 **Full Details:** [DATA_STRUCTURE.md](./DATA_STRUCTURE.md)

---

## 🎯 Status Logic

### Pack Status (2 States)

| Status | Description | User Visibility |
|--------|-------------|----------------|
| **Published** | Live on site | ✅ Visible |
| **Disabled** | Hidden from users | ❌ Hidden |

### Sample Status (2 States)

| Status | Description | Allowed in Pack |
|--------|-------------|----------------|
| **Active** | Allowed in packs | ✅ Yes |
| **Disabled** | Hidden | ❌ No |

### Visibility Formula

```
Sample Visible = (Pack = Published) AND (Sample = Active)
```

📖 **Full Details:** [PACK_SAMPLE_STATUS_LOGIC.md](./PACK_SAMPLE_STATUS_LOGIC.md)

---

## 🎨 Theme Customization

Customize colors and gradients in:
- `src/config/theme.ts` - Sidebar, header, footer colors
- `src/config/navigation.ts` - Menu item colors

📖 **Full Details:** [THEME_CUSTOMIZATION.md](./THEME_CUSTOMIZATION.md)

---

## 🗂️ Navigation Structure

```
Dashboard
Library (collapsible)
├── Packs
├── Samples
├── Genres
├── Categories
└── Moods
Creators
Users
Plans & Credits (collapsible)
├── Plan tiers
├── Credit rules
├── Trial settings
└── Top-up packs
Announcements (collapsible)
├── Banner
└── Pop-ups
Admin & Roles
Settings
```

All configured in `src/config/navigation.ts`

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui (Radix UI + Tailwind)
- **Icons:** Lucide React
- **State:** SWR for data fetching

### Backend
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage
- **Functions:** Supabase Edge Functions

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `src/config/navigation.ts` | Navigation menu structure |
| `src/config/theme.ts` | Theme colors & gradients |
| `src/pages/admin/Library.tsx` | Library management (unified page with tabs) |
| `src/pages/admin/AdminDashboard.tsx` | Dashboard with KPI widgets |
| `src/components/AppSidebar.tsx` | Main sidebar component |
| `src/components/TopBar.tsx` | Top bar with search & user menu |

---

## 🔐 Row Level Security (RLS)

**Users Table:**
- Admins can view/edit all users
- Regular users can only view their own data

**Packs & Samples:**
- Public read access for Published packs & Active samples
- Admin-only write access

📖 **Database Setup:** See migration files in `supabase/migrations/`

---

## 🚀 Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Run dev server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

📖 **Full Setup:** [QUICKSTART.md](./QUICKSTART.md)

---

## 📚 Documentation Index

| Document | Description |
|----------|-------------|
| [DATA_STRUCTURE.md](./DATA_STRUCTURE.md) | Pack-first architecture, schema, examples |
| [PACK_SAMPLE_STATUS_LOGIC.md](./PACK_SAMPLE_STATUS_LOGIC.md) | Status states, visibility rules, workflows |
| [THEME_CUSTOMIZATION.md](./THEME_CUSTOMIZATION.md) | How to customize colors & gradients |
| [QUICKSTART.md](./QUICKSTART.md) | Setup instructions |
| [TESTING.md](./TESTING.md) | Testing guide |
| [SWR_IMPLEMENTATION.md](./SWR_IMPLEMENTATION.md) | Data fetching patterns |
| [AUTH_SYSTEM_DOCUMENTATION.md](./AUTH_SYSTEM_DOCUMENTATION.md) | Authentication flow |

---

## 🎯 Design Principles

1. **Consistency:** All products follow pack-first pattern
2. **Industry Standard:** Matches Splice, WAVS, Loopcloud
3. **Scalability:** Clean data model supports growth
4. **User Experience:** Intuitive admin workflows
5. **Type Safety:** TypeScript throughout
6. **Mobile First:** Responsive on all devices

---

## 🔄 Common Workflows

### Create New Pack with Samples
1. Navigate to Library → Packs
2. Click "Create New Pack"
3. Fill in pack details (name, creator, genre, etc.)
4. Upload samples to pack
5. Set pack status to "Published"

### Disable a Sample in Published Pack
1. Navigate to Library → Samples
2. Find the sample
3. Click Actions → Disable Sample
4. Sample is now hidden (even though pack is Published)

### Bulk Update Pack Status
1. Navigate to Library → Packs
2. Filter by status (e.g., "Published")
3. Select multiple packs
4. Batch action → Change status

---

## 💡 Best Practices

- ✅ Always create packs before samples
- ✅ Use Disabled status instead of deleting (for archival)
- ✅ Test status changes in non-production first
- ✅ Use filters to manage large libraries
- ✅ Keep pack sample counts accurate
- ❌ Never create orphaned samples
- ❌ Never manually set pack_id to null in database

---

## 🐛 Troubleshooting

### Samples not showing on frontend?
Check: Pack is Published AND Sample is Active

### Can't upload sample?
Ensure you're inside a pack context

### Sidebar not collapsing?
Clear browser cache and check `SidebarProvider` wraps layout

### TypeScript errors?
Run `npm run build` to see all type errors

---

## 📞 Support

For issues, questions, or contributions, refer to the project documentation or contact the development team.
