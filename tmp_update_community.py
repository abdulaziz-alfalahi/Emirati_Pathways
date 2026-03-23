import psycopg2

conn = psycopg2.connect(
    host='localhost',
    database='emirati_journey',
    user='emirati_user',
    password='emirati_secure_password'
)
cur = conn.cursor()
cur.execute("""
    UPDATE communities 
    SET name = 'Dubai Real Estate Professionals',
        name_ar = 'محترفو العقارات في دبي',
        description = 'Real estate developers, brokers, and investors — market insights, project updates, and networking for Dubai property.',
        description_ar = 'مطورو العقارات والوسطاء والمستثمرون — رؤى السوق وتحديثات المشاريع والتواصل لعقارات دبي.'
    WHERE name = 'Abu Dhabi Real Estate Professionals'
""")
print(f"Updated {cur.rowcount} row(s)")
conn.commit()
cur.close()
conn.close()
