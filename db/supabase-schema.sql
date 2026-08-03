-- ============================================================
-- Aisyah — skema Supabase
-- ============================================================

-- ---------- 1. JENIS ----------
create type peranan as enum ('peniaga','pembeli','ngo','sukarelawan');
create type status_item as enum ('aktif','derma','terjual','ditarik');
create type status_tugas as enum ('Baharu','Accepted','Collected','Delivered');

-- ---------- 2. PROFIL PENGGUNA ----------
-- auth.users hanya tahu "siapa". Jadual ini yang tahu "peranan apa".
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  nama        text not null default 'Pengguna',
  role        peranan not null default 'pembeli',
  telefon     text,
  created_at  timestamptz not null default now()
);

-- Profil dijana automatik setiap kali ada pendaftaran baharu.
-- Peranan diambil dari metadata semasa signUp().
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nama, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::peranan, 'pembeli')
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Fungsi bantuan: peranan pengguna semasa
create function my_role() returns peranan
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

-- ---------- 3. KEDAI ----------
create table merchants (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null references profiles(id) on delete cascade,
  nama      text not null,
  kawasan   text,
  lat       double precision,
  lng       double precision
);

-- ---------- 4. ITEM ----------
-- PENTING: tiada kolum harga_diskaun. Harga dikira, bukan disimpan.
create table items (
  id           uuid primary key default gen_random_uuid(),
  merchant_id  uuid not null references merchants(id) on delete cascade,
  nama         text not null,
  emoji        text default '🍽️',
  kategori     text,
  qty          int  not null check (qty >= 0),
  harga_asal   numeric(8,2) not null check (harga_asal > 0),
  expires_at   timestamptz not null,
  status       status_item not null default 'aktif',
  created_at   timestamptz not null default now()
);
create index on items (status, expires_at);

-- ---------- 5. HARGA DINAMIK (dikira semasa dibaca) ----------
create function lampu_item(expires_at timestamptz, status status_item)
returns text language sql stable as $$
  select case
    when status <> 'aktif' then 'mati'
    when expires_at <= now() then 'mati'
    when expires_at <= now() + interval '4 hours'  then 'merah'
    when expires_at <= now() + interval '12 hours' then 'kuning'
    else 'hijau'
  end
$$;

create view v_items as
select
  i.*,
  m.nama    as kedai,
  m.kawasan,
  m.lat, m.lng,
  lampu_item(i.expires_at, i.status) as lampu,
  round(i.harga_asal * case lampu_item(i.expires_at, i.status)
    when 'kuning' then 0.70
    when 'merah'  then 0.30
    when 'mati'   then 0.00
    else 1.00 end, 2) as harga_kini,
  extract(epoch from (i.expires_at - now()))/3600 as jam_baki
from items i
join merchants m on m.id = i.merchant_id;

-- ---------- 6. TEMPAHAN ----------
create table orders (
  id          uuid primary key default gen_random_uuid(),
  kod         text unique not null default 'SG-' || lpad((floor(random()*9000)+1000)::text, 4, '0'),
  item_id     uuid not null references items(id),
  buyer_id    uuid not null references profiles(id),
  qty         int not null default 1,
  harga_bayar numeric(8,2) not null,   -- harga dikunci pada saat tempahan
  cara        text not null check (cara in ('pickup','delivery')),
  status      text not null default 'Menunggu pickup',
  created_at  timestamptz not null default now()
);

-- Tolak stok secara atomik supaya tak boleh oversell
create function buat_tempahan(p_item uuid, p_cara text)
returns orders language plpgsql security definer set search_path = public as $$
declare v_harga numeric(8,2); v_order orders;
begin
  select harga_kini into v_harga from v_items where id = p_item and status = 'aktif' and qty > 0;
  if v_harga is null then raise exception 'Barang tidak lagi tersedia'; end if;

  update items set qty = qty - 1,
    status = case when qty - 1 <= 0 then 'terjual' else status end
  where id = p_item;

  insert into orders (item_id, buyer_id, harga_bayar, cara)
  values (p_item, auth.uid(), v_harga, p_cara)
  returning * into v_order;
  return v_order;
end $$;

