"""The deploy script must reclaim the image it just superseded — and nothing else.

/var on APPQA is 20GB and each backend image is ~2GB, so a deploy moves the
partition by roughly 10% of its size. It reached 92% on 2026-09-01 and a full
/var has previously broken apt AND dockerd on this host.

The script already ran `docker image prune -f`, which removes only DANGLING
images. Every deploy leaves the superseded build TAGGED (:analytics,
:roles-presence, :transcript-fix …), so the prune reported "0B reclaimed" while
the partition filled. The tags accumulated and nothing removed them.

These assert the removal is narrow. A cleanup that takes one thing too many is
worse than none: a blanket `docker container prune` removed the rollback
container on this host earlier the same day.
"""
import os
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

import pytest  # noqa: E402

SCRIPT = os.path.join(os.path.dirname(BACKEND), 'deployment', 'run-backend-appqa.sh')


def script():
    if not os.path.exists(SCRIPT):
        pytest.skip('deploy script not present')
    return open(SCRIPT, encoding='utf-8').read()


def code_only(text):
    """Shell with comment lines removed.

    The script's comments say things like "never `volume prune`" — asserting
    against raw text matches the WARNING and passes for the wrong reason. This
    is the third time today that comments describing a fix have satisfied a
    test meant to check the fix.
    """
    return '\n'.join(l for l in text.split('\n') if not l.lstrip().startswith('#'))


def body():
    """The reclaim section only, so a match elsewhere cannot satisfy these."""
    s = script()
    return code_only(s[s.index('==> Reclaiming space'):])


def test_it_removes_superseded_tagged_images():
    """Dangling-only was the bug: the superseded build always carries a tag."""
    assert 'docker rmi' in body(), \
        'the script still relies on image prune, which cannot touch a tagged image'


def test_the_running_image_is_resolved_from_the_container():
    """A tag can be moved; the container is the truth about what is running."""
    b = body()
    assert 'docker inspect "$NAME"' in b and '{{.Image}}' in b


def test_the_rollback_image_is_protected():
    """Losing this is losing the way back. It has been lost once already."""
    b = body()
    assert '${NAME}_old' in b, 'nothing protects the image the rollback holds'
    assert 'KEEP_ROLLBACK' in b


def test_deliberately_named_images_survive():
    """main and rollback-pre-* are somebody's decision, not deploy litter."""
    b = body()
    assert '*:main' in b and '*:rollback-*' in b


def test_only_backend_images_are_considered():
    """Base images especially must survive: this host is behind a forward proxy
    and a re-pull is not guaranteed to succeed."""
    b = body()
    assert 'docker images emirati_backend' in b, \
        'the removal is not scoped to the backend repository'


def test_it_never_prunes_volumes_or_containers():
    """Uploads live in a volume, and the rollback is a stopped container."""
    s = code_only(script())
    assert 'volume prune' not in s
    assert 'container prune' not in s
    assert 'image prune -a' not in s, 'prune -a would take the base images too'


def test_a_filling_partition_is_announced_before_it_bites():
    b = body()
    assert 'WARNING: /var is' in b, 'a filling partition passes silently'
