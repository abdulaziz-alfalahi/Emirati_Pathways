
import React from 'react';
import EnhancedEventSessions from './EnhancedEventSessions';

interface EventSessionsProps {
  eventId: string;
}

const EventSessions: React.FC<EventSessionsProps> = ({ eventId }) => {
  return <EnhancedEventSessions eventId={eventId} />;
};

export default EventSessions;
