-- =====================================================
-- FITMANAGER - Schéma Supabase
-- À coller dans : Supabase > SQL Editor > New Query
-- =====================================================

create extension if not exists "uuid-ossp";

-- Table des salles de sport
create table gyms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  phone text,
  logo_url text,
  created_at timestamp with time zone default now()
);

-- Table des gérants / coachs / réceptionnistes
create table managers (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid references gyms(id) on delete cascade,
  email text unique not null,
  password_hash text not null,
  full_name text not null,
  role text check (role in ('owner', 'coach', 'receptionist')) default 'owner',
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Plans d'abonnement de chaque salle
create table subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid references gyms(id) on delete cascade,
  name text not null,           -- ex: "Mensuel", "Trimestriel", "Annuel"
  duration_days integer not null, -- 30, 90, 365
  price decimal(10,2) not null,   -- en FCFA
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Membres de la salle
create table members (
  id uuid primary key default uuid_generate_v4(),
  gym_id uuid references gyms(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  photo_url text,
  qr_code text unique default uuid_generate_v4()::text,
  registration_date date default current_date,
  notes text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Abonnements (actifs + historique)
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  plan_id uuid references subscription_plans(id),
  gym_id uuid references gyms(id) on delete cascade,
  start_date date not null default current_date,
  end_date date not null,
  status text check (status in ('active', 'expired', 'cancelled')) default 'active',
  amount_paid decimal(10,2) not null,
  payment_method text check (payment_method in ('cash', 'flooz', 'tmoney', 'card')) default 'cash',
  payment_ref text,             -- référence CinetPay/PayDunya si mobile money
  created_by uuid references managers(id),
  created_at timestamp with time zone default now()
);

-- Check-ins (présences à l'entrée)
create table checkins (
  id uuid primary key default uuid_generate_v4(),
  member_id uuid references members(id) on delete cascade,
  gym_id uuid references gyms(id) on delete cascade,
  checked_in_at timestamp with time zone default now(),
  checked_in_by uuid references managers(id)
);

-- =====================================================
-- INDEXES pour les performances
-- =====================================================
create index idx_managers_gym_id on managers(gym_id);
create index idx_managers_email on managers(email);
create index idx_members_gym_id on members(gym_id);
create index idx_members_phone on members(phone);
create index idx_members_qr_code on members(qr_code);
create index idx_subscriptions_member_id on subscriptions(member_id);
create index idx_subscriptions_gym_id on subscriptions(gym_id);
create index idx_subscriptions_status on subscriptions(status);
create index idx_subscriptions_end_date on subscriptions(end_date);
create index idx_checkins_member_id on checkins(member_id);
create index idx_checkins_gym_id on checkins(gym_id);

-- =====================================================
-- RLS (Row Level Security) - désactivé pour usage via service_key
-- À activer plus tard si on passe à Supabase Auth
-- =====================================================
alter table gyms disable row level security;
alter table managers disable row level security;
alter table subscription_plans disable row level security;
alter table members disable row level security;
alter table subscriptions disable row level security;
alter table checkins disable row level security;
