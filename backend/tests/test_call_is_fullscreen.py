"""A live call takes the whole screen.

Reported by a candidate mid-interview (fb_1788181301): "Whenever I click on
Dashboard tabs it's taking me out of the interview."

The first fix stopped a stray navigation ENDING the interview, but the call was
still a frame inside the dashboard — rendered into `h-[calc(100vh-100px)]` with
the navigation and its tabs above it the whole time. Owner, 2026-09-01: "That is
a distraction for the candidate, I think we could fix this by making the video
interview full screen."

That is the better fix. No warning dialog makes a tab bar less tempting than not
showing one, and nobody puts a navigation menu above a video call.

CoachDashboard already did this — it returns early so the dashboard never
renders behind a live coaching call. The interview flow did not.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend', 'src')
STAGE = os.path.join(FRONTEND, 'components', 'common', 'CallStage.tsx')
EMBEDS = {
    'candidate': os.path.join(FRONTEND, 'components', 'candidate', 'Interviews.tsx'),
    'recruiter': os.path.join(FRONTEND, 'components', 'recruiter', 'Interviews.tsx'),
}


def tsx(path):
    if not os.path.exists(path):
        pytest.skip(f'{os.path.basename(path)} not present')
    src = open(path, encoding='utf-8').read()
    out, i, n = [], 0, len(src)
    while i < n:
        two = src[i:i + 2]
        if two == '/*':
            j = src.find('*/', i + 2); i = n if j == -1 else j + 2
        elif two == '//':
            j = src.find('\n', i); i = n if j == -1 else j
        else:
            out.append(src[i]); i += 1
    return ''.join(out)


@pytest.mark.parametrize('who', sorted(EMBEDS))
def test_the_call_is_not_a_frame_in_the_dashboard(who):
    code = tsx(EMBEDS[who])
    assert 'CallStage' in code, f'the {who} call is still embedded in the page'
    assert 'h-[calc(100vh-100px)]' not in code, \
        f'the {who} call is still sized to sit below the navigation'


def test_the_stage_escapes_its_parent():
    """`position: fixed` is relative to the nearest ancestor with a transform or
    containment, and dashboard layouts are full of them — the call would be
    clipped by whichever panel it happened to live inside."""
    code = tsx(STAGE)
    assert 'createPortal' in code
    assert 'document.body' in code


def test_the_stage_covers_the_viewport():
    code = tsx(STAGE)
    assert "position: 'fixed'" in code and 'inset: 0' in code


def test_a_stray_keypress_cannot_drop_someone_out_of_an_interview():
    """Escape-to-close and click-outside are normal for a modal and wrong here.
    The only way out is the call's own Leave control."""
    code = tsx(STAGE)
    assert 'Escape' not in code, 'Escape would close a live interview'
    assert 'onClick' not in code, 'a click on the backdrop would close the call'


def test_the_page_behind_cannot_scroll():
    code = tsx(STAGE)
    assert "document.body.style.overflow = 'hidden'" in code
    assert 'previous' in code, 'the previous overflow value is not restored'


def test_the_stage_is_announced_to_assistive_technology():
    code = tsx(STAGE)
    assert 'role="dialog"' in code and 'aria-modal' in code and 'aria-label' in code


def test_the_call_fills_the_stage():
    """VideoRoom sizes itself with h-full, so the stage has to give it a child
    that actually fills."""
    code = tsx(STAGE)
    assert 'flex: 1' in code and 'minHeight: 0' in code
