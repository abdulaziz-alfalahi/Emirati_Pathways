"""
Messaging and Interview Management System
Backend system for recruiter-candidate communication, interview scheduling, and management
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import logging

# Configure logging
logger = logging.getLogger(__name__)

class MessageType(Enum):
    """Types of messages in the system"""
    INITIAL_CONTACT = "initial_contact"
    FOLLOW_UP = "follow_up"
    INTERVIEW_INVITATION = "interview_invitation"
    INTERVIEW_CONFIRMATION = "interview_confirmation"
    INTERVIEW_RESCHEDULE = "interview_reschedule"
    INTERVIEW_CANCELLATION = "interview_cancellation"
    OFFER_LETTER = "offer_letter"
    REJECTION = "rejection"
    GENERAL = "general"
    AUTOMATED = "automated"

class InterviewType(Enum):
    """Types of interviews"""
    PHONE_SCREENING = "phone_screening"
    VIDEO_INTERVIEW = "video_interview"
    IN_PERSON = "in_person"
    TECHNICAL_ASSESSMENT = "technical_assessment"
    PANEL_INTERVIEW = "panel_interview"
    FINAL_INTERVIEW = "final_interview"
    HR_INTERVIEW = "hr_interview"

class InterviewStatus(Enum):
    """Interview status options"""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    NO_SHOW = "no_show"

class MessageStatus(Enum):
    """Message status options"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    REPLIED = "replied"
    FAILED = "failed"

@dataclass
class Message:
    """Message data structure"""
    id: str
    conversation_id: str
    sender_id: str
    sender_type: str  # 'recruiter' or 'candidate'
    recipient_id: str
    recipient_type: str
    subject: str
    content: str
    message_type: MessageType
    status: MessageStatus
    created_at: datetime
    read_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    attachments: List[str] = None
    metadata: Dict[str, Any] = None

@dataclass
class Interview:
    """Interview data structure"""
    id: str
    job_id: str
    candidate_id: str
    recruiter_id: str
    title: str
    description: str
    interview_type: InterviewType
    status: InterviewStatus
    scheduled_at: datetime
    duration_minutes: int
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    meeting_id: Optional[str] = None
    meeting_password: Optional[str] = None
    interviewer_ids: List[str] = None
    preparation_notes: Optional[str] = None
    feedback: Optional[str] = None
    rating: Optional[int] = None
    created_at: datetime = None
    updated_at: datetime = None
    reminder_sent: bool = False
    confirmation_required: bool = True
    confirmed_by_candidate: bool = False
    confirmed_by_recruiter: bool = False
    metadata: Dict[str, Any] = None

@dataclass
class Conversation:
    """Conversation data structure"""
    id: str
    job_id: str
    candidate_id: str
    recruiter_id: str
    subject: str
    status: str  # 'active', 'closed', 'archived'
    created_at: datetime
    last_message_at: datetime
    message_count: int
    unread_count_recruiter: int
    unread_count_candidate: int
    tags: List[str] = None
    priority: str = "normal"  # 'low', 'normal', 'high', 'urgent'