-- ---------- 7. DERMA ----------
create table donations (
  id           uuid primary key default gen_random_uuid(),
  item_id      uuid not null references items(id) on delete cascade,
  ngo_id       uuid references profiles(id),
  requested_at timestamptz,
  auto         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Item bertukar status 'derma' -> baris derma dicipta sendiri
create function on_item_derma() returns trigger
language plpgsql as $$
begin
  if new.status = 'derma' and old.status <> 'derma' then
    insert into donations (item_id) values (new.id);
  end if;
  return new;
end $$;

create trigger trg_item_derma
  after update on items
  for each row execute function on_item_derma();

-- ---------- 8. TUGASAN SUKARELAWAN ----------
create table tasks (
  id           uuid primary key default gen_random_uuid(),
  donation_id  uuid not null references donations(id) on delete cascade,
  volunteer_id uuid references profiles(id),
  status       status_tugas not null default 'Baharu',
  accepted_at  timestamptz,
  collected_at timestamptz,
  delivered_at timestamptz,
  created_at   timestamptz not null default now()
);

-- NGO tekan "Request Donation" -> tugasan pickup terbuka
create function minta_derma(p_donation uuid)
returns tasks language plpgsql security definer set search_path = public as $$
declare v_task tasks;
begin
  if my_role() <> 'ngo' then raise exception 'Hanya NGO boleh minta derma'; end if;
  update donations set ngo_id = auth.uid(), requested_at = now()
    where id = p_donation and requested_at is null;
  if not found then raise exception 'Derma sudah dituntut'; end if;
  insert into tasks (donation_id) values (p_donation) returning * into v_task;
  return v_task;
end $$;

-- ---------- 9. AUTO-DERMA BILA LUPUT ----------
create function sapu_luput() returns void
language sql security definer set search_path = public as $$
  update items set status = 'derma'
  where status = 'aktif' and expires_at <= now();
$$;

-- Jadualkan setiap 5 minit (aktifkan extension pg_cron dahulu di Database > Extensions)
select cron.schedule('sapu-luput', '*/5 * * * *', $$select sapu_luput()$$);

-- ---------- 10. ROW LEVEL SECURITY ----------
-- Ini yang menjadikan peranan itu nyata. Tanpa ini, sesiapa boleh edit apa saja.
alter table profiles  enable row level security;
alter table merchants enable row level security;
alter table items     enable row level security;
alter table orders    enable row level security;
alter table donations enable row level security;
alter table tasks     enable row level security;

-- profiles: baca profil sendiri, kemas kini profil sendiri
create policy p_self on profiles for select using (id = auth.uid());
create policy p_self_upd on profiles for update using (id = auth.uid());

-- merchants: semua boleh lihat, hanya pemilik boleh urus
create policy m_read on merchants for select to authenticated using (true);
create policy m_own  on merchants for all using (owner_id = auth.uid());

-- items: semua boleh lihat barang aktif; hanya peniaga pemilik boleh tulis
create policy i_read on items for select to authenticated using (true);
create policy i_write on items for all using (
  merchant_id in (select id from merchants where owner_id = auth.uid())
);

-- orders: pembeli nampak tempahan sendiri, peniaga nampak tempahan barangnya
create policy o_buyer on orders for select using (buyer_id = auth.uid());
create policy o_merchant on orders for select using (
  item_id in (select i.id from items i join merchants m on m.id = i.merchant_id
              where m.owner_id = auth.uid())
);

-- donations: NGO nampak semua, peniaga nampak dermanya sendiri
create policy d_ngo on donations for select using (my_role() = 'ngo');
create policy d_merchant on donations for select using (
  item_id in (select i.id from items i join merchants m on m.id = i.merchant_id
              where m.owner_id = auth.uid())
);

-- tasks: sukarelawan nampak tugasan terbuka + miliknya, dan boleh kemas kini miliknya
create policy t_read on tasks for select using (
  my_role() in ('sukarelawan','ngo') or volunteer_id = auth.uid()
);
create policy t_claim on tasks for update using (
  my_role() = 'sukarelawan' and (volunteer_id is null or volunteer_id = auth.uid())
);

-- ---------- 11. REALTIME ----------
-- Supaya skrin NGO dan Sukarelawan berubah sendiri tanpa refresh
alter publication supabase_realtime add table items, donations, tasks, orders;
