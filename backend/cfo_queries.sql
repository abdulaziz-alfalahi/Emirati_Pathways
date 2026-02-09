-- Query 1: Find CFO jobs
SELECT id, title, recruiter_id, company_id, status
FROM job_postings
WHERE title ILIKE '%Chief Financial Officer%' OR title ILIKE '%CFO%'
ORDER BY created_at DESC;

-- Query 2: Find User 62's recent applications
SELECT ja.id, ja.job_id, ja.candidate_id, ja.status, ja.submitted_at, jp.title
FROM job_applications ja
LEFT JOIN job_postings jp ON ja.job_id::text = jp.id::text
WHERE ja.candidate_id = '62'
ORDER BY ja.submitted_at DESC
LIMIT 10;

-- Query 3: Find User 108's owned jobs
SELECT id, title, recruiter_id, status
FROM job_postings
WHERE recruiter_id::text = '108'
ORDER BY created_at DESC;

-- Query 4: Applications visible to User 108
SELECT 
    ja.id as app_id,
    ja.job_id,
    ja.candidate_id,
    ja.status,
    jp.title,
    jp.recruiter_id
FROM job_applications ja
JOIN job_postings jp ON ja.job_id::text = jp.id::text
WHERE jp.recruiter_id::text = '108'
ORDER BY ja.submitted_at DESC;
