# Supabase Schema-as-Code for ImageLingo

This directory contains all Supabase database schema, migrations, seed data, and Edge Functions for the ImageLingo project. It enables **schema-as-code** workflows where database changes are version-controlled and automatically deployed.

## Directory Structure

```
supabase/
├── config.toml           # Supabase CLI configuration (local dev settings)
├── migrations/           # SQL migration files (applied in order)
│   └── YYYYMMDDHHMMSS_name.sql
├── seed.sql              # Sample data for local/preview environments
├── functions/            # Supabase Edge Functions (Deno)
│   └── _shared/          # Shared code for functions
├── tests/                # Database tests
└── README.md             # This file
```

## How Migrations Work

### Overview

Migrations are SQL files that modify your database schema. Supabase tracks which migrations have been applied in a `schema_migrations` table and only runs **new/unapplied migrations** in order.

```
Migration Flow:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  001_init   │ -> │  002_users  │ -> │  003_tasks  │
│  (applied)  │    │  (applied)  │    │  (pending)  │
└─────────────┘    └─────────────┘    └─────────────┘
                                            ↑
                                      Will be applied
                                      on next db push
```

### Key Behaviors

| Scenario | Behavior |
|----------|----------|
| New migration added | Applied automatically on `supabase db push` or PR preview |
| Migration already applied | Skipped (tracked in `schema_migrations`) |
| Migration file modified | ⚠️ **Not re-run!** Never modify applied migrations |
| Migration file deleted | ⚠️ **Causes drift!** Never delete applied migrations |

### Migration Naming Convention

```
YYYYMMDDHHMMSS_short_description.sql
└──────┬──────┘ └───────┬────────┘
   Timestamp      Snake case name
   (UTC)          (describes change)
```

**Examples:**
```
20251223071008_init.sql
20251224120000_add_user_preferences.sql
20251225093045_create_teams_table.sql
20251226150000_add_index_on_projects_name.sql
```

## Creating New Migrations

### Method 1: Supabase CLI (Recommended)

```bash
# Create a new empty migration file
supabase migration new add_user_preferences

# This creates: supabase/migrations/YYYYMMDDHHMMSS_add_user_preferences.sql
```

### Method 2: Generate from Diff

If you made changes in Supabase Studio or directly in the database:

```bash
# Generate migration from local database changes
supabase db diff -f add_user_preferences

# Or compare against remote
supabase db diff --linked -f add_user_preferences
```

### Method 3: Manual Creation

```bash
# Create file with UTC timestamp
touch supabase/migrations/$(date -u +%Y%m%d%H%M%S)_my_change.sql
```

## ⚠️ Critical Rules

### 1. Never Modify Applied Migrations

Once a migration has been applied (locally, in preview, or production), **never edit it**. Instead, create a new migration to make changes.

```sql
-- ❌ BAD: Editing 20251223_init.sql after it's applied
-- ✅ GOOD: Create 20251224_fix_something.sql with the fix
```

### 2. Never Delete Migrations

Deleting a migration that has been applied will cause schema drift between environments.

### 3. No Manual Dashboard Changes Without Migrations

If you make schema changes in the Supabase Dashboard:

1. Pull the changes: `supabase db pull`
2. Review the generated migration
3. Commit to git
4. Push to apply to other environments

### 4. Migrations Should Be Safe

- Use `IF NOT EXISTS` for creating objects (when appropriate)
- Use `IF EXISTS` for dropping objects
- Consider data migrations carefully (backfill scripts)

## Local Development

### Prerequisites

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### Getting Started

```bash
# 1. Start local Supabase stack (Postgres, Auth, Storage, etc.)
supabase start

# 2. Apply migrations and seed data
supabase db reset

# 3. Access local services:
#    - Studio:    http://localhost:54323
#    - API:       http://localhost:54321
#    - Database:  postgresql://postgres:postgres@localhost:54322/postgres
#    - Inbucket:  http://localhost:54324 (email testing)
```

### Common Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database (reapply all migrations + seed)
supabase db reset

# Apply pending migrations only
supabase db push

# Pull remote schema changes
supabase db pull

# Generate TypeScript types
supabase gen types typescript --local > lib/database.types.ts

# Create new migration
supabase migration new <name>

# View migration status
supabase migration list

