
-- Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- 'info', 'warning', 'success', 'urgent'
  link TEXT, -- Optional link for the notification
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for users to update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for inserting notifications (for system use)
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Insert some mockup data (these will be assigned to the first user in the system)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Get the first user ID from auth.users
    SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    -- Only insert if we found a user
    IF first_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, link, is_read)
        VALUES
          (
            first_user_id,
            'Scholarship Application Update',
            'Your application for the "Future Leaders Scholarship" has been updated. Click to view details.',
            'info',
            '/scholarships',
            FALSE
          ),
          (
            first_user_id,
            'New Mentorship Opportunity',
            'A new mentor matching your interests in "Software Development" is available. Check their profile!',
            'success',
            '/mentorship',
            FALSE
          ),
          (
            first_user_id,
            'Upcoming Event Reminder',
            'Don''t forget the "Tech Innovators Meetup" tomorrow at 2 PM. Add to your calendar!',
            'urgent',
            '/communities',
            TRUE
          ),
          (
            first_user_id,
            'Profile Completion',
            'Complete your profile to unlock more opportunities and improve your visibility.',
            'warning',
            '/profile',
            FALSE
          ),
          (
            first_user_id,
            'Welcome to the Platform',
            'Welcome! Explore all the features available to help advance your career.',
            'success',
            '/dashboard',
            TRUE
          );
    END IF;
END $$;
