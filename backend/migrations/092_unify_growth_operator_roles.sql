-- 092_unify_growth_operator_roles.sql
--
-- Reported 2026-08-27: "The role is showing in one place but not the other. It
-- is confusing." Three screenshots of one person, three different answers.
--
-- WHY
--
-- Two role families named the same job. The growth-domain screen granted
-- growth_operator_<domain>; the Users tab granted the roles the platform has
-- always had. So the "Company Onboarding Operator" checkbox sat unchecked for
-- somebody who plainly did that job, because he held growth_operator_company
-- instead of employer_relations, and nothing checked the former.
--
-- Owner's decision, 2026-08-27: keep talent_operator and employer_relations.
-- Every one of the seven domains already had a role, so the parallel family was
-- never needed. It had ONE holder across all seven of its names; the roles it
-- duplicated had eleven.
--
--   candidate -> talent_operator      assessment -> assessment_operator
--   company   -> employer_relations   mentorship -> mentorship_operator
--   education -> education_operator   community  -> community_operator
--                                     monitoring -> platform_operator
--
-- WHAT THIS CHANGES
--
-- 1. Rewrites any growth_operator_<domain> in users.secondary_roles to the role
--    it was standing in for. Same job, the name everything actually checks.
--
-- 2. Grants the roles that ACTIVE domain assignments already imply. The screen
--    that writes those assignments updates secondary_roles inside a SAVEPOINT
--    that logs a warning and carries on when it fails, and it had failed: four
--    active assignments existed against one matching role. This does not widen
--    anybody's access beyond what an administrator already granted on that
--    screen — it makes the grant real, and visible on the Users tab.
--
-- PRECONDITION, verified against dghr_prod on 2026-08-27:
--   * users carrying a growth_operator_<domain> role: 1
--       784000000000510 SAMIR YEHIA MEHREZ OTHMAN — secondary ['growth_operator_company']
--   * active domain assignments: 4, held by 2 users
--       784000000000050 growthop@test.ehrdc.ae (is_test_account) — candidate, company, mentorship
--       784000000000510 SAMIR ...                                — company
--   * no user has a growth_operator_<domain> as their PRIMARY role.
--
-- If that last one is false elsewhere, step 3 handles it; it is written to run
-- even though it currently matches nothing.
--
-- The generic legacy role 'growth_operator' (no domain suffix) is NOT touched.
-- It is a different, older thing and one real user still carries it.

BEGIN;

-- ---------------------------------------------------------------- backup ---
CREATE TABLE IF NOT EXISTS _backup_growth_operator_roles_092 AS
SELECT id, role, secondary_roles, now() AS captured_at
  FROM users
 WHERE role LIKE 'growth\_operator\_%'
    OR (jsonb_typeof(secondary_roles) = 'array'
        AND secondary_roles ?| array['growth_operator_candidate',
                                     'growth_operator_company',
                                     'growth_operator_education',
                                     'growth_operator_assessment',
                                     'growth_operator_mentorship',
                                     'growth_operator_community',
                                     'growth_operator_monitoring'])
    OR id IN (SELECT user_id FROM growth_operator_assignments WHERE is_active);

-- ------------------------------------------- 1. retired names in secondary ---
UPDATE users u
   SET secondary_roles = s.new_roles,
       updated_at = CURRENT_TIMESTAMP
  FROM (
        SELECT x.id, jsonb_agg(DISTINCT x.mapped ORDER BY x.mapped) AS new_roles
          FROM (
                SELECT u2.id, COALESCE(m.role, r.val) AS mapped
                  FROM users u2
                  CROSS JOIN LATERAL
                       jsonb_array_elements_text(u2.secondary_roles) AS r(val)
                  LEFT JOIN (VALUES
                        ('growth_operator_candidate',  'talent_operator'),
                        ('growth_operator_company',    'employer_relations'),
                        ('growth_operator_education',  'education_operator'),
                        ('growth_operator_assessment', 'assessment_operator'),
                        ('growth_operator_mentorship', 'mentorship_operator'),
                        ('growth_operator_community',  'community_operator'),
                        ('growth_operator_monitoring', 'platform_operator')
                       ) AS m(legacy, role) ON m.legacy = r.val
                 WHERE jsonb_typeof(u2.secondary_roles) = 'array'
                   AND u2.secondary_roles ?| array['growth_operator_candidate',
                                                   'growth_operator_company',
                                                   'growth_operator_education',
                                                   'growth_operator_assessment',
                                                   'growth_operator_mentorship',
                                                   'growth_operator_community',
                                                   'growth_operator_monitoring']
               ) x
         GROUP BY x.id
       ) s
 WHERE u.id = s.id
   AND u.secondary_roles IS DISTINCT FROM s.new_roles;

