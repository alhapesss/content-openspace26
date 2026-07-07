-- Jalankan di Supabase SQL Editor. Internal tool, no auth -> RLS dimatikan + open policy.

create table if not exists content_items (
  id text primary key,
  title text not null default '',
  format text default '',
  subformat text default '',
  pillar text default '',
  status text not null default 'Ide',
  date text default '',
  shoot_date text default '',
  shoot_location text default '',
  pic text default '',
  pic_graphic text default '',
  pic_video_editor text default '',
  pic_talent text default '',
  pic_videographer text default '',
  platform text default '',
  script text default '',
  scripts jsonb default '[]',
  assets text default '',
  drive_link text,
  brief_posting text,
  caption text default '',
  notes text default '',
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  saves integer default 0,
  created_at bigint not null,
  approval_status text,
  approved_by text,
  approved_at bigint,
  rejection_reason text
);

create table if not exists accounts (
  platform text primary key,
  followers integer default 0,
  following integer default 0,
  history jsonb default '[]'
);

create table if not exists team_members (
  id text primary key,
  name text not null,
  role text default '',
  phone text
);

create table if not exists notifications (
  id text primary key,
  type text not null,
  title text not null,
  message text not null,
  content_id text,
  read boolean not null default false,
  created_at bigint not null,
  target_date text
);

create table if not exists reminders (
  id text primary key,
  content_id text not null,
  days_before_deadline integer not null default 1,
  enabled boolean not null default true
);

create table if not exists comments (
  id text primary key,
  content_id text not null,
  author_id text not null,
  text text not null,
  created_at bigint not null,
  thread_id text
);

create table if not exists activity (
  id text primary key,
  type text not null,
  content_id text not null,
  actor_id text not null,
  field text,
  old_value text,
  new_value text,
  created_at bigint not null
);

create table if not exists reports (
  id text primary key,
  name text not null,
  type text not null,
  date_range jsonb not null default '[]',
  filters jsonb not null default '{}',
  metrics jsonb not null default '[]',
  created_at bigint not null,
  last_modified bigint not null
);

alter table content_items enable row level security;
alter table accounts enable row level security;
alter table team_members enable row level security;
alter table notifications enable row level security;
alter table reminders enable row level security;
alter table comments enable row level security;
alter table activity enable row level security;
alter table reports enable row level security;

create policy "public full access" on content_items for all using (true) with check (true);
create policy "public full access" on accounts for all using (true) with check (true);
create policy "public full access" on team_members for all using (true) with check (true);
create policy "public full access" on notifications for all using (true) with check (true);
create policy "public full access" on reminders for all using (true) with check (true);
create policy "public full access" on comments for all using (true) with check (true);
create policy "public full access" on activity for all using (true) with check (true);
create policy "public full access" on reports for all using (true) with check (true);

-- Realtime: Supabase Dashboard -> Database -> Publications -> supabase_realtime -> centang semua 8 tabel di atas.

-- ============================================================
-- MIGRASI (kalau database Supabase lu udah pernah dipakai sebelumnya,
-- cukup jalanin blok di bawah ini aja, gak perlu run ulang dari atas):
-- ============================================================
alter table content_items add column if not exists approval_status text;
alter table content_items add column if not exists approved_by text;
alter table content_items add column if not exists approved_at bigint;
alter table content_items add column if not exists rejection_reason text;
