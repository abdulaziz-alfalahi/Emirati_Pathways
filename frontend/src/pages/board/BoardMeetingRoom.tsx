import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { VideoRoom } from '@/components/common/VideoRoom';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

/**
 * Board meeting video room.
 *
 * Reuses the same VideoRoom component as interviews — the stack is proven, and
 * the premature-teardown fix applies here too. The token comes from
 * POST /api/board/meetings/:id/join, which also enforces the attendee list and
 * the join window and records attendance for quorum.
 *
 * Navigating here directly (bookmark, refresh) re-requests the token rather
 * than failing, so a member who reloads mid-meeting rejoins cleanly.
 */
const BoardMeetingRoom: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { state } = useLocation() as { state?: { token?: string; url?: string; title?: string } };
  const navigate = useNavigate();
  const { user } = useAuth();

  const [token, setToken] = useState<string | undefined>(state?.token);
  const [url, setUrl] = useState<string | undefined>(state?.url);
  const [title, setTitle] = useState<string>(state?.title || 'Board meeting');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!state?.token);

  useEffect(() => {
    if (token || !meetingId) return;
    (async () => {
      try {
        const res = await restClient.post(`/api/board/meetings/${meetingId}/join`);
        const d = res.data?.data;
        if (!res.data?.success || !d?.token) {
          setError(res.data?.message || 'Could not join this meeting.');
        } else {
          setToken(d.token); setUrl(d.livekit_url); setTitle(d.meeting_title || title);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Could not join this meeting.');
      } finally {
        setLoading(false);
      }
    })();
  }, [meetingId, token, title]);

  const leave = () => navigate('/board-portal?tab=meetings');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="max-w-md text-center bg-white border rounded-2xl p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Unable to join</h1>
          <p className="text-slate-600 text-sm">{error || 'No access token for this meeting.'}</p>
          <Button variant="outline" className="mt-6" onClick={leave}>
            <ArrowLeft className="h-4 w-4 me-2" /> Back to the board portal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b">
        <Button variant="ghost" size="sm" onClick={leave}>
          <ArrowLeft className="h-4 w-4 me-2" /> Leave
        </Button>
        <h1 className="text-sm font-semibold text-slate-900 truncate">{title}</h1>
      </div>
      <div className="flex-1 min-h-0 p-3">
        <VideoRoom
          sessionId={meetingId || ''}
          userId={user?.id?.toString() || 'board-member'}
          userName={(user as any)?.full_name || (user as any)?.name || 'Board member'}
          onEndCall={leave}
          livekitUrl={url}
          token={token}
        />
      </div>
    </div>
  );
};

export default BoardMeetingRoom;