# Link to remote project
supabase link --project-ref <project-id>
```

## PR Preview Workflow (Supabase Branching)

When you open a Pull Request, Supabase Branching automatically:

```
┌─────────────────────────────────────────────────────────────────┐
│                        PR Opened                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. Create Preview Branch Database                              │
│     - Fresh Postgres instance                                   │
│     - Isolated from production                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Apply Migrations                                            │
│     - Reads supabase/migrations/                                │
│     - Applies in timestamp order                                │
│     - Only NEW migrations (not already in schema_migrations)    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. Run Seed File (Optional)                                    │
│     - Executes supabase/seed.sql                                │
│     - Only on initial branch creation                           │
│     - NOT on subsequent commits                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. Deploy Edge Functions                                       │
│     - Deploys functions from supabase/functions/                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Update Vercel Preview                                       │
│     - Injects preview branch credentials                        │
│     - NEXT_PUBLIC_SUPABASE_URL                                  │
│     - NEXT_PUBLIC_SUPABASE_ANON_KEY                             │
└─────────────────────────────────────────────────────────────────┘
```

### Preview Branch Behavior

| What | Behavior |
|------|----------|
| Production data | ❌ **Not copied** (security) |
| Migrations | ✅ Applied in order |
| Seed data | ✅ Run once on branch creation |
| Edge Functions | ✅ Deployed from repo |
| Auth config | ✅ Uses `config.toml` settings |
| Storage buckets | ✅ Created fresh |

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends auth.users) |
| `projects` | Workspaces for organizing images |
| `images` | Uploaded image metadata |
| `generations` | AI generation/processing runs |
| `subscriptions` | User subscription plans |

### Entity Relationship

```
auth.users (Supabase managed)
    │
    ├─── profiles (1:1)
    │
    ├─── projects (1:N)
    │        │
    │        ├─── images (1:N)
    │        │
    │        └─── generations (1:N)
    │
    └─── subscriptions (1:1)
```

### Row Level Security (RLS)

All tables have RLS enabled with these policies:

| Table | Policy |
|-------|--------|
| `profiles` | Users can read all profiles, update only their own |
| `projects` | Owner can CRUD their projects |
| `images` | Owner of parent project can CRUD |
| `generations` | Owner of parent project can CRUD |
| `subscriptions` | Users can only access their own |

## Seed Data

The `seed.sql` file provides sample data for development:

- **When it runs**: During `supabase db reset` or preview branch creation
- **What it creates**: Demo projects, images, and generations for the first user
- **Important**: It requires at least one auth.users entry (create via signup)

### Testing with Seed Data

```bash
# 1. Reset database
supabase db reset

# 2. Create a test user via Studio (http://localhost:54323)
#    Go to Authentication > Users > Create user

# 3. Reset again to populate seed data
supabase db reset
```

## Edge Functions

Edge Functions are serverless Deno functions deployed to Supabase's edge network.

### Creating a Function

```bash
# Create new function
supabase functions new process-image

# This creates:
# supabase/functions/process-image/index.ts
```

### Function Structure

```
supabase/functions/
├── _shared/           # Shared code (not deployed)
│   ├── cors.ts
│   └── supabase.ts
├── process-image/
│   └── index.ts
└── translate-text/
    └── index.ts
```

### Deploying Functions

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy process-image

# Deploy with secrets
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase functions deploy
```

## TypeScript Types

Generate types from your database schema:

```bash
# From local database
supabase gen types typescript --local > lib/database.types.ts

# From remote database
supabase gen types typescript --linked > lib/database.types.ts
```

Usage in code:

```typescript
import { Database } from '@/lib/database.types'

type Project = Database['public']['Tables']['projects']['Row']
type NewProject = Database['public']['Tables']['projects']['Insert']
```

## Troubleshooting

### Migration Failed

```bash
# Check migration status
supabase migration list

# View logs
supabase db push --debug

# Reset and retry (loses local data)
supabase db reset
```

### Preview Branch Issues

1. Check GitHub Actions logs for errors
2. Verify `supabase/` directory is committed
3. Check Supabase Dashboard for branch status
4. Try closing and reopening the PR

### Schema Drift

If local and remote schemas diverge:

```bash
# Pull remote changes
supabase db pull

# Review generated migration
# Commit if correct
```

## Security Notes

- **Never commit secrets** to this repository
- Use environment variables for API keys
- `config.toml` contains only non-sensitive configuration
- Service role key should only be used server-side
- All tables have RLS enabled by default

## Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Database Migrations](https://supabase.com/docs/guides/local-development/cli/managing-migrations)
- [Branching Guide](https://supabase.com/docs/guides/deployment/branching)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