-- --------------------------------- 2. honour what the assignments imply ---
-- Assignment-implied roles are ADDED to whatever the person already holds;
-- nothing is taken away. A role equal to the primary role is left out rather
-- than repeated in the secondary list.
UPDATE users u
   SET secondary_roles = COALESCE((
           SELECT jsonb_agg(DISTINCT t.r ORDER BY t.r)
             FROM (
                   SELECT jsonb_array_elements_text(
                            CASE WHEN jsonb_typeof(u.secondary_roles) = 'array'
                                 THEN u.secondary_roles ELSE '[]'::jsonb END) AS r
                   UNION
                   SELECT m.role
                     FROM growth_operator_assignments g
                     JOIN (VALUES
                           ('candidate',  'talent_operator'),
                           ('company',    'employer_relations'),
                           ('education',  'education_operator'),
                           ('assessment', 'assessment_operator'),
                           ('mentorship', 'mentorship_operator'),
                           ('community',  'community_operator'),
                           ('monitoring', 'platform_operator')
                          ) AS m(domain, role) ON m.domain = g.domain
                    WHERE g.user_id = u.id AND g.is_active
                  ) t
            WHERE t.r IS DISTINCT FROM u.role
       ), '[]'::jsonb),
       updated_at = CURRENT_TIMESTAMP
 WHERE u.id IN (SELECT user_id FROM growth_operator_assignments WHERE is_active);

-- ------------------------------------------------ 3. retired primary role ---
-- Matches nothing today (verified above) and is here so the migration is
-- complete rather than merely sufficient for this database.
UPDATE users
   SET role = CASE role
                WHEN 'growth_operator_candidate'  THEN 'talent_operator'
                WHEN 'growth_operator_company'    THEN 'employer_relations'
                WHEN 'growth_operator_education'  THEN 'education_operator'
                WHEN 'growth_operator_assessment' THEN 'assessment_operator'
                WHEN 'growth_operator_mentorship' THEN 'mentorship_operator'
                WHEN 'growth_operator_community'  THEN 'community_operator'
                WHEN 'growth_operator_monitoring' THEN 'platform_operator'
              END,
       user_type = CASE role
                WHEN 'growth_operator_candidate'  THEN 'talent_operator'
                WHEN 'growth_operator_company'    THEN 'employer_relations'
                WHEN 'growth_operator_education'  THEN 'education_operator'
                WHEN 'growth_operator_assessment' THEN 'assessment_operator'
                WHEN 'growth_operator_mentorship' THEN 'mentorship_operator'
                WHEN 'growth_operator_community'  THEN 'community_operator'
                WHEN 'growth_operator_monitoring' THEN 'platform_operator'
              END,
       updated_at = CURRENT_TIMESTAMP
 WHERE role LIKE 'growth\_operator\_%';

COMMIT;

-- ------------------------------------------------------------- verify ------
-- Expect 0:
--   SELECT count(*) FROM users
--    WHERE role LIKE 'growth\_operator\_%'
--       OR (jsonb_typeof(secondary_roles) = 'array'
--           AND secondary_roles::text LIKE '%growth_operator_c%');
--
-- Expect every active assignment to be matched by a held role (0 rows):
--   SELECT g.user_id, g.domain
--     FROM growth_operator_assignments g
--     JOIN users u ON u.id = g.user_id
--     JOIN (VALUES ('candidate','talent_operator'),('company','employer_relations'),
--                  ('education','education_operator'),('assessment','assessment_operator'),
--                  ('mentorship','mentorship_operator'),('community','community_operator'),
--                  ('monitoring','platform_operator')) AS m(domain, role) ON m.domain = g.domain
--    WHERE g.is_active
--      AND u.role IS DISTINCT FROM m.role
--      AND NOT (jsonb_typeof(u.secondary_roles) = 'array' AND u.secondary_roles ? m.role);
--
-- Rollback: UPDATE users u SET role = b.role, secondary_roles = b.secondary_roles
--             FROM _backup_growth_operator_roles_092 b WHERE b.id = u.id;
