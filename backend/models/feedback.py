import json
import os
from datetime import datetime
import uuid

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'feedback.json')

# Ensure data directory exists
os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)

class Feedback:
    def __init__(self, user_id, role, message, type, console_logs=None, metadata=None, screenshot=None):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.role = role
        self.message = message
        self.type = type  # 'bug' or 'feature'
        self.console_logs = console_logs
        self.metadata = metadata
        self.screenshot = screenshot
        self.status = 'open'
        self.created_at = datetime.utcnow().isoformat()

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'role': self.role,
            'message': self.message,
            'type': self.type,
            'console_logs': self.console_logs,
            'metadata': self.metadata,
            'screenshot': self.screenshot,
            'status': self.status,
            'created_at': self.created_at
        }

    @staticmethod
    def load_all():
        if not os.path.exists(DATA_FILE):
            return []
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return []

    @staticmethod
    def save(feedback_obj):
        data = Feedback.load_all()
        data.append(feedback_obj.to_dict())
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        return feedback_obj

    @staticmethod
    def update_status(feedback_id, new_status):
        data = Feedback.load_all()
        updated = False
        for item in data:
            if item.get('id') == feedback_id:
                item['status'] = new_status
                updated = True
                break
        
        if updated:
            with open(DATA_FILE, 'w') as f:
                json.dump(data, f, indent=2)
            return True
        return False

    @staticmethod
    def get_stats():
        data = Feedback.load_all()
        total = len(data)
        open_issues = len([f for f in data if f.get('status') == 'open'])
        bugs = len([f for f in data if f.get('type') == 'bug'])
        features = len([f for f in data if f.get('type') == 'feature'])
        
        # Calculate today's feedback
        today_str = datetime.utcnow().date().isoformat()
        today_count = len([f for f in data if f.get('created_at', '').startswith(today_str)])

        return {
            'total': total,
            'open': open_issues,
            'bugs': bugs,
            'features': features,
            'today': today_count
        }