class MessagingInterviewSystem:
    """Comprehensive messaging and interview management system"""
    
    def __init__(self):
        self.conversations: Dict[str, Conversation] = {}
        self.messages: Dict[str, Message] = {}
        self.interviews: Dict[str, Interview] = {}
        self.message_templates = self._init_message_templates()
        self.interview_templates = self._init_interview_templates()
        
    def _init_message_templates(self) -> Dict[str, Dict[str, str]]:
        """Initialize message templates for different scenarios"""
        return {
            'initial_contact': {
                'subject': 'Exciting Opportunity: {job_title} at {company}',
                'template': """Dear {candidate_name},

I hope this message finds you well. I came across your profile and was impressed by your background in {candidate_skills}.

We have an exciting opportunity for a {job_title} position at {company} that I believe would be a perfect match for your skills and experience.

Key highlights of this role:
• {job_highlights}
• Competitive salary package
• Comprehensive benefits
• Career growth opportunities
• UAE-based position with visa sponsorship available

Would you be interested in learning more about this opportunity? I would love to schedule a brief call to discuss the details.

Best regards,
{recruiter_name}
{company}
{contact_info}"""
            },
            'interview_invitation': {
                'subject': 'Interview Invitation: {job_title} at {company}',
                'template': """Dear {candidate_name},

Thank you for your interest in the {job_title} position at {company}. We were impressed with your application and would like to invite you for an interview.

Interview Details:
• Date: {interview_date}
• Time: {interview_time} (UAE Time)
• Duration: {duration} minutes
• Type: {interview_type}
• Location/Link: {location_or_link}

{interview_preparation_notes}

Please confirm your availability by replying to this message or clicking the confirmation link below.

We look forward to speaking with you!

Best regards,
{recruiter_name}
{company}
{contact_info}"""
            },
            'interview_confirmation': {
                'subject': 'Interview Confirmed: {job_title} - {interview_date}',
                'template': """Dear {candidate_name},

This is to confirm your interview for the {job_title} position at {company}.

Confirmed Details:
• Date: {interview_date}
• Time: {interview_time} (UAE Time)
• Duration: {duration} minutes
• Type: {interview_type}
• Location/Link: {location_or_link}

{preparation_instructions}

If you need to reschedule or have any questions, please contact me as soon as possible.

Looking forward to meeting you!

Best regards,
{recruiter_name}
{company}
{contact_info}"""
            },
            'interview_reminder': {
                'subject': 'Reminder: Interview Tomorrow - {job_title}',
                'template': """Dear {candidate_name},

This is a friendly reminder about your interview scheduled for tomorrow.

Interview Details:
• Date: {interview_date}
• Time: {interview_time} (UAE Time)
• Duration: {duration} minutes
• Type: {interview_type}
• Location/Link: {location_or_link}

{final_preparation_notes}

We look forward to speaking with you!

Best regards,
{recruiter_name}
{company}"""
            },
            'offer_letter': {
                'subject': 'Job Offer: {job_title} at {company}',
                'template': """Dear {candidate_name},

Congratulations! We are pleased to extend an offer for the {job_title} position at {company}.

Offer Details:
• Position: {job_title}
• Department: {department}
• Salary: {salary_package}
• Start Date: {start_date}
• Benefits: {benefits_summary}

{offer_details}

Please review the attached offer letter and let us know your decision by {response_deadline}.

We are excited about the possibility of you joining our team!

Best regards,
{recruiter_name}
{company}
{contact_info}"""
            },
            'rejection': {
                'subject': 'Update on Your Application: {job_title}',
                'template': """Dear {candidate_name},

Thank you for your interest in the {job_title} position at {company} and for taking the time to interview with us.

After careful consideration, we have decided to move forward with another candidate whose background more closely matches our current requirements.

We were impressed with your qualifications and encourage you to apply for future opportunities that may be a better fit.

We wish you all the best in your job search.

Best regards,
{recruiter_name}
{company}"""
            }
        }
    
    def _init_interview_templates(self) -> Dict[str, Dict[str, Any]]:
        """Initialize interview templates and configurations"""
        return {
            'phone_screening': {
                'duration': 30,
                'preparation_notes': 'Please have your CV ready and be prepared to discuss your experience and career goals.',
                'default_questions': [
                    'Tell me about yourself and your background',
                    'Why are you interested in this position?',
                    'What are your salary expectations?',
                    'When would you be available to start?'
                ]
            },
            'video_interview': {
                'duration': 60,
                'preparation_notes': 'Please ensure you have a stable internet connection and test your camera/microphone beforehand.',
                'default_questions': [
                    'Walk me through your relevant experience',
                    'Describe a challenging project you worked on',
                    'How do you handle working in a multicultural environment?',
                    'What interests you about working in the UAE?'
                ]
            },
            'technical_assessment': {
                'duration': 90,
                'preparation_notes': 'This will be a technical interview. Please be prepared to discuss your technical skills and potentially solve coding problems.',
                'default_questions': [
                    'Explain your approach to problem-solving',
                    'Describe your experience with [relevant technologies]',
                    'How do you stay updated with new technologies?',
                    'Can you walk through a technical project you\'re proud of?'
                ]
            },
            'panel_interview': {
                'duration': 75,
                'preparation_notes': 'You will be meeting with multiple team members. Be prepared to discuss both technical and cultural fit.',
                'default_questions': [
                    'How do you work in a team environment?',
                    'Describe your leadership style',
                    'How do you handle conflicts in the workplace?',
                    'What are your long-term career goals?'
                ]
            },
            'final_interview': {
                'duration': 45,
                'preparation_notes': 'This is the final stage of our interview process. Be prepared to discuss compensation and next steps.',
                'default_questions': [
                    'Why should we hire you?',
                    'What are your salary expectations?',
                    'When can you start?',
                    'Do you have any questions about the role or company?'
                ]
            }
        }

    # Message Management Methods
    def create_conversation(
        self, 
        job_id: str, 
        candidate_id: str, 
        recruiter_id: str, 
        subject: str
    ) -> str:
        """Create a new conversation"""
        conversation_id = f"conv_{uuid.uuid4().hex[:12]}"
        
        conversation = Conversation(
            id=conversation_id,
            job_id=job_id,
            candidate_id=candidate_id,
            recruiter_id=recruiter_id,
            subject=subject,
            status='active',
            created_at=datetime.now(),
            last_message_at=datetime.now(),
            message_count=0,
            unread_count_recruiter=0,
            unread_count_candidate=0,
            tags=[],
            priority='normal'
        )
        
        self.conversations[conversation_id] = conversation
        logger.info(f"✅ Created conversation {conversation_id}")
        return conversation_id

    def send_message(
        self,
        conversation_id: str,
        sender_id: str,
        sender_type: str,
        recipient_id: str,
        recipient_type: str,
        subject: str,
        content: str,
        message_type: MessageType = MessageType.GENERAL,
        attachments: List[str] = None,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Send a message in a conversation"""
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        
        message = Message(
            id=message_id,
            conversation_id=conversation_id,
            sender_id=sender_id,
            sender_type=sender_type,
            recipient_id=recipient_id,
            recipient_type=recipient_type,
            subject=subject,
            content=content,
            message_type=message_type,
            status=MessageStatus.SENT,
            created_at=datetime.now(),
            attachments=attachments or [],
            metadata=metadata or {}
        )
        
        self.messages[message_id] = message
        
        # Update conversation
        if conversation_id in self.conversations:
            conv = self.conversations[conversation_id]
            conv.message_count += 1
            conv.last_message_at = datetime.now()
            
            # Update unread counts
            if sender_type == 'recruiter':
                conv.unread_count_candidate += 1
            else:
                conv.unread_count_recruiter += 1
        
        logger.info(f"✅ Sent message {message_id} in conversation {conversation_id}")
        return message_id

    def send_templated_message(
        self,
        template_name: str,
        conversation_id: str,
        sender_id: str,
        recipient_id: str,
        template_data: Dict[str, Any],
        message_type: MessageType = MessageType.GENERAL
    ) -> str:
        """Send a message using a predefined template"""
        if template_name not in self.message_templates:
            raise ValueError(f"Template '{template_name}' not found")
        
        template = self.message_templates[template_name]
        subject = template['subject'].format(**template_data)
        content = template['template'].format(**template_data)
        
        return self.send_message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            sender_type='recruiter',
            recipient_id=recipient_id,
            recipient_type='candidate',
            subject=subject,
            content=content,
            message_type=message_type,
            metadata={'template_used': template_name, 'template_data': template_data}
        )

    def mark_message_as_read(self, message_id: str, reader_type: str) -> bool:
        """Mark a message as read"""
        if message_id not in self.messages:
            return False
        
        message = self.messages[message_id]
        message.read_at = datetime.now()
        message.status = MessageStatus.READ
        
        # Update conversation unread counts
        conv = self.conversations.get(message.conversation_id)
        if conv:
            if reader_type == 'recruiter' and conv.unread_count_recruiter > 0:
                conv.unread_count_recruiter -= 1
            elif reader_type == 'candidate' and conv.unread_count_candidate > 0:
                conv.unread_count_candidate -= 1
        
        return True

    def get_conversation_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Get all messages in a conversation"""
        messages = [
            asdict(msg) for msg in self.messages.values() 
            if msg.conversation_id == conversation_id
        ]
        return sorted(messages, key=lambda x: x['created_at'])

    def get_recruiter_conversations(self, recruiter_id: str) -> List[Dict[str, Any]]:
        """Get all conversations for a recruiter"""
        conversations = [
            asdict(conv) for conv in self.conversations.values()
            if conv.recruiter_id == recruiter_id
        ]
        return sorted(conversations, key=lambda x: x['last_message_at'], reverse=True)

    # Interview Management Methods
    def schedule_interview(
        self,
        job_id: str,
        candidate_id: str,
        recruiter_id: str,
        interview_type: InterviewType,
        scheduled_at: datetime,
        title: str = None,
        description: str = None,
        duration_minutes: int = None,
        location: str = None,
        meeting_link: str = None,
        interviewer_ids: List[str] = None,
        preparation_notes: str = None
    ) -> str:
        """Schedule a new interview"""
        interview_id = f"int_{uuid.uuid4().hex[:12]}"
        
        # Get template defaults
        template = self.interview_templates.get(interview_type.value, {})
        
        interview = Interview(
            id=interview_id,
            job_id=job_id,
            candidate_id=candidate_id,
            recruiter_id=recruiter_id,
            title=title or f"{interview_type.value.replace('_', ' ').title()} Interview",
            description=description or f"{interview_type.value.replace('_', ' ').title()} interview for the position",
            interview_type=interview_type,
            status=InterviewStatus.SCHEDULED,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes or template.get('duration', 60),
            location=location,
            meeting_link=meeting_link,
            interviewer_ids=interviewer_ids or [],
            preparation_notes=preparation_notes or template.get('preparation_notes'),
            created_at=datetime.now(),
            updated_at=datetime.now(),
            confirmation_required=True,
            metadata={'template_questions': template.get('default_questions', [])}
        )
        
        self.interviews[interview_id] = interview
        logger.info(f"✅ Scheduled interview {interview_id}")
        return interview_id

    def confirm_interview(self, interview_id: str, confirmed_by: str) -> bool:
        """Confirm an interview"""
        if interview_id not in self.interviews:
            return False
        
        interview = self.interviews[interview_id]
        
        if confirmed_by == 'candidate':
            interview.confirmed_by_candidate = True
        elif confirmed_by == 'recruiter':
            interview.confirmed_by_recruiter = True
        
        # If both parties confirmed, update status
        if interview.confirmed_by_candidate and interview.confirmed_by_recruiter:
            interview.status = InterviewStatus.CONFIRMED
        
        interview.updated_at = datetime.now()
        return True

    def reschedule_interview(
        self, 
        interview_id: str, 
        new_scheduled_at: datetime,
        reason: str = None
    ) -> bool:
        """Reschedule an interview"""
        if interview_id not in self.interviews:
            return False
        
        interview = self.interviews[interview_id]
        old_time = interview.scheduled_at
        
        interview.scheduled_at = new_scheduled_at
        interview.status = InterviewStatus.RESCHEDULED
        interview.confirmed_by_candidate = False
        interview.confirmed_by_recruiter = False
        interview.updated_at = datetime.now()
        
        # Add reschedule metadata
        if not interview.metadata:
            interview.metadata = {}
        
        interview.metadata['reschedule_history'] = interview.metadata.get('reschedule_history', [])
        interview.metadata['reschedule_history'].append({
            'old_time': old_time.isoformat(),
            'new_time': new_scheduled_at.isoformat(),
            'reason': reason,
            'rescheduled_at': datetime.now().isoformat()
        })
        
        logger.info(f"✅ Rescheduled interview {interview_id}")
        return True

    def cancel_interview(self, interview_id: str, reason: str = None) -> bool:
        """Cancel an interview"""
        if interview_id not in self.interviews:
            return False
        
        interview = self.interviews[interview_id]
        interview.status = InterviewStatus.CANCELLED
        interview.updated_at = datetime.now()
        
        if not interview.metadata:
            interview.metadata = {}
        interview.metadata['cancellation_reason'] = reason
        interview.metadata['cancelled_at'] = datetime.now().isoformat()
        
        logger.info(f"✅ Cancelled interview {interview_id}")
        return True

    def complete_interview(
        self, 
        interview_id: str, 
        feedback: str = None, 
        rating: int = None
    ) -> bool:
        """Mark an interview as completed with feedback"""
        if interview_id not in self.interviews:
            return False
        
        interview = self.interviews[interview_id]
        interview.status = InterviewStatus.COMPLETED
        interview.feedback = feedback
        interview.rating = rating
        interview.updated_at = datetime.now()
        
        logger.info(f"✅ Completed interview {interview_id}")
        return True

    def get_interviews_for_candidate(self, candidate_id: str) -> List[Dict[str, Any]]:
        """Get all interviews for a candidate"""
        interviews = [
            asdict(interview) for interview in self.interviews.values()
            if interview.candidate_id == candidate_id
        ]
        return sorted(interviews, key=lambda x: x['scheduled_at'])

    def get_interviews_for_recruiter(self, recruiter_id: str) -> List[Dict[str, Any]]:
        """Get all interviews for a recruiter"""
        interviews = [
            asdict(interview) for interview in self.interviews.values()
            if interview.recruiter_id == recruiter_id
        ]
        return sorted(interviews, key=lambda x: x['scheduled_at'])

    def get_upcoming_interviews(self, days_ahead: int = 7) -> List[Dict[str, Any]]:
        """Get upcoming interviews within specified days"""
        cutoff_date = datetime.now() + timedelta(days=days_ahead)
        
        interviews = [
            asdict(interview) for interview in self.interviews.values()
            if (interview.scheduled_at > datetime.now() and 
                interview.scheduled_at <= cutoff_date and
                interview.status in [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED])
        ]
        return sorted(interviews, key=lambda x: x['scheduled_at'])

    def send_interview_reminders(self, hours_before: int = 24) -> List[str]:
        """Send interview reminders"""
        reminder_time = datetime.now() + timedelta(hours=hours_before)
        
        interviews_to_remind = [
            interview for interview in self.interviews.values()
            if (abs((interview.scheduled_at - reminder_time).total_seconds()) < 3600 and  # Within 1 hour of reminder time
                not interview.reminder_sent and
                interview.status in [InterviewStatus.SCHEDULED, InterviewStatus.CONFIRMED])
        ]
        
        reminded_interviews = []
        for interview in interviews_to_remind:
            # Send reminder logic here (email, SMS, etc.)
            interview.reminder_sent = True
            reminded_interviews.append(interview.id)
            logger.info(f"📧 Sent reminder for interview {interview.id}")
        
        return reminded_interviews

    # Analytics and Reporting Methods
    def get_messaging_analytics(self, recruiter_id: str = None) -> Dict[str, Any]:
        """Get messaging analytics"""
        conversations = list(self.conversations.values())
        messages = list(self.messages.values())
        
        if recruiter_id:
            conversations = [c for c in conversations if c.recruiter_id == recruiter_id]
            conv_ids = [c.id for c in conversations]
            messages = [m for m in messages if m.conversation_id in conv_ids]
        
        total_conversations = len(conversations)
        total_messages = len(messages)
        active_conversations = len([c for c in conversations if c.status == 'active'])
        
        # Response time analysis
        response_times = []
        for conv in conversations:
            conv_messages = [m for m in messages if m.conversation_id == conv.id]
            conv_messages.sort(key=lambda x: x.created_at)
            
            for i in range(1, len(conv_messages)):
                if (conv_messages[i-1].sender_type != conv_messages[i].sender_type):
                    response_time = (conv_messages[i].created_at - conv_messages[i-1].created_at).total_seconds() / 3600
                    response_times.append(response_time)
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        return {
            'total_conversations': total_conversations,
            'active_conversations': active_conversations,
            'total_messages': total_messages,
            'average_response_time_hours': round(avg_response_time, 2),
            'message_types': {
                msg_type.value: len([m for m in messages if m.message_type == msg_type])
                for msg_type in MessageType
            }
        }

    def get_interview_analytics(self, recruiter_id: str = None) -> Dict[str, Any]:
        """Get interview analytics"""
        interviews = list(self.interviews.values())
        
        if recruiter_id:
            interviews = [i for i in interviews if i.recruiter_id == recruiter_id]
        
        total_interviews = len(interviews)
        completed_interviews = len([i for i in interviews if i.status == InterviewStatus.COMPLETED])
        cancelled_interviews = len([i for i in interviews if i.status == InterviewStatus.CANCELLED])
        no_shows = len([i for i in interviews if i.status == InterviewStatus.NO_SHOW])
        
        # Interview type distribution
        interview_types = {}
        for interview_type in InterviewType:
            count = len([i for i in interviews if i.interview_type == interview_type])
            interview_types[interview_type.value] = count
        
        # Average rating
        rated_interviews = [i for i in interviews if i.rating is not None]
        avg_rating = sum(i.rating for i in rated_interviews) / len(rated_interviews) if rated_interviews else 0
        
        return {
            'total_interviews': total_interviews,
            'completed_interviews': completed_interviews,
            'cancelled_interviews': cancelled_interviews,
            'no_shows': no_shows,
            'completion_rate': round((completed_interviews / total_interviews * 100), 2) if total_interviews > 0 else 0,
            'interview_types': interview_types,
            'average_rating': round(avg_rating, 2)
        }

# Create Flask Blueprint
messaging_interview_bp = Blueprint('messaging_interview', __name__)

# Initialize system
messaging_system = MessagingInterviewSystem()

# API Routes
@messaging_interview_bp.route('/api/messaging/conversations', methods=['GET'])
def get_conversations():
    """Get conversations for a recruiter"""
    recruiter_id = request.args.get('recruiter_id')
    if not recruiter_id:
        return jsonify({'error': 'recruiter_id is required'}), 400
    
    conversations = messaging_system.get_recruiter_conversations(recruiter_id)
    return jsonify({
        'conversations': conversations,
        'total': len(conversations)
    })

@messaging_interview_bp.route('/api/messaging/conversations', methods=['POST'])
def create_conversation():
    """Create a new conversation"""
    data = request.get_json()
    
    required_fields = ['job_id', 'candidate_id', 'recruiter_id', 'subject']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conversation_id = messaging_system.create_conversation(
        job_id=data['job_id'],
        candidate_id=data['candidate_id'],
        recruiter_id=data['recruiter_id'],
        subject=data['subject']
    )
    
    return jsonify({
        'conversation_id': conversation_id,
        'status': 'created'
    }), 201

@messaging_interview_bp.route('/api/messaging/messages', methods=['POST'])
def send_message():
    """Send a message"""
    data = request.get_json()
    
    required_fields = ['conversation_id', 'sender_id', 'sender_type', 'recipient_id', 'recipient_type', 'subject', 'content']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    message_id = messaging_system.send_message(
        conversation_id=data['conversation_id'],
        sender_id=data['sender_id'],
        sender_type=data['sender_type'],
        recipient_id=data['recipient_id'],
        recipient_type=data['recipient_type'],
        subject=data['subject'],
        content=data['content'],
        message_type=MessageType(data.get('message_type', 'general')),
        attachments=data.get('attachments', []),
        metadata=data.get('metadata', {})
    )
    
    return jsonify({
        'message_id': message_id,
        'status': 'sent'
    }), 201

@messaging_interview_bp.route('/api/messaging/messages/template', methods=['POST'])
def send_templated_message():
    """Send a templated message"""
    data = request.get_json()
    
    required_fields = ['template_name', 'conversation_id', 'sender_id', 'recipient_id', 'template_data']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        message_id = messaging_system.send_templated_message(
            template_name=data['template_name'],
            conversation_id=data['conversation_id'],
            sender_id=data['sender_id'],
            recipient_id=data['recipient_id'],
            template_data=data['template_data'],
            message_type=MessageType(data.get('message_type', 'general'))
        )
        
        return jsonify({
            'message_id': message_id,
            'status': 'sent'
        }), 201
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@messaging_interview_bp.route('/api/messaging/conversations/<conversation_id>/messages', methods=['GET'])
def get_conversation_messages(conversation_id):
    """Get messages in a conversation"""
    messages = messaging_system.get_conversation_messages(conversation_id)
    return jsonify({
        'messages': messages,
        'total': len(messages)
    })

@messaging_interview_bp.route('/api/interviews', methods=['POST'])
def schedule_interview():
    """Schedule a new interview"""
    data = request.get_json()
    
    required_fields = ['job_id', 'candidate_id', 'recruiter_id', 'interview_type', 'scheduled_at']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        scheduled_at = datetime.fromisoformat(data['scheduled_at'].replace('Z', '+00:00'))
        
        interview_id = messaging_system.schedule_interview(
            job_id=data['job_id'],
            candidate_id=data['candidate_id'],
            recruiter_id=data['recruiter_id'],
            interview_type=InterviewType(data['interview_type']),
            scheduled_at=scheduled_at,
            title=data.get('title'),
            description=data.get('description'),
            duration_minutes=data.get('duration_minutes'),
            location=data.get('location'),
            meeting_link=data.get('meeting_link'),
            interviewer_ids=data.get('interviewer_ids', []),
            preparation_notes=data.get('preparation_notes')
        )
        
        return jsonify({
            'interview_id': interview_id,
            'status': 'scheduled'
        }), 201
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@messaging_interview_bp.route('/api/interviews/<interview_id>/confirm', methods=['POST'])
def confirm_interview(interview_id):
    """Confirm an interview"""
    data = request.get_json()
    confirmed_by = data.get('confirmed_by')
    
    if not confirmed_by or confirmed_by not in ['candidate', 'recruiter']:
        return jsonify({'error': 'Invalid confirmed_by value'}), 400
    
    success = messaging_system.confirm_interview(interview_id, confirmed_by)
    
    if success:
        return jsonify({'status': 'confirmed'})
    else:
        return jsonify({'error': 'Interview not found'}), 404

@messaging_interview_bp.route('/api/interviews/<interview_id>/reschedule', methods=['POST'])
def reschedule_interview(interview_id):
    """Reschedule an interview"""
    data = request.get_json()
    
    if 'new_scheduled_at' not in data:
        return jsonify({'error': 'new_scheduled_at is required'}), 400
    
    try:
        new_scheduled_at = datetime.fromisoformat(data['new_scheduled_at'].replace('Z', '+00:00'))
        
        success = messaging_system.reschedule_interview(
            interview_id=interview_id,
            new_scheduled_at=new_scheduled_at,
            reason=data.get('reason')
        )
        
        if success:
            return jsonify({'status': 'rescheduled'})
        else:
            return jsonify({'error': 'Interview not found'}), 404
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

@messaging_interview_bp.route('/api/interviews/<interview_id>/cancel', methods=['POST'])
def cancel_interview(interview_id):
    """Cancel an interview"""
    data = request.get_json()
    reason = data.get('reason')
    
    success = messaging_system.cancel_interview(interview_id, reason)
    
    if success:
        return jsonify({'status': 'cancelled'})
    else:
        return jsonify({'error': 'Interview not found'}), 404

@messaging_interview_bp.route('/api/interviews/<interview_id>/complete', methods=['POST'])
def complete_interview(interview_id):
    """Complete an interview with feedback"""
    data = request.get_json()
    
    success = messaging_system.complete_interview(
        interview_id=interview_id,
        feedback=data.get('feedback'),
        rating=data.get('rating')
    )
    
    if success:
        return jsonify({'status': 'completed'})
    else:
        return jsonify({'error': 'Interview not found'}), 404

@messaging_interview_bp.route('/api/interviews/recruiter/<recruiter_id>', methods=['GET'])
def get_recruiter_interviews(recruiter_id):
    """Get interviews for a recruiter"""
    interviews = messaging_system.get_interviews_for_recruiter(recruiter_id)
    return jsonify({
        'interviews': interviews,
        'total': len(interviews)
    })

@messaging_interview_bp.route('/api/interviews/upcoming', methods=['GET'])
def get_upcoming_interviews():
    """Get upcoming interviews"""
    days_ahead = int(request.args.get('days_ahead', 7))
    interviews = messaging_system.get_upcoming_interviews(days_ahead)
    return jsonify({
        'interviews': interviews,
        'total': len(interviews)
    })

@messaging_interview_bp.route('/api/analytics/messaging', methods=['GET'])
def get_messaging_analytics():
    """Get messaging analytics"""
    recruiter_id = request.args.get('recruiter_id')
    analytics = messaging_system.get_messaging_analytics(recruiter_id)
    return jsonify(analytics)

@messaging_interview_bp.route('/api/analytics/interviews', methods=['GET'])
def get_interview_analytics():
    """Get interview analytics"""
    recruiter_id = request.args.get('recruiter_id')
    analytics = messaging_system.get_interview_analytics(recruiter_id)
    return jsonify(analytics)

@messaging_interview_bp.route('/api/messaging/templates', methods=['GET'])
def get_message_templates():
    """Get available message templates"""
    return jsonify({
        'templates': list(messaging_system.message_templates.keys()),
        'template_details': messaging_system.message_templates
    })

@messaging_interview_bp.route('/api/interviews/templates', methods=['GET'])
def get_interview_templates():
    """Get available interview templates"""
    return jsonify({
        'templates': messaging_system.interview_templates
    })

# Factory function
def get_messaging_interview_system() -> MessagingInterviewSystem:
    """Get messaging and interview system instance"""
    return messaging_system

def get_messaging_interview_blueprint() -> Blueprint:
    """Get messaging and interview blueprint"""
    return messaging_interview_bp

# Example usage
if __name__ == "__main__":
    system = MessagingInterviewSystem()
    
    # Create a conversation
    conv_id = system.create_conversation(
        job_id="job_001",
        candidate_id="cand_001",
        recruiter_id="rec_001",
        subject="Senior Software Engineer Position"
    )
    
    # Send initial contact message
    system.send_templated_message(
        template_name="initial_contact",
        conversation_id=conv_id,
        sender_id="rec_001",
        recipient_id="cand_001",
        template_data={
            'candidate_name': 'Ahmed Al Mansouri',
            'job_title': 'Senior Software Engineer',
            'company': 'TechCorp UAE',
            'candidate_skills': 'React and Node.js',
            'job_highlights': 'Remote work options, competitive salary, growth opportunities',
            'recruiter_name': 'Sarah Johnson',
            'contact_info': 'sarah@techcorp.ae'
        },
        message_type=MessageType.INITIAL_CONTACT
    )
    
    # Schedule an interview
    interview_id = system.schedule_interview(
        job_id="job_001",
        candidate_id="cand_001",
        recruiter_id="rec_001",
        interview_type=InterviewType.VIDEO_INTERVIEW,
        scheduled_at=datetime.now() + timedelta(days=3),
        meeting_link="https://zoom.us/j/123456789"
    )
    
    print(f"Created conversation: {conv_id}")
    print(f"Scheduled interview: {interview_id}")
    print(f"Analytics: {system.get_messaging_analytics()}")
    print(f"Interview Analytics: {system.get_interview_analytics()}")

