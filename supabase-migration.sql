-- Run this in Supabase SQL Editor. Safe to run even if some columns already exist.

alter table habits add column if not exists category text not null default 'personal';
alter table habits add column if not exists is_bad_habit boolean not null default false;
alter table habits add column if not exists is_essential boolean not null default false;

alter table habit_logs add column if not exists note text;

alter table checkins add column if not exists tag text not null default 'neutral';
