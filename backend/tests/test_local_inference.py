"""Everything on the balancer, nothing to DashScope (owner direction 2026-09-06).

The config decides from QWEN_BASE_URL whether the endpoint is inside the
tenancy; that single fact drives the proxy bypass, the placeholder API key,
the thinking-off flag and the vision model. These tests reload the config
under different environments; no network, no database.
"""
import importlib
import os
import sys

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))


def _config(monkeypatch, **env):
    for k in ('QWEN_BASE_URL', 'QWEN_LOCAL_MODEL', 'QWEN_API_KEY', 'DASHSCOPE_API_KEY',
              'QWEN_THINKING_TASKS', 'QWEN_VISION_MODEL', 'QWEN_PARSE_MODEL', 'NO_PROXY'):
        monkeypatch.delenv(k, raising=False)
    # the config calls load_dotenv(), which would resurrect the developer's
    # DASHSCOPE_API_KEY from backend/.env; an explicit empty value stops that
    monkeypatch.setenv('DASHSCOPE_API_KEY', '')
    for k, v in env.items():
        monkeypatch.setenv(k, v)
    from backend.config import qwen_config
    return importlib.reload(qwen_config)


@pytest.mark.parametrize('url, internal', [
    ('http://10.228.145.195:8001/v1', True),
    ('http://127.0.0.1:8010/v1', True),
    ('http://localhost:8000/v1', True),
    ('http://192.168.1.5/v1', True),
    ('http://172.20.0.3/v1', True),
    ('https://dashscope-intl.aliyuncs.com/compatible-mode/v1', False),
    ('https://api.example.com/v1', False),
])
def test_internal_endpoint_detection(monkeypatch, url, internal):
    cfg = _config(monkeypatch, QWEN_BASE_URL=url)
    assert cfg.QWEN_IS_LOCAL is internal


def test_no_proxy_entry_counts_as_internal(monkeypatch):
    cfg = _config(monkeypatch, QWEN_BASE_URL='http://llm.internal.example/v1', NO_PROXY='localhost,llm.internal.example')
    assert cfg.QWEN_IS_LOCAL


def test_local_endpoint_needs_no_vendor_key(monkeypatch):
    cfg = _config(monkeypatch, QWEN_BASE_URL='http://10.228.145.195:8001/v1')
    assert cfg.QWEN_API_KEY == 'local'
    cfg = _config(monkeypatch, QWEN_BASE_URL='https://dashscope-intl.aliyuncs.com/compatible-mode/v1')
    assert cfg.QWEN_API_KEY == ''      # DashScope without a key is disabled, as before


def test_local_model_routes_every_task_and_vision(monkeypatch):
    cfg = _config(monkeypatch, QWEN_BASE_URL='http://10.228.145.195:8001/v1', QWEN_LOCAL_MODEL='Qwen/Qwen3.8-27B-FP8')
    assert set(cfg.MODEL_ROUTING.values()) == {'Qwen/Qwen3.8-27B-FP8'}
    assert cfg.DEFAULT_MODEL == 'Qwen/Qwen3.8-27B-FP8'
    assert cfg.QWEN_VISION_MODEL == 'Qwen/Qwen3.8-27B-FP8'
    assert cfg.COST_PER_MILLION_TOKENS['Qwen/Qwen3.8-27B-FP8'] == {'input': 0.0, 'output': 0.0}
    assert cfg.get_model_for_task('anything-new') == 'Qwen/Qwen3.8-27B-FP8'


def test_per_task_override_still_wins(monkeypatch):
    cfg = _config(monkeypatch, QWEN_BASE_URL='http://10.228.145.195:8001/v1',
                  QWEN_LOCAL_MODEL='Qwen/Qwen3.8-27B-FP8', QWEN_PARSE_MODEL='Qwen/Qwen3.6-35B-A3B-FP8')
    assert cfg.MODEL_ROUTING['parse'] == 'Qwen/Qwen3.6-35B-A3B-FP8'
    assert cfg.MODEL_ROUTING['match'] == 'Qwen/Qwen3.8-27B-FP8'


def test_dashscope_defaults_unchanged_without_local_model(monkeypatch):
    cfg = _config(monkeypatch, QWEN_BASE_URL='https://dashscope-intl.aliyuncs.com/compatible-mode/v1', DASHSCOPE_API_KEY='k')
    assert cfg.MODEL_ROUTING['parse'] == 'qwen-turbo' and cfg.MODEL_ROUTING['generate'] == 'qwen-max'
    assert cfg.QWEN_VISION_MODEL == 'qwen-vl-ocr'


def test_thinking_is_off_locally_unless_opted_in(monkeypatch):
    _config(monkeypatch, QWEN_BASE_URL='http://10.228.145.195:8001/v1', QWEN_THINKING_TASKS='explain')
    from backend.services import qwen_client
    qc = importlib.reload(qwen_client)
    assert qc.request_extras('parse') == {'chat_template_kwargs': {'enable_thinking': False}}
    assert qc.request_extras('explain') == {'chat_template_kwargs': {'enable_thinking': True}}
    _config(monkeypatch, QWEN_BASE_URL='https://dashscope-intl.aliyuncs.com/compatible-mode/v1', DASHSCOPE_API_KEY='k')
    qc = importlib.reload(qwen_client)
    assert qc.request_extras('parse') == {}   # never sent to DashScope


def test_ocr_content_has_no_dashscope_hints_locally(monkeypatch):
    _config(monkeypatch, QWEN_BASE_URL='http://10.228.145.195:8001/v1')
    from backend.services import pdf_extractor
    pe = importlib.reload(pdf_extractor)
    content = pe.ocr_image_content('AAAA', 'image/png')
    assert content[0]['type'] == 'image_url' and 'min_pixels' not in content[0]
    assert content[1]['type'] == 'text'
    _config(monkeypatch, QWEN_BASE_URL='https://dashscope-intl.aliyuncs.com/compatible-mode/v1', DASHSCOPE_API_KEY='k')
    pe = importlib.reload(pdf_extractor)
    assert 'min_pixels' in pe.ocr_image_content('AAAA', 'image/png')[0]


def test_recruiter_overall_is_the_formula_over_sub_scores():
    from backend.services.matching_engine import recompute_overall
    r = {'skills_match_score': 80, 'experience_relevance_score': 60, 'education_nqf_score': 100,
         'language_fit_score': 100, 'emiratisation_score': 100, 'overall_score': 15}
    assert recompute_overall(r, 1.0) == round(0.35 * 80 + 0.30 * 60 + 0.15 * 100 + 0.10 * 100 + 0.10 * 100)
    assert recompute_overall(r, 0.0) == round(0.35 * 80 + 0.30 * 60 + 0.15 * 100 + 0.10 * 100)
    assert recompute_overall({'skills_match_score': 80}, 1.0) is None          # partial answer: keep the model's
    assert recompute_overall({**r, 'skills_match_score': 'high'}, 1.0) is None
    assert recompute_overall({**r, 'skills_match_score': 500}, 1.0) <= 100
