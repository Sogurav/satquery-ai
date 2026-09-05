# SatQuery AI — Backend Schema (Supabase / PostgreSQL)
**Prototype version**

---

## 1. Why Supabase

Postgres database + built-in Auth + Row-Level Security (RLS) out of the box + generous free tier + fast to set up for a prototype. Avoids building custom auth (a common source of the security issues listed in the TRD).

## 2. Tables

### `users`
Handled automatically by Supabase Auth (`auth.users` table) — don't create a custom users table unless you need extra profile fields. If you do, create a `profiles` table linked by `id`:

```sql
create table profiles (
  id uuid references auth.users(id) primary key,
  display_name text,
  created_at timestamp with time zone default now()
);
```

### `queries`
Stores each user query + its result, for history.

```sql
create table queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  mode text not null check (mode in ('single', 'comparison')),
  bbox jsonb not null,           -- [minLon, minLat, maxLon, maxLat]
  dates jsonb not null,           -- ["2015-12-07"] or ["2015-12-07","2026-04-23"]
  question text not null,
  answer text,
  execution_summary jsonb,        -- {task, model_used, parameters}
  metrics jsonb,                  -- {vegetation_t1, vegetation_t2, ...} nullable
  evidence_image_url text,
  created_at timestamp with time zone default now()
);
```

### `images`
Tracks fetched satellite images so they can be reused across follow-up questions without re-fetching.

```sql
create table images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  bbox jsonb not null,
  capture_date date not null,
  image_url text not null,
  source text default 'sentinel-hub',
  created_at timestamp with time zone default now()
);
```

## 3. Row-Level Security (RLS) — MUST enable on every table

```sql
alter table queries enable row level security;
alter table images enable row level security;
alter table profiles enable row level security;

-- Users can only see/insert their own rows
create policy "Users can view own queries"
  on queries for select using (auth.uid() = user_id);

create policy "Users can insert own queries"
  on queries for insert with check (auth.uid() = user_id);

create policy "Users can view own images"
  on images for select using (auth.uid() = user_id);

create policy "Users can insert own images"
  on images for insert with check (auth.uid() = user_id);

create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
```

This directly addresses TRD security item #3 (no RLS) and #4 (frontend-only permission checks) — the database itself enforces ownership, not just the UI.

## 4. Relationships

```
auth.users (1) ──── (many) queries
auth.users (1) ──── (many) images
queries (many) ──── (1) images   [optional: link query to the image(s) it used]
```

If you want to explicitly link queries to the images used (recommended for traceability/evidence):

```sql
alter table queries add column image_ids uuid[] default '{}';
```

## 5. Indexes (for a smoother demo, not critical at prototype scale but cheap to add)

```sql
create index idx_queries_user_id on queries(user_id);
create index idx_images_user_id on images(user_id);
create index idx_queries_created_at on queries(created_at desc);
```

## 6. Notes for the Backend Team

- Never query these tables with raw string-concatenated SQL — use the Supabase client library (`supabase-py` or `supabase-js`), which parameterizes queries automatically (addresses TRD security item #6).
- Always filter by `user_id = auth.uid()` even though RLS enforces it server-side — defense in depth, and makes intent clear in the code.
- Store only what's needed — don't log full image binaries in the database, only URLs (images themselves should live in Supabase Storage or be served from Hugging Face Space / Sentinel Hub directly).
