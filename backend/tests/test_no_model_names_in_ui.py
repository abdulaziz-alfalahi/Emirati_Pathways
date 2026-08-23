"""User-facing copy must not name the AI model, and the client must not carry
provider API keys.

WHY THIS FILE EXISTS

The public home page advertised "Advanced Gemini 2.5 Pro integration" (owner
feedback fb_1787449408_14c5e9dd, 2026-08-23: "Don't mention which AI model we
are using"). Two separate problems sat in that one sentence:

  1. It named the model at all, which the owner does not want disclosed.
  2. It named the WRONG one. The platform migrated off Gemini to Qwen
     (qwen-turbo / qwen-plus via DashScope — see backend/docs/
     QWEN_MIGRATION_GUIDE.md) and the copy was never updated, so a government
     platform was publicly crediting a vendor it does not use.

The second is why this is a test and not just an edit. Copy that names a model
goes stale the moment the routing changes, and nobody re-reads marketing
strings when they swap a provider. The only durable fix is that the copy never
names one.

Separately: every VITE_-prefixed variable is inlined into import.meta.env and
shipped in the client bundle. VITE_GEMINI_API_KEY and VITE_GROQ_API_KEY were
declared in the frontend env files and read by no code — harmless while the
placeholders were empty, and a key leak to every browser the moment someone
populated them in a build environment.
"""
import json
import os
import re

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND = os.path.join(os.path.dirname(BACKEND), 'frontend')

# Names of models and model vendors. Not a general "AI" ban — "AI",
# "artificial intelligence" and "الذكاء الاصطناعي" are exactly what the copy
# should say instead.
MODEL_NAMES = re.compile(
    r'\b(gemini|qwen|dashscope|gpt-?[45]|chatgpt|openai|anthropic|claude'
    r'|llama|mistral|deepseek|grok|palm|bard)\b',
    re.I,
)


def _locale_files():
    for root in (os.path.join(FRONTEND, 'src', 'locales'),
                 os.path.join(FRONTEND, 'public', 'locales')):
        for dirpath, _dirs, files in os.walk(root):
            for name in files:
                if name.endswith('.json'):
                    yield os.path.join(dirpath, name)


def _strings(node):
    """Every string VALUE in a locale tree. Keys are not shown to users."""
    if isinstance(node, str):
        yield node
    elif isinstance(node, dict):
        for v in node.values():
            yield from _strings(v)
    elif isinstance(node, list):
        for v in node:
            yield from _strings(v)


def test_no_model_name_in_user_facing_copy():
    offenders = []
    for path in _locale_files():
        with open(path, encoding='utf-8') as fh:
            try:
                data = json.load(fh)
            except ValueError as exc:  # a broken locale file is its own bug
                offenders.append(f'{os.path.relpath(path, FRONTEND)}: invalid JSON ({exc})')
                continue
        for text in _strings(data):
            hit = MODEL_NAMES.search(text)
            if hit:
                offenders.append(
                    f'{os.path.relpath(path, FRONTEND)}: {hit.group(0)!r} in {text[:80]!r}')

    assert not offenders, (
        'User-facing copy names an AI model or vendor:\n  '
        + '\n  '.join(offenders)
        + '\n\nSay "AI" / "الذكاء الاصطناعي" instead. Naming the model discloses '
          'what the owner asked to keep undisclosed, and goes stale the moment '
          'the task router changes — the copy said "Gemini 2.5 Pro" for months '
          'after the platform moved to Qwen.'
    )


def test_client_bundle_declares_no_provider_api_key():
    """VITE_ vars reach the browser. Provider keys belong in backend/.env."""
    offenders = []
    for name in os.listdir(FRONTEND):
        if not name.startswith('.env'):
            continue
        path = os.path.join(FRONTEND, name)
        if not os.path.isfile(path):
            continue
        with open(path, encoding='utf-8') as fh:
            for lineno, line in enumerate(fh, 1):
                stripped = line.strip()
                if stripped.startswith('#') or '=' not in stripped:
                    continue
                key = stripped.split('=', 1)[0].strip()
                if key.startswith('VITE_') and re.search(r'(API_)?KEY$|SECRET$|TOKEN$', key):
                    offenders.append(f'{name}:{lineno} {key}')

    assert not offenders, (
        'Frontend env declares a secret that Vite will inline into the client '
        'bundle:\n  ' + '\n  '.join(offenders)
        + '\n\nEvery VITE_-prefixed variable is embedded in the shipped JS. The '
          'backend holds provider keys; the browser never needs one.'
    )
