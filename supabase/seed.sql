-- Seed test data for Circulo
-- Run after: a user signs up at test@circulo.app via the app (which auto-creates a profile)
-- Idempotent: each circle checks existence by name before inserting

do $$
declare
  v_profile_id   uuid;
  v_now          timestamptz := now();

  -- circle IDs
  v_makati_id    uuid;
  v_quezon_id    uuid;
  v_baguio_id    uuid;
  v_davao_id     uuid;
  v_cebu_id      uuid;

  -- member IDs (we'll reuse patterns across circles)
  v_creator_id   uuid;
  v_ari_id       uuid;
  v_bea_id       uuid;
  v_carlo_id     uuid;
  v_dina_id      uuid;
  v_enzo_id      uuid;

  -- round IDs
  v_round1       uuid;
  v_round2       uuid;
  v_round3       uuid;
  v_round4       uuid;
  v_round5       uuid;

  -- contribution IDs
  v_contrib1     uuid;
  v_contrib2     uuid;
  v_contrib3     uuid;
  v_contrib4     uuid;
  v_contrib5     uuid;

  -- payout IDs
  v_payout1      uuid;
  v_payout2      uuid;
  v_payout3      uuid;
  v_payout4      uuid;
  v_payout5      uuid;
begin

  -- Look up the test user profile
  select id into v_profile_id
  from public.profiles
  where email = 'test@circulo.app'
  order by created_at desc
  limit 1;

  if v_profile_id is null then
    raise notice 'No profile found for test@circulo.app — sign up via the app first, then re-run seed.';
    return;
  end if;

  raise notice 'Seeding data for profile: %', v_profile_id;

  -- =========================================================================
  -- CIRCLE 1: Makati Friday Circle (active, round 2/5, one member late)
  -- =========================================================================

  if not exists (select 1 from public.circles where name = 'Makati Friday Circle' and creator_id = v_profile_id) then
    v_makati_id := gen_random_uuid();

    insert into public.circles (id, creator_id, name, status, contribution_amount, contribution_asset, interval_seconds, member_count, max_member_count, collateral_amount, grace_period_hours, slash_percentage, warning_threshold, auto_slash_enabled, payout_order_mode, reminder_schedule_hours, current_round, total_rounds, start_date, settings_locked, payout_order_locked, rules_locked)
    values (v_makati_id, v_profile_id, 'Makati Friday Circle', 'active', 10, 'USDC', 86400, 5, 10, 5, 4, 100, 2, true, 'creator', '{24,1}', 2, 5, '2026-07-08T12:00:00Z', true, true, true);

    -- members
    v_ari_id   := gen_random_uuid();
    v_bea_id   := gen_random_uuid();
    v_carlo_id := gen_random_uuid();
    v_dina_id  := gen_random_uuid();
    v_enzo_id  := gen_random_uuid();

    insert into public.circle_members (id, circle_id, profile_id, display_name, wallet_address, role, invite_status, agreement_status, collateral_status, payment_status, payout_round, restriction_status, late_count, slashed_amount, joined_at)
    values
      (v_ari_id,   v_makati_id, v_profile_id, 'Ari Santos',  'GABC91A2CREATOR000000000000000000000000000000000000000001', 'creator', 'accepted', 'accepted', 'posted',           'paid',    1, 'clear',      0, 0,   '2026-07-08T10:05:00Z'),
      (v_bea_id,   v_makati_id, null,         'Bea Lim',     'GDEF22FPENDING000000000000000000000000000000000000000002', 'member',  'accepted', 'accepted', 'posted',           'pending', 2, 'clear',      0, 0,   '2026-07-08T10:15:00Z'),
      (v_carlo_id, v_makati_id, null,         'Carlo Reyes', 'GHIJ8KQLATE00000000000000000000000000000000000000000003',    'member',  'accepted', 'accepted', 'partially_slashed','late',    3, 'warning',    1, 2.5, '2026-07-08T10:20:00Z'),
      (v_dina_id,  v_makati_id, null,         'Dina Cruz',   'GKLM44DPOSTED000000000000000000000000000000000000000004',    'member',  'invited',  'pending',  'not_posted',       'not_due', 4, 'clear',      0, 0,   null),
      (v_enzo_id,  v_makati_id, null,         'Enzo Tan',    'GNOP55ERESTRICTED00000000000000000000000000000000000005',    'member',  'expired',  'pending',  'fully_slashed',    'missed',  5, 'restricted', 2, 5,   null);

    -- rounds
    v_round1 := gen_random_uuid();
    v_round2 := gen_random_uuid();
    v_round3 := gen_random_uuid();
    v_round4 := gen_random_uuid();
    v_round5 := gen_random_uuid();

    insert into public.circle_rounds (id, circle_id, round_number, due_at, payout_member_id, expected_amount, collected_amount, status)
    values
      (v_round1, v_makati_id, 1, '2026-07-08T12:00:00Z', v_ari_id,   50, 50, 'completed'),
      (v_round2, v_makati_id, 2, '2026-07-09T12:00:00Z', v_bea_id,   50, 20, 'late'),
      (v_round3, v_makati_id, 3, '2026-07-10T12:00:00Z', v_carlo_id, 50, 0,  'scheduled'),
      (v_round4, v_makati_id, 4, '2026-07-11T12:00:00Z', v_dina_id,  50, 0,  'scheduled'),
      (v_round5, v_makati_id, 5, '2026-07-12T12:00:00Z', v_enzo_id,  50, 0,  'scheduled');

    -- contributions (round 2)
    v_contrib1 := gen_random_uuid();
    v_contrib2 := gen_random_uuid();
    v_contrib3 := gen_random_uuid();
    v_contrib4 := gen_random_uuid();
    v_contrib5 := gen_random_uuid();

    insert into public.circle_contributions (id, circle_id, round_id, member_id, amount_due, status, tx_hash, paid_at, slashed_amount, slashed_at, reminders_sent)
    values
      (v_contrib1, v_makati_id, v_round2, v_ari_id,   10, 'paid',         'tx_paid_91a2',  '2026-07-08T14:05:00Z',  0,   null,                       0),
      (v_contrib2, v_makati_id, v_round2, v_bea_id,   10, 'pending',      null,            null,                     0,   null,                       1),
      (v_contrib3, v_makati_id, v_round2, v_carlo_id, 10, 'late',         null,            null,                     2.5, '2026-07-09T20:05:00Z',     2),
      (v_contrib4, v_makati_id, v_round2, v_dina_id,  10, 'grace_period', null,            null,                     0,   null,                       1),
      (v_contrib5, v_makati_id, v_round2, v_enzo_id,  10, 'missed',       null,            null,                     5,   '2026-07-09T20:05:00Z',     2);

    -- payouts
    v_payout1 := gen_random_uuid();
    v_payout2 := gen_random_uuid();
    v_payout3 := gen_random_uuid();
    v_payout4 := gen_random_uuid();
    v_payout5 := gen_random_uuid();

    insert into public.payout_schedule (id, circle_id, round_number, recipient_member_id, payout_amount, expected_payout_at, withheld_amount, status, tx_hash)
    values
      (v_payout1, v_makati_id, 1, v_ari_id,   50,  '2026-07-08T16:00:00Z', 0,   'paid',      'tx_payout_91a2'),
      (v_payout2, v_makati_id, 2, v_bea_id,   52.5,'2026-07-09T16:00:00Z', 0,   'ready',     null),
      (v_payout3, v_makati_id, 3, v_carlo_id, 47.5,'2026-07-10T16:00:00Z', 2.5, 'scheduled', null),
      (v_payout4, v_makati_id, 4, v_dina_id,  50,  '2026-07-11T16:00:00Z', 0,   'delayed',   null),
      (v_payout5, v_makati_id, 5, v_enzo_id,  50,  '2026-07-12T16:00:00Z', 0,   'disputed',  null);

    -- audit events
    insert into public.audit_events (id, circle_id, member_id, event_type, round_number, tx_hash, created_at)
    values
      (gen_random_uuid(), v_makati_id, v_ari_id,   'pool_created',       null, null,                '2026-07-08T10:00:00Z'),
      (gen_random_uuid(), v_makati_id, v_ari_id,   'circle_activated',   null, null,                '2026-07-08T10:15:00Z'),
      (gen_random_uuid(), v_makati_id, v_bea_id,   'agreement_accepted',  null,null,                '2026-07-08T10:25:00Z'),
      (gen_random_uuid(), v_makati_id, v_bea_id,   'collateral_posted',   null,'tx_collateral_22f', '2026-07-08T10:35:00Z'),
      (gen_random_uuid(), v_makati_id, null,        'round_started',       2,   null,                '2026-07-09T12:00:00Z'),
      (gen_random_uuid(), v_makati_id, v_ari_id,   'contribution_paid',   2,   'tx_paid_91a2',      '2026-07-09T14:05:00Z'),
      (gen_random_uuid(), v_makati_id, v_carlo_id, 'grace_period_started',2,   null,                '2026-07-09T18:00:00Z'),
      (gen_random_uuid(), v_makati_id, v_carlo_id, 'reminder_sent',       2,   null,                '2026-07-09T19:00:00Z'),
      (gen_random_uuid(), v_makati_id, v_carlo_id, 'collateral_slashed',  2,   'tx_slash_8kq',      '2026-07-09T20:05:00Z'),
      (gen_random_uuid(), v_makati_id, v_enzo_id,  'member_restricted',   1,   null,                '2026-07-09T20:15:00Z');

    -- notifications
    insert into public.member_notifications (id, circle_id, profile_id, member_id, notification_type, title, body, read_at, created_at)
    values
      (gen_random_uuid(), v_makati_id, v_profile_id, v_ari_id,  'circle_activated',     'Circle activated',    'Makati Friday Circle is now active. Round 1 due Jul 8.',          '2026-07-08T10:16:00Z', '2026-07-08T10:15:00Z'),
      (gen_random_uuid(), v_makati_id, v_profile_id, v_ari_id,  'contribution_due_now', 'Contribution due now', 'Your 10 USDC contribution is due for round 2.',                    null,                    '2026-07-09T12:00:00Z'),
      (gen_random_uuid(), v_makati_id, v_profile_id, v_bea_id,  'contribution_due_now', 'Contribution due now', 'Your 10 USDC contribution is due for round 2.',                    null,                    '2026-07-09T12:00:00Z'),
      (gen_random_uuid(), v_makati_id, null,         v_carlo_id,'grace_period_warning', 'Grace period active',  'You are in the 4-hour grace period for round 2. Pay to avoid slash.',null,                   '2026-07-09T18:00:00Z'),
      (gen_random_uuid(), v_makati_id, null,         v_carlo_id,'collateral_slashed',   'Collateral slashed',   '2.5 USDC was slashed from your collateral for missing round 2.',   null,                    '2026-07-09T20:05:00Z'),
      (gen_random_uuid(), v_makati_id, null,         v_enzo_id, 'member_restricted',    'Account restricted',   'You have been restricted from creating or joining future circles.',null,                    '2026-07-09T20:16:00Z');
  end if;

  -- =========================================================================
  -- CIRCLE 2: Quezon Draft Circle (draft, no members accepted, nothing locked)
  -- =========================================================================

  if not exists (select 1 from public.circles where name = 'Quezon Draft Circle' and creator_id = v_profile_id) then
    v_quezon_id := gen_random_uuid();

    insert into public.circles (id, creator_id, name, status, contribution_amount, contribution_asset, interval_seconds, member_count, max_member_count, collateral_amount, grace_period_hours, slash_percentage, warning_threshold, auto_slash_enabled, payout_order_mode, reminder_schedule_hours, current_round, total_rounds, start_date, settings_locked, payout_order_locked, rules_locked)
    values (v_quezon_id, v_profile_id, 'Quezon Draft Circle', 'draft', 25, 'USDC', 604800, 4, 8, 12.5, 6, 75, 3, true, 'creator', '{48,6}', 0, 4, null, false, false, false);

    insert into public.circle_members (id, circle_id, profile_id, display_name, wallet_address, role, invite_status, agreement_status, collateral_status, payment_status, payout_round, restriction_status, late_count, slashed_amount, joined_at)
    values
      (gen_random_uuid(), v_quezon_id, v_profile_id, 'Ari Santos', 'GABC91A2CREATOR000000000000000000000000000000000000000001', 'creator', 'accepted', 'accepted', 'not_posted', 'not_due', 1, 'clear', 0, 0, null);
  end if;

  -- =========================================================================
  -- CIRCLE 3: Baguio Co-op Circle (active, all paying on time, smooth)
  -- =========================================================================

  if not exists (select 1 from public.circles where name = 'Baguio Co-op Circle' and creator_id = v_profile_id) then
    v_baguio_id := gen_random_uuid();
    v_ari_id    := gen_random_uuid();
    v_bea_id    := gen_random_uuid();
    v_carlo_id  := gen_random_uuid();
    v_dina_id   := gen_random_uuid();
    v_enzo_id   := gen_random_uuid();

    insert into public.circles (id, creator_id, name, status, contribution_amount, contribution_asset, interval_seconds, member_count, max_member_count, collateral_amount, grace_period_hours, slash_percentage, warning_threshold, auto_slash_enabled, payout_order_mode, reminder_schedule_hours, current_round, total_rounds, start_date, settings_locked, payout_order_locked, rules_locked)
    values (v_baguio_id, v_profile_id, 'Baguio Co-op Circle', 'active', 15, 'USDT', 604800, 6, 10, 7.5, 6, 80, 2, true, 'creator', '{24,1}', 3, 6, '2026-06-01T08:00:00Z', true, true, true);

    insert into public.circle_members (id, circle_id, profile_id, display_name, wallet_address, role, invite_status, agreement_status, collateral_status, payment_status, payout_round, restriction_status, late_count, slashed_amount, joined_at)
    values
      (v_ari_id,   v_baguio_id, v_profile_id, 'Ari Santos',  'GABC91A2CREATOR000000000000000000000000000000000000000001', 'creator', 'accepted', 'accepted', 'posted', 'paid',    1, 'clear', 0, 0, '2026-06-01T08:05:00Z'),
      (v_bea_id,   v_baguio_id, null,         'Bea Lim',     'GDEF22FPENDING000000000000000000000000000000000000000002', 'member',  'accepted', 'accepted', 'posted', 'paid',    2, 'clear', 0, 0, '2026-06-01T08:10:00Z'),
      (v_carlo_id, v_baguio_id, null,         'Carlo Reyes', 'GHIJ8KQLATE00000000000000000000000000000000000000000003',    'member',  'accepted', 'accepted', 'posted', 'paid',    3, 'clear', 0, 0, '2026-06-01T08:15:00Z'),
      (v_dina_id,  v_baguio_id, null,         'Dina Cruz',   'GKLM44DPOSTED000000000000000000000000000000000000000004',    'member',  'accepted', 'accepted', 'posted', 'paid',    4, 'clear', 0, 0, '2026-06-01T08:20:00Z'),
      (v_enzo_id,  v_baguio_id, null,         'Enzo Tan',    'GNOP55ERESTRICTED00000000000000000000000000000000000005',    'member',  'accepted', 'accepted', 'posted', 'paid',    5, 'clear', 0, 0, '2026-06-01T08:25:00Z'),
      (gen_random_uuid(), v_baguio_id, null,   'Fina Garcia', 'GXYZ77FMEMBER00000000000000000000000000000000000000000006',  'member',  'accepted', 'accepted', 'posted', 'not_due', 6, 'clear', 0, 0, '2026-06-01T08:30:00Z');

    -- rounds 1-2 completed, round 3 active
    v_round1 := gen_random_uuid(); v_round2 := gen_random_uuid();
    v_round3 := gen_random_uuid(); v_round4 := gen_random_uuid();
    v_round5 := gen_random_uuid();

    insert into public.circle_rounds (id, circle_id, round_number, due_at, payout_member_id, expected_amount, collected_amount, status)
    values
      (v_round1, v_baguio_id, 1, '2026-06-08T08:00:00Z', v_ari_id,   90, 90, 'completed'),
      (v_round2, v_baguio_id, 2, '2026-06-15T08:00:00Z', v_bea_id,   90, 90, 'completed'),
      (v_round3, v_baguio_id, 3, '2026-06-22T08:00:00Z', v_carlo_id, 90, 60, 'active'),
      (v_round4, v_baguio_id, 4, '2026-06-29T08:00:00Z', v_dina_id,  90, 0,  'scheduled'),
      (v_round5, v_baguio_id, 5, '2026-07-06T08:00:00Z', v_enzo_id,  90, 0,  'scheduled');

    -- all contributions paid for rounds 1-2, round 3 has 4 of 6 paid
    insert into public.circle_contributions (id, circle_id, round_id, member_id, amount_due, status, tx_hash, paid_at, slashed_amount, reminders_sent)
    values
      (gen_random_uuid(), v_baguio_id, v_round3, v_ari_id,  15, 'paid',    'tx_bag_a', '2026-06-22T08:05:00Z', 0, 0),
      (gen_random_uuid(), v_baguio_id, v_round3, v_bea_id,  15, 'paid',    'tx_bag_b', '2026-06-22T08:10:00Z', 0, 0),
      (gen_random_uuid(), v_baguio_id, v_round3, v_carlo_id,15, 'paid',    'tx_bag_c', '2026-06-22T08:15:00Z', 0, 0),
      (gen_random_uuid(), v_baguio_id, v_round3, v_dina_id, 15, 'paid',    'tx_bag_d', '2026-06-22T08:20:00Z', 0, 0),
      (gen_random_uuid(), v_baguio_id, v_round3, v_enzo_id, 15, 'pending', null,       null,                      0, 0);

    -- payouts
    insert into public.payout_schedule (id, circle_id, round_number, recipient_member_id, payout_amount, expected_payout_at, withheld_amount, status, tx_hash)
    values
      (gen_random_uuid(), v_baguio_id, 1, v_ari_id,   90, '2026-06-08T16:00:00Z', 0, 'paid',      'tx_bag_pay_1'),
      (gen_random_uuid(), v_baguio_id, 2, v_bea_id,   90, '2026-06-15T16:00:00Z', 0, 'paid',      'tx_bag_pay_2'),
      (gen_random_uuid(), v_baguio_id, 3, v_carlo_id, 90, '2026-06-22T16:00:00Z', 0, 'ready',     null);
  end if;

  -- =========================================================================
  -- CIRCLE 4: Davao Completed Circle (all rounds done, all paid)
  -- =========================================================================

  if not exists (select 1 from public.circles where name = 'Davao Completed Circle' and creator_id = v_profile_id) then
    v_davao_id := gen_random_uuid();
    v_ari_id   := gen_random_uuid();
    v_bea_id   := gen_random_uuid();
    v_carlo_id := gen_random_uuid();
    v_dina_id  := gen_random_uuid();
    v_enzo_id  := gen_random_uuid();

    insert into public.circles (id, creator_id, name, status, contribution_amount, contribution_asset, interval_seconds, member_count, max_member_count, collateral_amount, grace_period_hours, slash_percentage, warning_threshold, auto_slash_enabled, payout_order_mode, reminder_schedule_hours, current_round, total_rounds, start_date, settings_locked, payout_order_locked, rules_locked)
    values (v_davao_id, v_profile_id, 'Davao Completed Circle', 'completed', 20, 'USDC', 2592000, 5, 5, 20, 12, 100, 2, true, 'creator', '{72,24}', 5, 5, '2026-01-01T00:00:00Z', true, true, true);

    insert into public.circle_members (id, circle_id, profile_id, display_name, wallet_address, role, invite_status, agreement_status, collateral_status, payment_status, payout_round, restriction_status, late_count, slashed_amount, joined_at)
    values
      (v_ari_id,   v_davao_id, v_profile_id, 'Ari Santos',  'GABC91A2CREATOR000000000000000000000000000000000000000001', 'creator', 'accepted', 'accepted', 'posted', 'paid', 1, 'clear', 0, 0, '2026-01-01T00:05:00Z'),
      (v_bea_id,   v_davao_id, null,         'Bea Lim',     'GDEF22FPENDING000000000000000000000000000000000000000002', 'member',  'accepted', 'accepted', 'posted', 'paid', 2, 'clear', 0, 0, '2026-01-01T00:10:00Z'),
      (v_carlo_id, v_davao_id, null,         'Carlo Reyes', 'GHIJ8KQLATE00000000000000000000000000000000000000000003',    'member',  'accepted', 'accepted', 'posted', 'paid', 3, 'clear', 0, 0, '2026-01-01T00:15:00Z'),
      (v_dina_id,  v_davao_id, null,         'Dina Cruz',   'GKLM44DPOSTED000000000000000000000000000000000000000004',    'member',  'accepted', 'accepted', 'posted', 'paid', 4, 'clear', 0, 0, '2026-01-01T00:20:00Z'),
      (v_enzo_id,  v_davao_id, null,         'Enzo Tan',    'GNOP55ERESTRICTED00000000000000000000000000000000000005',    'member',  'accepted', 'accepted', 'posted', 'paid', 5, 'clear', 0, 0, '2026-01-01T00:25:00Z');

    -- all 5 rounds completed
    v_round1 := gen_random_uuid(); v_round2 := gen_random_uuid();
    v_round3 := gen_random_uuid(); v_round4 := gen_random_uuid();
    v_round5 := gen_random_uuid();

    insert into public.circle_rounds (id, circle_id, round_number, due_at, payout_member_id, expected_amount, collected_amount, status)
    values
      (v_round1, v_davao_id, 1, '2026-02-01T00:00:00Z', v_ari_id,   100, 100, 'completed'),
      (v_round2, v_davao_id, 2, '2026-03-01T00:00:00Z', v_bea_id,   100, 100, 'completed'),
      (v_round3, v_davao_id, 3, '2026-04-01T00:00:00Z', v_carlo_id, 100, 100, 'completed'),
      (v_round4, v_davao_id, 4, '2026-05-01T00:00:00Z', v_dina_id,  100, 100, 'completed'),
      (v_round5, v_davao_id, 5, '2026-06-01T00:00:00Z', v_enzo_id,  100, 100, 'completed');

    -- all payouts paid
    insert into public.payout_schedule (id, circle_id, round_number, recipient_member_id, payout_amount, expected_payout_at, withheld_amount, status, tx_hash)
    values
      (gen_random_uuid(), v_davao_id, 1, v_ari_id,   100, '2026-02-01T12:00:00Z', 0, 'paid', 'tx_dav_1'),
      (gen_random_uuid(), v_davao_id, 2, v_bea_id,   100, '2026-03-01T12:00:00Z', 0, 'paid', 'tx_dav_2'),
      (gen_random_uuid(), v_davao_id, 3, v_carlo_id, 100, '2026-04-01T12:00:00Z', 0, 'paid', 'tx_dav_3'),
      (gen_random_uuid(), v_davao_id, 4, v_dina_id,  100, '2026-05-01T12:00:00Z', 0, 'paid', 'tx_dav_4'),
      (gen_random_uuid(), v_davao_id, 5, v_enzo_id,  100, '2026-06-01T12:00:00Z', 0, 'paid', 'tx_dav_5');

    insert into public.audit_events (id, circle_id, member_id, event_type, created_at)
    values
      (gen_random_uuid(), v_davao_id, v_ari_id, 'circle_completed', '2026-06-01T12:05:00Z');
  end if;

  -- =========================================================================
  -- CIRCLE 5: Cebu Cancelled Circle (cancelled after round 1 dispute)
  -- =========================================================================

  if not exists (select 1 from public.circles where name = 'Cebu Cancelled Circle' and creator_id = v_profile_id) then
    v_cebu_id := gen_random_uuid();
    v_ari_id  := gen_random_uuid();
    v_bea_id  := gen_random_uuid();
    v_carlo_id:= gen_random_uuid();
    v_dina_id := gen_random_uuid();
    v_enzo_id := gen_random_uuid();

    insert into public.circles (id, creator_id, name, status, contribution_amount, contribution_asset, interval_seconds, member_count, max_member_count, collateral_amount, grace_period_hours, slash_percentage, warning_threshold, auto_slash_enabled, payout_order_mode, reminder_schedule_hours, current_round, total_rounds, start_date, settings_locked, payout_order_locked, rules_locked)
    values (v_cebu_id, v_profile_id, 'Cebu Cancelled Circle', 'cancelled', 12, 'USDC', 86400, 5, 8, 6, 4, 100, 2, true, 'creator', '{24,1}', 1, 5, '2026-07-01T12:00:00Z', true, true, true);

    insert into public.circle_members (id, circle_id, profile_id, display_name, wallet_address, role, invite_status, agreement_status, collateral_status, payment_status, payout_round, restriction_status, late_count, slashed_amount, joined_at)
    values
      (v_ari_id,   v_cebu_id, v_profile_id, 'Ari Santos',  'GABC91A2CREATOR000000000000000000000000000000000000000001', 'creator', 'accepted', 'accepted', 'posted', 'paid',    1, 'clear', 0, 0, '2026-07-01T12:05:00Z'),
      (v_bea_id,   v_cebu_id, null,         'Bea Lim',     'GDEF22FPENDING000000000000000000000000000000000000000002', 'member',  'accepted', 'accepted', 'posted', 'paid',    2, 'clear', 0, 0, '2026-07-01T12:10:00Z'),
      (v_carlo_id, v_cebu_id, null,         'Carlo Reyes', 'GHIJ8KQLATE00000000000000000000000000000000000000000003',    'member',  'accepted', 'accepted', 'posted', 'pending', 3, 'clear', 0, 0, '2026-07-01T12:15:00Z'),
      (v_dina_id,  v_cebu_id, null,         'Dina Cruz',   'GKLM44DPOSTED000000000000000000000000000000000000000004',    'member',  'accepted', 'accepted', 'posted', 'not_due', 4, 'clear', 0, 0, '2026-07-01T12:20:00Z'),
      (v_enzo_id,  v_cebu_id, null,         'Enzo Tan',    'GNOP55ERESTRICTED00000000000000000000000000000000000005',    'member',  'accepted', 'accepted', 'posted', 'not_due', 5, 'clear', 0, 0, '2026-07-01T12:25:00Z');

    v_round1 := gen_random_uuid();
    insert into public.circle_rounds (id, circle_id, round_number, due_at, payout_member_id, expected_amount, collected_amount, status)
    values
      (v_round1, v_cebu_id, 1, '2026-07-02T12:00:00Z', v_ari_id, 60, 24, 'disputed');

    -- only 2 of 5 contributed before cancellation
    insert into public.circle_contributions (id, circle_id, round_id, member_id, amount_due, status, paid_at, slashed_amount, reminders_sent)
    values
      (gen_random_uuid(), v_cebu_id, v_round1, v_ari_id,   12, 'paid',    '2026-07-02T10:00:00Z', 0, 0),
      (gen_random_uuid(), v_cebu_id, v_round1, v_bea_id,   12, 'paid',    '2026-07-02T10:15:00Z', 0, 0),
      (gen_random_uuid(), v_cebu_id, v_round1, v_carlo_id, 12, 'pending', null,                      0, 1),
      (gen_random_uuid(), v_cebu_id, v_round1, v_dina_id,  12, 'not_due', null,                      0, 0),
      (gen_random_uuid(), v_cebu_id, v_round1, v_enzo_id,  12, 'not_due', null,                      0, 0);

    -- one payout before cancellation
    insert into public.payout_schedule (id, circle_id, round_number, recipient_member_id, payout_amount, expected_payout_at, withheld_amount, status, tx_hash)
    values
      (gen_random_uuid(), v_cebu_id, 1, v_ari_id, 24, '2026-07-02T16:00:00Z', 0, 'paid', 'tx_cebu_pay_1');

    insert into public.audit_events (id, circle_id, member_id, event_type, round_number, created_at)
    values
      (gen_random_uuid(), v_cebu_id, v_ari_id, 'circle_activated', null,   '2026-07-01T12:30:00Z'),
      (gen_random_uuid(), v_cebu_id, v_ari_id, 'dispute_raised',   1,      '2026-07-02T14:00:00Z'),
      (gen_random_uuid(), v_cebu_id, v_ari_id, 'circle_cancelled', null,   '2026-07-02T18:00:00Z');
  end if;

  raise notice 'Seed complete. 5 circles created.';
end $$;
