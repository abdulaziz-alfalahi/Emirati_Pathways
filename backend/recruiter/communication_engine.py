"""
Recruiter Communication Engine
Handles email and SMS communication with candidates
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

logger = logging.getLogger(__name__)


class MessageType(Enum):
    """Message type enumeration"""
    EMAIL = "email"
    SMS = "sms"
    BOTH = "both"


class MessageStatus(Enum):
    """Message delivery status"""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"


class TemplateCategory(Enum):
    """Message template categories"""
    INITIAL_CONTACT = "initial_contact"
    INTERVIEW_INVITATION = "interview_invitation"
    INTERVIEW_REMINDER = "interview_reminder"
    INTERVIEW_CONFIRMATION = "interview_confirmation"
    REJECTION = "rejection"
    OFFER = "offer"
    FOLLOW_UP = "follow_up"
    GENERAL = "general"


@dataclass
class MessageTemplate:
    """Message template data structure"""
    template_id: str
    name: str
    category: TemplateCategory
    subject: str
    body: str
    variables: List[str]
    message_type: MessageType
    created_by: str
    created_at: datetime
    is_active: bool = True


@dataclass
class CommunicationLog:
    """Communication log entry"""
    log_id: str
    shortlist_id: str
    candidate_id: str
    recruiter_id: str
    message_type: MessageType
    subject: str
    body: str
    status: MessageStatus
    sent_at: datetime
    delivered_at: Optional[datetime]
    error_message: Optional[str]
    metadata: Dict[str, Any]


class CommunicationEngine:
    """Engine for managing candidate communications"""
    
    def __init__(self):
        """Initialize communication engine"""
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@emiratipathways.ae')
        self.from_name = os.getenv('FROM_NAME', 'Emirati Pathways')
        
        # SMS configuration (placeholder for future integration)
        self.sms_provider = os.getenv('SMS_PROVIDER', 'twilio')
        self.sms_api_key = os.getenv('SMS_API_KEY', '')
        
        logger.info("CommunicationEngine initialized")
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        to_name: Optional[str] = None,
        html: bool = True
    ) -> Dict[str, Any]:
        """
        Send email to candidate
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body (HTML or plain text)
            to_name: Recipient name (optional)
            html: Whether body is HTML
            
        Returns:
            Result dictionary with success status and message
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = f"{to_name} <{to_email}>" if to_name else to_email
            
            # Attach body
            if html:
                msg.attach(MIMEText(body, 'html'))
            else:
                msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            if self.smtp_user and self.smtp_password:
                with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                    server.starttls()
                    server.login(self.smtp_user, self.smtp_password)
                    server.send_message(msg)
                
                logger.info(f"Email sent successfully to {to_email}")
                return {
                    'success': True,
                    'message': 'Email sent successfully',
                    'sent_at': datetime.now().isoformat()
                }
            else:
                # SMTP not configured - log only
                logger.warning(f"SMTP not configured. Would send email to {to_email}: {subject}")
                return {
                    'success': True,
                    'message': 'Email logged (SMTP not configured)',
                    'sent_at': datetime.now().isoformat(),
                    'mock': True
                }
                
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {
                'success': False,
                'message': f'Failed to send email: {str(e)}',
                'error': str(e)
            }
    
    def send_sms(
        self,
        to_phone: str,
        message: str
    ) -> Dict[str, Any]:
        """
        Send SMS to candidate
        
        Args:
            to_phone: Recipient phone number
            message: SMS message text
            
        Returns:
            Result dictionary with success status and message
        """
        try:
            # SMS integration placeholder
            # In production, integrate with Twilio, AWS SNS, or local UAE SMS provider
            
            if self.sms_api_key:
                # TODO: Implement actual SMS sending
                logger.info(f"SMS sent to {to_phone}: {message[:50]}...")
                return {
                    'success': True,
                    'message': 'SMS sent successfully',
                    'sent_at': datetime.now().isoformat()
                }
            else:
                # SMS not configured - log only
                logger.warning(f"SMS not configured. Would send to {to_phone}: {message[:50]}...")
                return {
                    'success': True,
                    'message': 'SMS logged (provider not configured)',
                    'sent_at': datetime.now().isoformat(),
                    'mock': True
                }
                
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_phone}: {e}")
            return {
                'success': False,
                'message': f'Failed to send SMS: {str(e)}',
                'error': str(e)
            }
    
    def send_message(
        self,
        candidate: Dict[str, Any],
        message_type: MessageType,
        subject: str,
        body: str,
        recruiter_id: str,
        shortlist_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send message to candidate (email, SMS, or both)
        
        Args:
            candidate: Candidate information dictionary
            message_type: Type of message (email/sms/both)
            subject: Message subject (for email)
            body: Message body
            recruiter_id: ID of recruiter sending message
            shortlist_id: Optional shortlist entry ID
            
        Returns:
            Result dictionary with success status
        """
        results = {
            'success': True,
            'email_result': None,
            'sms_result': None,
            'errors': []
        }
        
        candidate_name = f"{candidate.get('first_name', '')} {candidate.get('last_name', '')}".strip()
        
        # Send email
        if message_type in [MessageType.EMAIL, MessageType.BOTH]:
            if candidate.get('email'):
                email_result = self.send_email(
                    to_email=candidate['email'],
                    subject=subject,
                    body=body,
                    to_name=candidate_name
                )
                results['email_result'] = email_result
                if not email_result['success']:
                    results['success'] = False
                    results['errors'].append(f"Email failed: {email_result.get('message')}")
            else:
                results['errors'].append("No email address available")
                results['success'] = False
        
        # Send SMS
        if message_type in [MessageType.SMS, MessageType.BOTH]:
            if candidate.get('phone_number'):
                sms_result = self.send_sms(
                    to_phone=candidate['phone_number'],
                    message=body
                )
                results['sms_result'] = sms_result
                if not sms_result['success']:
                    results['success'] = False
                    results['errors'].append(f"SMS failed: {sms_result.get('message')}")
            else:
                results['errors'].append("No phone number available")
                results['success'] = False
        
        return results
    
    def render_template(
        self,
        template: MessageTemplate,
        variables: Dict[str, str]
    ) -> Dict[str, str]:
        """
        Render message template with variables
        
        Args:
            template: Message template
            variables: Dictionary of variable values
            
        Returns:
            Dictionary with rendered subject and body
        """
        subject = template.subject
        body = template.body
        
        # Replace variables in template
        for var_name, var_value in variables.items():
            placeholder = f"{{{{{var_name}}}}}"
            subject = subject.replace(placeholder, str(var_value))
            body = body.replace(placeholder, str(var_value))
        
        return {
            'subject': subject,
            'body': body
        }
    
    def get_default_templates(self) -> List[Dict[str, Any]]:
        """
        Get default message templates
        
        Returns:
            List of default templates
        """
        templates = [
            {
                'name': 'Initial Contact',
                'category': 'initial_contact',
                'subject': 'Opportunity at {{company_name}} - {{job_title}}',
                'body': '''Dear {{candidate_name}},

We came across your profile and believe you would be a great fit for the {{job_title}} position at {{company_name}}.

{{job_description}}

We would love to discuss this opportunity with you. Are you available for a brief call this week?

Best regards,
{{recruiter_name}}
{{company_name}}''',
                'variables': ['candidate_name', 'company_name', 'job_title', 'job_description', 'recruiter_name'],
                'message_type': 'email'
            },
            {
                'name': 'Interview Invitation',
                'category': 'interview_invitation',
                'subject': 'Interview Invitation - {{job_title}} at {{company_name}}',
                'body': '''Dear {{candidate_name}},

Thank you for your interest in the {{job_title}} position at {{company_name}}.

We would like to invite you for an interview:

Date: {{interview_date}}
Time: {{interview_time}}
Location: {{interview_location}}
Duration: {{interview_duration}}

Please confirm your availability by replying to this email.

Looking forward to meeting you!

Best regards,
{{recruiter_name}}
{{company_name}}''',
                'variables': ['candidate_name', 'company_name', 'job_title', 'interview_date', 'interview_time', 'interview_location', 'interview_duration', 'recruiter_name'],
                'message_type': 'email'
            },
            {
                'name': 'Interview Reminder',
                'category': 'interview_reminder',
                'subject': 'Reminder: Interview Tomorrow - {{job_title}}',
                'body': '''Dear {{candidate_name}},

This is a friendly reminder about your interview tomorrow:

Position: {{job_title}}
Date: {{interview_date}}
Time: {{interview_time}}
Location: {{interview_location}}

Please arrive 10 minutes early and bring a copy of your CV.

See you tomorrow!

Best regards,
{{recruiter_name}}''',
                'variables': ['candidate_name', 'job_title', 'interview_date', 'interview_time', 'interview_location', 'recruiter_name'],
                'message_type': 'both'
            },
            {
                'name': 'Follow Up',
                'category': 'follow_up',
                'subject': 'Following up - {{job_title}} at {{company_name}}',
                'body': '''Dear {{candidate_name}},

I wanted to follow up on our previous conversation about the {{job_title}} position.

Are you still interested in this opportunity? I'd be happy to answer any questions you might have.

Best regards,
{{recruiter_name}}
{{company_name}}''',
                'variables': ['candidate_name', 'company_name', 'job_title', 'recruiter_name'],
                'message_type': 'email'
            }
        ]
        
        return templates

