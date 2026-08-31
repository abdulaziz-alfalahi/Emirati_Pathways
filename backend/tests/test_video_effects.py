"""Camera effects and microphone processing for a live interview.

Requested 2026-08-31, during a real interview (fb_1788181374): "There is no
filter to blur the background for both parties."

Two things came out of that. The blur itself, and — found while adding it — the
platform was asking browsers for a completely RAW microphone: no echo
cancellation, no noise suppression, no gain control anywhere in the codebase.
An interview carried the candidate's room echo, keyboard and air conditioning
straight through, and a quiet speaker stayed quiet.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend')
SRC = os.path.join(FRONTEND, 'src')
EFFECTS = os.path.join(SRC, 'components', 'common', 'VideoEffects.tsx')
ROOM = os.path.join(SRC, 'components', 'common', 'VideoRoom.tsx')
ASSETS = os.path.join(FRONTEND, 'public', 'mediapipe')


def code(path):
    if not os.path.exists(path):
        pytest.skip(f'{os.path.basename(path)} not present')
    src = open(path, encoding='utf-8').read()
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
            out.append(src[i]); i += 1
    return ''.join(out)


# ── the effect must reach the other side ────────────────────────────────────

def test_the_effect_is_applied_to_the_published_track():
    """A CSS filter would blur only your own preview and leave your room on
    show to the interviewer. It has to be a track processor."""
    body = code(EFFECTS)
    assert 'setProcessor' in body, \
        'the effect is not applied to the published track, so nobody else sees it'
    assert 'Track.Source.Camera' in body


def test_turning_the_effect_off_removes_the_processor():
    body = code(EFFECTS)
    assert 'stopProcessor' in body, 'there is no way back to an unprocessed camera'


def test_the_processor_is_torn_down_when_the_control_unmounts():
    """Leaving a segmenter running on a track after the call would keep burning
    CPU on the participant's machine."""
    body = code(EFFECTS)
    tail = body[body.rindex('useEffect'):]
    assert 'stopProcessor' in tail, 'the processor outlives the control'


# ── it must not depend on the public internet ───────────────────────────────

def test_the_model_and_wasm_are_served_by_the_platform():
    """The library's DEFAULT fetches WebAssembly from cdn.jsdelivr.net and the
    model from storage.googleapis.com, from the participant's own browser. This
    network already blocks outbound STUN; betting an interview feature on a
    reachable CDN is a bet that loses, and it would put every participant's
    browser in touch with two third parties."""
    body = code(EFFECTS)
    assert 'assetPaths' in body, 'the library will fall back to its CDN defaults'
    assert '/mediapipe/wasm' in body
    assert '/mediapipe/selfie_segmenter.tflite' in body
    assert 'cdn.jsdelivr.net' not in body
    assert 'storage.googleapis.com' not in body


def test_those_assets_actually_exist():
    """An assetPaths pointing at nothing fails at the moment a candidate
    switches the effect on — which is the worst possible moment to find out."""
    if not os.path.isdir(ASSETS):
        pytest.skip('assets not present in this checkout')
    model = os.path.join(ASSETS, 'selfie_segmenter.tflite')
    assert os.path.exists(model), 'the segmentation model is not served'
    assert os.path.getsize(model) > 100_000, 'the model file is truncated'
    wasm = os.path.join(ASSETS, 'wasm')
    names = set(os.listdir(wasm)) if os.path.isdir(wasm) else set()
    assert 'vision_wasm_internal.wasm' in names
    # The no-SIMD build is the fallback for older machines. Shipping only the
    # fast one means the effect 404s for exactly the people most likely to have
    # an older laptop.
    assert 'vision_wasm_nosimd_internal.wasm' in names, \
        'no fallback build — older browsers would 404 on the wasm'


# ── it must degrade honestly ────────────────────────────────────────────────

def test_an_unsupported_browser_is_told_so():
    body = code(EFFECTS)
    assert 'supportsBackgroundProcessors' in body, 'nothing checks for support'
    assert 'not available in this browser' in body


def test_a_failure_returns_the_camera_to_normal():
    """If segmentation fails halfway, the person must not be left with a frozen
    or half-processed picture in a job interview."""
    body = code(EFFECTS)
    catch = body[body.index('catch'):]
    assert 'stopProcessor' in catch and "setMode('none')" in catch


def test_the_library_is_only_loaded_when_needed():
    """It pulls in a 19MB WebAssembly runtime. Nobody who never opens a call
    should download that."""
    body = code(EFFECTS)
    assert "await import('@livekit/track-processors')" in body, \
        'the processor library is imported eagerly'


def test_the_effect_is_off_until_someone_chooses_it():
    """Segmentation runs per frame and competes with the call on a modest
    laptop — which is what a candidate at home is likely to have."""
    body = code(EFFECTS)
    assert "useState<EffectMode>('none')" in body


# ── more than blur ──────────────────────────────────────────────────────────

def test_there_is_more_than_one_effect():
    body = code(EFFECTS)
    for mode in ('background-blur', 'virtual-background'):
        assert mode in body, f'{mode} is not offered'
    assert 'blur-strong' in body, 'blur strength cannot be varied'


def test_the_controls_are_reachable_without_a_mouse():
    body = code(EFFECTS)
    assert 'role="radiogroup"' in body and 'aria-checked' in body


# ── the microphone ──────────────────────────────────────────────────────────

def test_the_microphone_is_processed():
    """None of these were set anywhere in the codebase. They cost nothing and
    they change what the interviewer HEARS."""
    body = code(ROOM)
    for constraint in ('echoCancellation', 'noiseSuppression', 'autoGainControl'):
        assert f'{constraint}: true' in body, f'{constraint} is not requested'
