import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { VideoRoom } from '@/components/common/VideoRoom';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Users, MicOff, UserMinus, RefreshCw, X } from 'lucide-react';

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
  const { toast } = useToast();

  // ── Live participant control (organisers only) ────────────────────
  // Who is actually in the room comes from LiveKit, not from the invitation
  // list: the register says who was asked, this says who is present now.
  const canControl = (() => {
    const roles = [(user as any)?.role, ...(((user as any)?.secondary_roles) || [])]
      .filter(Boolean).map((r: string) => String(r).toLowerCase());
    return roles.some(r => ['board_operator', 'admin', 'administrator', 'platform_operator'].includes(r));
  })();
  const [showPanel, setShowPanel] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadParticipants = async () => {
    if (!meetingId) return;
    try {
      const res = await restClient.get(`/api/board/meetings/${meetingId}/participants`);
      setParticipants(res.data?.data || []);
    } catch {
      setParticipants([]);
    }
  };

  useEffect(() => {
    if (!canControl || !showPanel) return;
    loadParticipants();
    const t = setInterval(loadParticipants, 5000);
    return () => clearInterval(t);
  }, [canControl, showPanel, meetingId]);

  const muteParticipant = async (p: any) => {
    setBusyId(p.identity);
    try {
      const res = await restClient.post(`/api/board/meetings/${meetingId}/participants/mute`,
                                        { identity: p.identity });
      if (!res.data?.success) {
        toast({ title: res.data?.message || 'Could not mute', variant: 'destructive' });
        return;
      }
      toast({ title: `${p.name} was muted` });
      loadParticipants();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || 'Could not mute', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const removeParticipant = async (p: any) => {
    if (!window.confirm(`Remove ${p.name} from this meeting? They can rejoin if they are on the attendee list.`)) return;
    setBusyId(p.identity);
    try {
      const res = await restClient.post(`/api/board/meetings/${meetingId}/participants/remove`,
                                        { identity: p.identity });
      if (!res.data?.success) {
        toast({ title: res.data?.message || 'Could not remove', variant: 'destructive' });
        return;
      }
      toast({ title: `${p.name} was removed from the room` });
      loadParticipants();
    } catch (e: any) {
      toast({ title: e?.response?.data?.message || 'Could not remove', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

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

  // /board-portal is a redirect to the board member dashboard, so it sent the
  // secretary to the wrong place on leaving. Return each role to the workspace
  // it joined from.
  const leave = () => {
    // Tell the server we have gone, so attendance duration is measured rather
    // than assumed. keepalive lets the request survive the navigation away.
    if (meetingId) {
      restClient.post(`/api/board/meetings/${meetingId}/leave`, {}).catch(() => {});
    }
    const roles = [
      (user as any)?.role,
      ...(((user as any)?.secondary_roles) || []),
    ]
      .filter(Boolean)
      .map((r: string) => String(r).toLowerCase());
    navigate(roles.includes('board_operator') ? '/board-secretary' : '/executive?tab=meetings');
  };

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
        {canControl && (
          <Button
            variant="outline"
            size="sm"
            className="ms-auto gap-2"
            onClick={() => setShowPanel(v => !v)}
          >
            <Users className="h-4 w-4" />
            {showPanel ? 'Hide participants' : 'Participants'}
          </Button>
        )}
      </div>
      <div className="flex-1 min-h-0 p-3 flex gap-3">
        {canControl && showPanel && (
          <aside className="w-72 shrink-0 rounded-xl bg-white border overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-2 border-b">
              <span className="text-sm font-semibold text-slate-900">
                In the room ({participants.length})
              </span>
              <div className="flex items-center gap-1">
                <button onClick={loadParticipants} title="Refresh" className="p-1 text-slate-500 hover:text-slate-800">
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setShowPanel(false)} title="Close" className="p-1 text-slate-500 hover:text-slate-800">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {participants.length === 0 ? (
              <p className="p-3 text-xs text-slate-500">
                Nobody has joined yet. This list shows who is connected right now.
              </p>
            ) : (
              <ul className="divide-y">
                {participants.map((p) => (
                  <li key={p.identity} className="p-3 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.is_invited ? 'On the attendee list' : 'Not on the attendee list'}
                        {p.sharing_screen ? ' · presenting' : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm" variant="outline" className="h-7 px-2 text-xs gap-1"
                        disabled={busyId === p.identity || p.mic_muted === true}
                        onClick={() => muteParticipant(p)}
                        title={p.mic_muted === true ? 'Already muted' : 'Mute this microphone'}
                      >
                        <MicOff className="h-3 w-3" />
                        {p.mic_muted === true ? 'Muted' : 'Mute'}
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        className="h-7 px-2 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={busyId === p.identity}
                        onClick={() => removeParticipant(p)}
                      >
                        <UserMinus className="h-3 w-3" /> Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="px-3 py-2 text-[11px] leading-relaxed text-slate-500 border-t">
              Removing someone disconnects them but keeps them in the attendance
              record — they were in the meeting. Microphones can be muted but not
              switched back on remotely.
            </p>
          </aside>
        )}
        <div className="flex-1 min-h-0">
        <VideoRoom
          sessionId={meetingId || ''}
          userId={user?.id?.toString() || 'board-member'}
          userName={(user as any)?.full_name || (user as any)?.name || 'Board member'}
          onEndCall={leave}
          remoteLabel={{ name: 'Board member', role: 'EHRDC Board' }}
          livekitUrl={url}
          token={token}
        />
        </div>
      </div>
    </div>
  );
};

export default BoardMeetingRoom;
