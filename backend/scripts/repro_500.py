import sys
import os
# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from services.communication_service import CommunicationService
import logging

# Setup basic logging to see service logs
logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    service = CommunicationService()
    
    # Simulate the data types from the request
    # User ID 108 (Recruiter), User ID 73 (Candidate)
    # Request JSON: participants: [73] (int)
    # JWT identity: "108" (string)
    
    # Route Logic Simulation:
    current_user_id = "108"
    participants_input = [73]
    
    participants = list(participants_input) # mixed list if we extend it
    # Route does: if current_user_id not in participants: ...
    # BUT "108" not in [73] -> True.
    if current_user_id not in participants:
         participants.append(current_user_id)
    # participants is now [73, "108"] (mixed types)
    
    participant_roles = {}
    sender_role = 'recruiter'
    participant_roles[current_user_id] = sender_role # Key is "108" (string)
    
    # Route: other_ids = [p for p in participants if str(p) != str(current_user_id)]
    other_ids = [p for p in participants if str(p) != str(current_user_id)]
    if other_ids:
        other_id = other_ids[0] # other_id is 73 (int)
        participant_roles[other_id] = 'candidate' # Key is 73 (int)
        
    print(f"Participants: {participants}")
    print(f"Roles: {participant_roles}")
    
    try:
        result = service.create_conversation(
            participants=participants,
            participant_roles=participant_roles,
            title="Debug Chat Repro"
        )
        print(f"Result: {result}")
    except Exception as e:
        print("CRASHED:")
        import traceback
        traceback.print_exc()
