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
        
        # First check what columns exist
        cur.execute('''
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'job_offers'
            ORDER BY ordinal_position
        ''')
        columns = [row[0] for row in cur.fetchall()]
        print(f"Available columns: {', '.join(columns)}")
        print()
        
        # Get all offers (with or without negotiation_history)
        if 'negotiation_history' in columns:
            cur.execute('''
                SELECT offer_id, position_title, salary_amount, salary_currency, 
                       status, created_at, updated_at, negotiation_history
                FROM job_offers 
                ORDER BY updated_at DESC
            ''')
        elif 'negotiation_notes' in columns:
            cur.execute('''
                SELECT offer_id, position_title, salary_amount, salary_currency, 
                       status, created_at, updated_at, negotiation_notes
                FROM job_offers 
                ORDER BY updated_at DESC
            ''')
        else:
            cur.execute('''
                SELECT offer_id, position_title, salary_amount, salary_currency, 
                       status, created_at, updated_at
                FROM job_offers 
                ORDER BY updated_at DESC
            ''')
        
        offers = cur.fetchall()
        has_neg_history = 'negotiation_history' in columns
        
        if not offers:
            print("❌ No offers found in database")
            return
        
        print("=" * 100)
        print(f"FOUND {len(offers)} OFFER(S) IN DATABASE")
        print("=" * 100)
        print()
        
        has_neg_notes = 'negotiation_notes' in columns
        
        for idx, row in enumerate(offers, 1):
            if has_neg_history:
                offer_id, position, salary, currency, status, created_at, updated_at, neg_history = row
            elif has_neg_notes:
                offer_id, position, salary, currency, status, created_at, updated_at, neg_notes = row
                neg_history = neg_notes
            else:
                offer_id, position, salary, currency, status, created_at, updated_at = row
                neg_history = None
            
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
                # Try to parse as JSON
                try:
                    if isinstance(neg_history, str):
                        import json
                        history_data = json.loads(neg_history)
                    else:
                        history_data = neg_history
                    
                    if isinstance(history_data, list):
                        print(f"  📝 Negotiation History: {len(history_data)} entries")
                        for i, entry in enumerate(history_data, 1):
                            party = entry.get('party', 'unknown')
                            if 'proposed_salary' in entry:
                                print(f"     Entry {i}: {party} proposed {entry['proposed_salary']} {currency}")
                            if 'notes' in entry:
                                print(f"              Notes: {entry['notes']}")
                    else:
                        print(f"  📝 Negotiation Notes (text): {neg_history[:100]}...")
                except (json.JSONDecodeError, TypeError) as e:
                    print(f"  📝 Negotiation Notes (raw text): {neg_history[:200] if neg_history else 'None'}")
            elif not has_neg_history and not has_neg_notes:
                print(f"  ⚠️  No negotiation history column in database")
            
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

