"""
Database Verification Script for Offer Updates
Run this script to check if offer updates are being saved to the database
"""

import psycopg2
import os
import sys
from datetime import datetime

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def get_db_connection():
    """Get database connection"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', '127.0.0.1'),
        port=os.getenv('DB_PORT', '5432'),
        database=os.getenv('DB_NAME', 'emirati_journey'),
        user=os.getenv('DB_USER', 'emirati_user'),
        password=os.getenv('DB_PASSWORD', 'emirati_secure_password')
    )

def check_offers():
    """Check all offers in the database"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get all offers
        cur.execute('''
            SELECT offer_id, position_title, salary_amount, salary_currency, 
                   status, created_at, updated_at, negotiation_history
            FROM job_offers 
            ORDER BY updated_at DESC
        ''')
        
        offers = cur.fetchall()
        
        if not offers:
            print("❌ No offers found in database")
            return
        
        print("=" * 100)
        print(f"FOUND {len(offers)} OFFER(S) IN DATABASE")
        print("=" * 100)
        print()
        
        for idx, row in enumerate(offers, 1):
            offer_id, position, salary, currency, status, created_at, updated_at, neg_history = row
            
            print(f"OFFER #{idx}")
            print("-" * 100)
            print(f"  Offer ID:       {offer_id}")
            print(f"  Position:       {position}")
            print(f"  💰 Salary:      {salary:,.2f} {currency}")
            print(f"  Status:         {status}")
            print(f"  Created:        {created_at}")
            print(f"  Last Updated:   {updated_at}")
            
            # Check if updated recently (within last 5 minutes)
            if updated_at:
                time_diff = datetime.now() - updated_at.replace(tzinfo=None)
                if time_diff.total_seconds() < 300:  # 5 minutes
                    print(f"  ✅ RECENTLY UPDATED: {int(time_diff.total_seconds())} seconds ago")
                else:
                    print(f"  ⏰ Last update: {int(time_diff.total_seconds() / 60)} minutes ago")
            
            # Show negotiation history if exists
            if neg_history:
                print(f"  📝 Negotiation History: {len(neg_history)} entries")
                for i, entry in enumerate(neg_history, 1):
                    if 'proposed_salary' in entry:
                        print(f"     Entry {i}: {entry['party']} proposed {entry['proposed_salary']} {currency}")
            
            print()
        
        cur.close()
        conn.close()
        
        print("=" * 100)
        print("✅ Database check complete")
        print("=" * 100)
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print()
    print("🔍 CHECKING OFFER UPDATES IN DATABASE...")
    print()
    check_offers()

