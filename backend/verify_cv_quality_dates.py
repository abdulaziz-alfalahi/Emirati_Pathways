import sys
import os
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.services.profile_v2_service import ProfileV2Service

def test_date_parsing():
    test_cases = [
        ("2020-01-01", "2020-01-01 00:00:00"), # Standard ISO
        ("2021", "2021-01-01 00:00:00"),       # Year only
        ("Jan 2022", "2022-01-01 00:00:00"),   # Month Year
        ("January 2023", "2023-01-01 00:00:00"),# Full Month Year
        ("05/2024", "2024-05-01 00:00:00"),    # MM/YYYY
        ("2024/06", "2024-06-01 00:00:00"),    # YYYY/MM
        ("Present", None),                     # Keyword
        ("Current", None),                     # Keyword
        ("Now", None),                         # Keyword
        ("", None),                            # Empty
        (None, None),                          # None
        ("Invalid Date", None)                 # Garbage
    ]

    print("--- Testing Date Parsing Logic ---")
    all_passed = True
    for input_date, expected in test_cases:
        result = ProfileV2Service._parse_date(input_date)
        result_str = str(result) if result else None
        status = "✅ PASS" if str(result_str) == str(expected) else f"❌ FAIL (Expected {expected}, got {result_str})"
        print(f"Input: '{input_date}' -> {status}")
        if "FAIL" in status: all_passed = False
    
    return all_passed

if __name__ == "__main__":
    if test_date_parsing():
        print("\nAll Date Tests Passed!")
    else:
        print("\nSome Date Tests Failed!")
