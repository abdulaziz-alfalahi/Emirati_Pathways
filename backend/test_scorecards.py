import sys
import routes.board_portal_routes as bp

print("Testing get_scorecards...")
try:
    bp.get_scorecards()
except Exception as e:
    import traceback
    traceback.print_exc()
print("Done")
