# Qwen Migration — Emirati Journey Platform

## Overview

This guide documents the migration from **Gemini 2.5 Pro** to **Alibaba Cloud Qwen** via the DashScope OpenAI-compatible API. The migration uses a **hybrid routing strategy**:

| Task Type | Model | Purpose |
|-----------|-------|---------|
| `parse` (CV/JD extraction) | `qwen-turbo` | Fast, cost-efficient text → JSON |
| `match` / `score` (scoring, gap analysis) | `qwen-plus` | High-accuracy semantic reasoning |

---

## Step-by-Step Integration

### 1. Set Up Environment

```bash
# Copy the env example
cp backend/.env.qwen.example backend/.env

# Edit backend/.env and set your real API key
DASHSCOPE_API_KEY=sk-your-real-key-here
```

### 2. Install Dependencies

```bash
cd backend
pip install openai>=1.0.0 python-dotenv>=1.0.0 pdfplumber>=0.11.0
```

All required packages are already in `requirements.txt`.

### 3. Verify API Connectivity

```python
from backend.services.qwen_client import chat_completion

result = chat_completion(
    task_type="parse",
    messages=[
        {"role": "system", "content": "Return JSON only."},
        {"role": "user", "content": "Return: {\"status\": \"ok\"}"},
    ],
)
print(result)  # Should print: {'status': 'ok'}
```

### 4. Test Resume Parsing

```python
from backend.services.resume_parser import parse_resume

# From file
result = parse_resume("backend/cv.pdf")

# From text
result = parse_resume("Abdulaziz Al Falahi...", is_file_path=False)

print(result["personal_info"]["full_name"])
print(result["highest_nqf_level"])
```

### 5. Test JD Parsing + Matching

```python
from backend.services.matching_engine import parse_jd, score_match
from backend.services.resume_parser import parse_resume

resume = parse_resume("backend/cv.pdf")
jd = parse_jd("Chief Technology Officer at Dubai Digital...")
match = score_match(resume, jd)

print(f"Overall: {match['overall_score']}%")
print(f"Emiratisation: {match['emiratisation_priority']}")
```

### 6. Run Tests

```bash
cd backend
python -m pytest tests/test_qwen_parsing.py -v
```

---

## File Structure

```
backend/
├── config/
│   ├── __init__.py
│   └── qwen_config.py          # API keys, model routing, cost tracking
├── services/
│   ├── qwen_client.py          # OpenAI-compatible client wrapper
│   ├── pdf_extractor.py        # Reusable PDF/DOCX/TXT extraction
│   ├── resume_parser.py        # CV → structured JSON (qwen-turbo)
│   └── matching_engine.py      # JD parsing + scoring (qwen-plus)
├── tests/
│   └── test_qwen_parsing.py    # Full test suite
├── .env.qwen.example           # Environment template
└── docs/
    └── QWEN_MIGRATION_GUIDE.md # This file
```

---

## Model Routing

The `qwen_config.py` module defines automatic routing:

```python
MODEL_ROUTING = {
    "parse":   "qwen-turbo",   # Fast extraction
    "match":   "qwen-plus",    # Semantic scoring
    "score":   "qwen-plus",
    "explain": "qwen-plus",
}
```

Override per-call:
```python
result = parse_resume("cv.pdf", model="qwen-max")  # Force qwen-max
```

Override globally via `.env`:
```
QWEN_PARSE_MODEL=qwen-turbo-latest
QWEN_MATCH_MODEL=qwen-plus-latest
```

---

## Cost Optimization Tips

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Use For |
|-------|----------------------|------------------------|---------|
| qwen-turbo | ~0.80 AED | ~2.00 AED | CV/JD parsing (high volume) |
| qwen-plus | ~1.60 AED | ~4.40 AED | Matching/scoring (selective) |
| qwen-max | ~8.00 AED | ~24.00 AED | Complex analysis (rare) |

**Best practices:**
1. **Always use turbo for parsing** — it handles structured extraction well at 2× lower cost
2. **Reserve plus for matching** — only called when a recruiter requests a match
3. **Truncate input** — prompts are capped at 20,000 chars by default
4. **Monitor usage** — call `get_usage_summary()` to see token counts and cost estimates
5. **Batch wisely** — each `score_match()` call is 1 API request; batch only what's needed

---

## Troubleshooting

### JSON Parsing Errors

**Symptom:** `QwenParsingError: Malformed JSON`

**Fixes:**
1. The client retries 3 times automatically with `response_format={"type": "json_object"}`
2. If persistent, check `raw_response` on the exception for what the model actually returned
3. Ensure the system prompt includes "Return ONLY raw, valid JSON"
4. Try switching to `qwen-plus` or `qwen-max` for better instruction following

### API Key Issues

**Symptom:** `QwenClientError: DASHSCOPE_API_KEY is not set`

**Fix:** Ensure `DASHSCOPE_API_KEY` is in your `.env` file and `python-dotenv` is installed.

### Rate Limiting

**Symptom:** `RateLimitError` after several rapid calls

**Fix:** The client uses exponential backoff (2^attempt seconds). For batch operations, add a small delay between calls.

### Arabic Text Issues

**Symptom:** Arabic text garbled or missing

**Fix:** Ensure pdfplumber is installed (handles Arabic better than PyPDF2). Check that `x_tolerance` and `y_tolerance` are set in extraction (default: 3).

---

## Integration with Existing Code

The new Qwen modules can be imported alongside existing Gemini code:

```python
# In enhanced_cv_routes.py — swap parser
from backend.services.resume_parser import parse_resume, parse_resume_from_stream
from backend.services.matching_engine import score_match, parse_jd

# Replace Gemini-based parsing with:
parsed_cv = parse_resume_from_stream(file_stream, filename)
```

The existing `cv_parser.py` can also import the shared extractor:
```python
from backend.services.pdf_extractor import extract_text, extract_text_from_stream
```
