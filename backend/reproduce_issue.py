
import sys
import os
import logging

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.communication_service import communication_service, MessageType

# Setup logging to console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_archive_flow():
    recruiter_id = "recruiter-123"
    candidate_id = "candidate-456"
    
    print("\n--- Step 1: Create Conversation (Recruiter -> Candidate) ---")
    conv = communication_service.create_conversation([recruiter_id, candidate_id], title="Job Chat")
    print(f"Created Conversation ID: {conv.id}")
    
    print("\n--- Step 2: Recruiter Archives Conversation ---")
    success = communication_service.archive_conversation_for_user(conv.id, recruiter_id)
    print(f"Archive Success: {success}")
    
    # Verify it's gone for recruiter
    convs = communication_service.get_user_conversations(recruiter_id)
    print(f"Recruiter Conversations Count (Should be 0): {len(convs)}")
    
    print("\n--- Step 3: Candidate Initiates Message (Simulating 'Apply' - [Candidate, Recruiter]) ---")
    # Simulate frontend creating conversation with SWAPPED order (Candidate first)
    # If logic is robust, it should find the existing one despite the swap.
    conv_2 = communication_service.create_conversation([candidate_id, recruiter_id], title="Job Chat")
    print(f"Candidate 'Created' Conversation ID: {conv_2.id}")
    
    if conv_2.id == conv.id:
        print("SUCCESS: ID Reused despite swapped participants.")
    else:
         print(f"FAILURE: Created NEW Conversation ID: {conv_2.id} (Expected {conv.id})")

    # Send message to this ID
    msg = communication_service.send_message(
        sender_id=candidate_id,
        recipient_id=recruiter_id,
        content="Hello from candidate (swapped)!",
        conversation_id=conv_2.id
    )
    
    print("\n--- Step 4: Recruiter Checks List Again ---")
    convs_after = communication_service.get_user_conversations(recruiter_id)
    print(f"Recruiter Conversations Count: {len(convs_after)}")
    
    if len(convs_after) > 0:
        found_conv = convs_after[0]
        print(f"Found Conversation ID: {found_conv.id}")
        if found_conv.id == conv.id:
             print("SUCCESS: Recruiter sees original chat un-archived.")
        else:
             print("FAILURE: Recruiter sees a DIFFERENT chat.")
    else:
        print("FAILURE: Recruiter list is empty.")

if __name__ == "__main__":
    try:
        test_archive_flow()
    except Exception as e:
        print(f"ERROR: {e}")
