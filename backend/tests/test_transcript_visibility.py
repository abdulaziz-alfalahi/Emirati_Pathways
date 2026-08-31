"""Transcription that is happening must not look like transcription that isn't.

Reported 2026-08-31, mid-interview: "The transcription is showing it is
happening but it is not." Both halves were true at once — the agent had
captured 192 correctly-labelled segments, and not one of them could reach the
person in the call. Three separate faults produced that:

  1. a badge reading "AI Transcribe Active" with no condition behind it
  2. captions published to a data topic nothing subscribed to
  3. a transcript filed under the room name and fetched by the interview id,
     answering `success: true` with an empty list

The third is the dangerous one: a silent empty success reads as data loss.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

from tests.source_utils import comments_only_removed  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')
VIDEO_ROOM = os.path.join(FRONTEND, 'components', 'common', 'VideoRoom.tsx')
ROUTES = os.path.join(BACKEND, 'video_interview_routes.py')
AGENT = os.path.join(BACKEND, 'agent.py')


def read(path):
    if not os.path.exists(path):
        pytest.skip(f'{os.path.basename(path)} not present')
    return open(path, encoding='utf-8').read()


def tsx_code_only(src):
    """TSX with comments stripped.

    Needed because the comments in VideoRoom.tsx describe the bug and therefore
    quote the exact strings these tests forbid. Asserting against raw source
    matches the explanation of the fix instead of the fix — which is how this
    file first failed.
    """
    out, i, n = [], 0, len(src)
    while i < n:
        two = src[i:i + 2]
        if two == '/*':
            j = src.find('*/', i + 2)
            i = n if j == -1 else j + 2
        elif two == '//':
            j = src.find('\n', i)
            i = n if j == -1 else j
        else:
            out.append(src[i])
            i += 1
    return ''.join(out)


# ── 3. the transcript must be reachable by either identifier ────────────────

def test_the_transcript_lookup_tries_the_room_name_as_well():
    """The interview id alone matched nothing, because segments are filed under
    the room. Fetching by either identifier has to work."""
    body = comments_only_removed(read(ROUTES))
    start = body.index('def get_session_transcript')
    end = body.index('def ', start + 10)
    fn = body[start:end]
    assert 'meeting_link' in fn, \
        'the transcript lookup never resolves the room name from meeting_link'
    assert 'ANY(' in fn or 'IN (' in fn, \
        'the lookup still matches a single key, so one of the two ids returns nothing'


def test_the_room_name_is_derived_the_same_way_the_call_derives_it():
    """start_interview_session takes the last path segment of meeting_link. If
    the transcript derived it differently the two would drift apart again."""
    fn = comments_only_removed(read(ROUTES))
    fn = fn[fn.index('def get_session_transcript'):]
    assert "split('/')" in fn, \
        'the room name is not taken from the last path segment of meeting_link'


# ── 2. captions must actually be received ──────────────────────────────────

def test_the_call_ui_subscribes_to_the_caption_topic():
    """The agent published to `transcription` for months with no subscriber."""
    code = tsx_code_only(read(VIDEO_ROOM))
    assert 'useDataChannel' in code, \
        'nothing subscribes to the data channel — captions are dropped'
    assert "'transcription'" in code, \
        'the caption topic name is missing'


def test_the_topic_name_matches_what_the_agent_publishes():
    """A typo here loses every caption in exactly the way that was reported,
    with no error anywhere."""
    agent = read(AGENT)
    assert "topic='transcription'" in agent, \
        'the agent no longer publishes on the topic the UI subscribes to'


def test_a_malformed_caption_cannot_break_the_call():
    code = tsx_code_only(read(VIDEO_ROOM))
    # the CALL SITE, not the import line
    call = code.index("useDataChannel('transcription'")
    handler = code[call:call + 600]
    assert 'catch' in handler, \
        'an unparseable data packet would throw inside a live call'


# ── 1. the status must be derived, never asserted ──────────────────────────

def test_no_unconditional_transcription_claim_survives():
    """The original badge was a plain div. Any hard-coded "active" claim is the
    bug returning. Comments are stripped first: the ones in that file quote the
    old badge to explain why it went."""
    code = tsx_code_only(read(VIDEO_ROOM))
    assert 'AI Transcribe Active' not in code, \
        'the unconditional "AI Transcribe Active" badge is back'


def test_the_status_comes_from_the_agent_being_in_the_room():
    code = tsx_code_only(read(VIDEO_ROOM))
    assert 'useRemoteParticipants' in code, \
        'the transcription status is not derived from who is actually in the room'
    assert 'transcription-agent' in code, \
        'nothing checks for the transcription agent'


def test_it_says_so_when_transcription_is_not_running():
    """The failure state is the whole point — a status that can only say "on"
    is the badge again."""
    code = tsx_code_only(read(VIDEO_ROOM))
    assert 'Transcription not running' in code or 'not available' in code, \
        'there is no wording for transcription being off'


# ── the interview must actually be closed when it ends ──────────────────────
#
# Found 2026-08-31: an interview that had plainly finished was still
# `status=in_progress` with no `ended_at`. Leaving the call only navigated;
# nothing told the backend. The attendance rule that decides `completed` vs
# `no_show` runs on that call, so every interview stayed open for ever.

VIDEO_PAGE = os.path.join(FRONTEND, 'pages', 'recruiter', 'VideoInterviewPage.tsx')


def test_finishing_the_call_tells_the_backend():
    code = tsx_code_only(read(VIDEO_PAGE))
    assert '/end' in code, \
        'ending the interview never posts to the end endpoint — the record stays open'


def test_a_dropped_connection_does_not_close_the_interview():
    """A network blip is not somebody finishing. Closing the record on any
    disconnect would mark a live interview complete while it is still running."""
    room = tsx_code_only(read(VIDEO_ROOM))
    assert 'CLIENT_INITIATED' in room, \
        'the disconnect reason is ignored, so a dropped call looks like leaving'
    page = tsx_code_only(read(VIDEO_PAGE))
    assert 'deliberate' in page, \
        'the page cannot tell a deliberate leave from a dropped connection'


def test_a_failed_stamp_cannot_trap_someone_in_the_call():
    page = tsx_code_only(read(VIDEO_PAGE))
    start = page.index('handleEndSession')
    assert 'catch' in page[start:start + 900], \
        'if recording the end fails, the person is never navigated out'
