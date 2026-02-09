
import sys
import os
import psycopg2

# Append root to path to import app config
sys.path.append(os.path.dirname(os.getcwd()))
sys.path.append(os.getcwd())

# from app import DATABASE_CONFIG <-- Removed to avoid side effects
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'emirati_journey'),
    'user': os.getenv('DB_USER', 'emirati_user'),
    'password': os.getenv('DB_PASSWORD', 'emirati_secure_password'),
    'port': int(os.getenv('DB_PORT', 5432))
}

def log(msg):
    try:
        print(msg)
    except:
        pass
    with open("add_trigger_result.txt", "a", encoding="utf-8") as f:
        f.write(msg + "\n")

def add_trigger():
    # Clear log
    with open("add_trigger_result.txt", "w", encoding="utf-8") as f:
        f.write("Starting Trigger Installation...\n")

    conn = None
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        cur = conn.cursor()
        
        log("1. Creating Trigger Function 'update_job_app_count_func'...")
        create_func_sql = """
        CREATE OR REPLACE FUNCTION update_job_app_count_func() RETURNS TRIGGER AS $$
        BEGIN
            IF (TG_OP = 'INSERT') THEN
                UPDATE job_postings
                SET applications_count = COALESCE(applications_count, 0) + 1
                WHERE id::text = NEW.job_id::text OR jd_id = NEW.job_id::text;
                RETURN NEW;
            ELSIF (TG_OP = 'DELETE') THEN
                UPDATE job_postings
                SET applications_count = GREATEST(COALESCE(applications_count, 0) - 1, 0)
                WHERE id::text = OLD.job_id::text OR jd_id = OLD.job_id::text;
                RETURN OLD;
            END IF;
            RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
        """
        cur.execute(create_func_sql)
        log("   ✅ Function created.")

        log("2. Creating Trigger 'trg_job_app_count'...")
        # Drop if exists to avoid errors on re-run
        cur.execute("DROP TRIGGER IF EXISTS trg_job_app_count ON job_applications;")
        
        create_trigger_sql = """
        CREATE TRIGGER trg_job_app_count
        AFTER INSERT OR DELETE ON job_applications
        FOR EACH ROW EXECUTE FUNCTION update_job_app_count_func();
        """
        cur.execute(create_trigger_sql)
        log("   ✅ Trigger created.")
        
        conn.commit()
        log("🎉 Trigger installation complete.")
        cur.close()

    except Exception as e:
        log(f"❌ Error: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    add_trigger()
