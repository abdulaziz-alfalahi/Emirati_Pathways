#!/usr/bin/env python3
"""
Route & Blueprint Audit Script

Imports the actual Flask app and inspects all registered routes,
blueprints, and detects duplicate/shadowed endpoints.
"""
import sys
import os

# Must run from project root
sys.path.insert(0, os.path.dirname(__file__))

os.environ.setdefault('DB_HOST', '127.0.0.1')
os.environ.setdefault('DB_PORT', '5432')
os.environ.setdefault('DB_NAME', 'emirati_journey')
os.environ.setdefault('DB_USER', 'emirati_user')
os.environ.setdefault('DB_PASSWORD', 'emirati_secure_password')

OUTPUT_FILE = os.path.join(os.path.dirname(__file__), 'backend', 'audit_routes_output.txt')

lines = []
def p(msg=""):
    lines.append(msg)

try:
    from backend.app import app
except Exception as e:
    p(f"ERROR importing app: {e}")
    import traceback
    p(traceback.format_exc())
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines))
    print(f"Error output written to {OUTPUT_FILE}")
    sys.exit(1)

with app.app_context():
    # ---- SECTION 1: All Blueprints ----
    p("=" * 90)
    p("SECTION 1: ALL REGISTERED BLUEPRINTS")
    p("=" * 90)
    
    blueprints = {}
    for name, bp in app.blueprints.items():
        bp_info = {
            'name': name,
            'import_name': bp.import_name,
            'url_prefix': bp.url_prefix or '(none)',
            'source_file': getattr(bp, 'root_path', 'unknown'),
        }
        blueprints[name] = bp_info
        p(f"  {name:40s} prefix={str(bp.url_prefix or '(none)'):30s} module={bp.import_name}")
    
    p(f"\n  Total blueprints: {len(blueprints)}")

    # ---- SECTION 2: All Routes ----
    p("\n" + "=" * 90)
    p("SECTION 2: ALL REGISTERED ROUTES (sorted by URL)")
    p("=" * 90)
    
    route_map = {}  # url_rule -> list of handlers
    
    for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
        endpoint = rule.endpoint
        methods = sorted(rule.methods - {'HEAD', 'OPTIONS'})
        methods_str = ','.join(methods) if methods else 'GET'
        
        # Find the view function
        view_func = app.view_functions.get(endpoint)
        if view_func:
            module = getattr(view_func, '__module__', 'unknown')
            func_name = getattr(view_func, '__name__', 'unknown')
            source = f"{module}.{func_name}"
        else:
            source = "unknown"
        
        # Blueprint info
        bp_name = endpoint.split('.')[0] if '.' in endpoint else '(app)'
        
        url_key = f"{rule.rule}|{methods_str}"
        if url_key not in route_map:
            route_map[url_key] = []
        route_map[url_key].append({
            'rule': rule.rule,
            'methods': methods_str,
            'endpoint': endpoint,
            'blueprint': bp_name,
            'source': source,
        })
        
        p(f"  {methods_str:8s} {rule.rule:65s} -> {source:50s} [{bp_name}]")
    
    p(f"\n  Total routes: {sum(len(v) for v in route_map.values())}")

    # ---- SECTION 3: Duplicate/Shadowed Routes ----
    p("\n" + "=" * 90)
    p("SECTION 3: DUPLICATE / SHADOWED ROUTES")
    p("=" * 90)
    p("  Routes where multiple handlers are registered for the same URL+method combination,")
    p("  or where URL patterns overlap and could shadow each other.")
    p("")
    
    # Group by normalized URL pattern (replace <params> with wildcards)
    import re
    
    def normalize_url(url):
        """Replace <type:param> and <param> with * for comparison"""
        return re.sub(r'<[^>]+>', '*', url)
    
    # Find exact duplicates in endpoint names
    endpoint_urls = {}
    for rule in app.url_map.iter_rules():
        methods = sorted(rule.methods - {'HEAD', 'OPTIONS'})
        for m in methods:
            key = f"{m} {rule.rule}"
            if key not in endpoint_urls:
                endpoint_urls[key] = []
            view_func = app.view_functions.get(rule.endpoint)
            source = "unknown"
            if view_func:
                module = getattr(view_func, '__module__', 'unknown')
                func_name = getattr(view_func, '__name__', 'unknown')
                source = f"{module}.{func_name}"
            endpoint_urls[key].append({
                'endpoint': rule.endpoint,
                'source': source,
            })
    
    # Report exact URL duplicates
    exact_dupes = {k: v for k, v in endpoint_urls.items() if len(v) > 1}
    if exact_dupes:
        p("  EXACT DUPLICATES (same URL + method, multiple handlers):")
        for url, handlers in sorted(exact_dupes.items()):
            p(f"\n    {url}:")
            for h in handlers:
                p(f"      -> {h['source']} (endpoint: {h['endpoint']})")
    else:
        p("  No exact URL duplicates found.")
    
    # Find overlapping patterns (same normalized URL, different endpoints)
    p("\n  OVERLAPPING PATTERNS (same normalized URL, different handlers):")
    normalized_map = {}
    for rule in app.url_map.iter_rules():
        methods = sorted(rule.methods - {'HEAD', 'OPTIONS'})
        norm = normalize_url(rule.rule)
        for m in methods:
            key = f"{m} {norm}"
            if key not in normalized_map:
                normalized_map[key] = []
            view_func = app.view_functions.get(rule.endpoint)
            source = "unknown"
            if view_func:
                module = getattr(view_func, '__module__', 'unknown')
                func_name = getattr(view_func, '__name__', 'unknown')
                source = f"{module}.{func_name}"
            normalized_map[key].append({
                'actual_url': rule.rule,
                'endpoint': rule.endpoint,
                'source': source,
            })
    
    overlaps = {k: v for k, v in normalized_map.items() if len(v) > 1}
    if overlaps:
        for pattern, handlers in sorted(overlaps.items()):
            # Skip if all handlers are the same actual URL (already reported above)
            urls = set(h['actual_url'] for h in handlers)
            if len(urls) == 1:
                continue  # Already reported as exact duplicate
            p(f"\n    Pattern: {pattern}")
            for h in handlers:
                p(f"      {h['actual_url']:65s} -> {h['source']}")
    
    # ---- SECTION 4: Blueprint prefix conflicts ----
    p("\n" + "=" * 90)
    p("SECTION 4: BLUEPRINT PREFIX CONFLICTS")
    p("=" * 90)
    p("  Blueprints whose URL prefixes overlap, which can cause route shadowing:")
    p("")
    
    prefix_groups = {}
    for name, bp in app.blueprints.items():
        prefix = bp.url_prefix or '/'
        if prefix not in prefix_groups:
            prefix_groups[prefix] = []
        prefix_groups[prefix].append(name)
    
    for prefix, bps in sorted(prefix_groups.items()):
        if len(bps) > 1:
            p(f"  PREFIX '{prefix}' shared by: {', '.join(bps)}")
    
    # Also check nested prefixes (e.g., /api/recruiter and /api/recruiter/jd)
    all_prefixes = sorted(set(bp.url_prefix or '/' for bp in app.blueprints.values()))
    p("\n  Nested prefix hierarchy:")
    for i, p1 in enumerate(all_prefixes):
        children = [p2 for p2 in all_prefixes if p2 != p1 and p2.startswith(p1)]
        if children:
            p(f"    {p1}")
            for c in children:
                # Find which blueprint owns this
                owners = [name for name, bp in app.blueprints.items() if bp.url_prefix == c]
                p(f"      └─ {c} ({', '.join(owners)})")

    # ---- SECTION 5: Frontend API calls mapping ----
    p("\n" + "=" * 90)
    p("SECTION 5: KEY API ENDPOINTS AND THEIR ACTUAL HANDLERS")
    p("=" * 90)
    p("  Critical endpoints the frontend is likely calling:")
    p("")
    
    key_patterns = [
        '/api/recruiter/jd/list',
        '/api/recruiter/jd/create',
        '/api/recruiter/jd/',
        '/api/auth/',
        '/api/hr/jobs',
        '/api/jobs',
        '/api/cv/',
        '/api/recruiter/offers',
        '/api/recruiter/interviews',
        '/api/recruiter/shortlist',
        '/api/recruiter/candidates',
        '/api/recruiter/dashboard',
    ]
    
    for pattern in key_patterns:
        p(f"\n  Routes matching '{pattern}':")
        found = False
        for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
            if pattern in rule.rule:
                methods = sorted(rule.methods - {'HEAD', 'OPTIONS'})
                view_func = app.view_functions.get(rule.endpoint)
                source = "unknown"
                if view_func:
                    module = getattr(view_func, '__module__', 'unknown')
                    func_name = getattr(view_func, '__name__', 'unknown')
                    source = f"{module}.{func_name}"
                p(f"    {','.join(methods):8s} {rule.rule:55s} -> {source}")
                found = True
        if not found:
            p(f"    (no routes found)")

# Write output
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print(f"Output written to {OUTPUT_FILE}")
