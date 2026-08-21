// Postgres pool + idempotent boot-time migrations.
// Same pattern as Drop the dataBASE: every statement is safe to run on every
// boot, so there is no migration state table and no separate migrate step —
// `node server.js` is the whole deploy.
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

const MIGRATIONS = `
-- ── Auth ────────────────────────────────────────────────────────────────
create table if not exists users (
  id serial primary key,
  email text not null unique,
  password_hash text not null,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- ── Public forms ────────────────────────────────────────────────────────
create table if not exists inquiries (
  id serial primary key,
  name text not null,
  email text not null,
  phone text,
  dancer_name text,
  dancer_age text,
  interest text,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists trial_bookings (
  id serial primary key,
  parent_name text not null,
  email text not null,
  phone text,
  dancer_name text not null,
  dancer_age integer not null,
  class_slug text not null,
  notes text,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create table if not exists newsletter_subs (
  id serial primary key,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists career_apps (
  id serial primary key,
  name text not null,
  email text not null,
  role text,
  message text,
  created_at timestamptz not null default now()
);

-- ── Parent portal ───────────────────────────────────────────────────────
create table if not exists dancers (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  name text not null,
  birth_year integer,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists dancers_user_id_idx on dancers (user_id);

create table if not exists enrollments (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  dancer_id integer not null references dancers(id) on delete cascade,
  class_slug text not null,
  status text not null default 'enrolled',
  created_at timestamptz not null default now(),
  unique (dancer_id, class_slug)
);
create index if not exists enrollments_user_id_idx on enrollments (user_id);

create table if not exists payments (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  amount_cents integer not null,
  method text not null default 'card',
  note text,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_id_idx on payments (user_id);

create table if not exists waivers (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  signer_name text not null,
  signed_at timestamptz not null default now()
);
create index if not exists waivers_user_id_idx on waivers (user_id);

create table if not exists makeup_requests (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  dancer_id integer references dancers(id) on delete set null,
  missed_class text,
  preferred_makeup text,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists makeup_requests_user_id_idx on makeup_requests (user_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(MIGRATIONS);
    await client.query("commit");
    console.log("[db] migrations applied (idempotent)");
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query, migrate };
