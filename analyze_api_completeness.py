#!/usr/bin/env python3
"""
API Completeness Analysis Script
Compares frontend API calls with backend endpoints to identify gaps
"""

import os
import re
import json
from pathlib import Path
from collections import defaultdict

# Define paths
FRONTEND_DIR = Path("/home/ubuntu/Emirati_Pathways/frontend/src")
BACKEND_DIR = Path("/home/ubuntu/Emirati_Pathways/backend")

def extract_frontend_api_calls():
    """Extract all API calls from frontend TypeScript files"""
    api_calls = []
    
    # Patterns to match API calls
    patterns = [
        # restClient calls
        r'restClient\.(get|post|put|delete|patch)\([\'"`]([^\'"`]+)[\'"`]',
        # axios calls
        r'axios\.(get|post|put|delete|patch)\([\'"`]([^\'"`]+)[\'"`]',
        # fetch calls
        r'fetch\([\'"`]([^\'"`]+)[\'"`]',
        # Template literal fetch/axios
        r'fetch\(`[^`]*(/api/[^`]+)`',
        r'restClient\.(get|post|put|delete|patch)\(`([^`]+)`',
    ]
    
    for tsx_file in FRONTEND_DIR.rglob("*.tsx"):
        try:
            content = tsx_file.read_text(encoding='utf-8')
            
            for pattern in patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    if isinstance(match, tuple):
                        if len(match) == 2:
                            method, endpoint = match
                        else:
                            endpoint = match[0]
                            method = 'GET'
                    else:
                        endpoint = match
                        method = 'GET'
                    
                    # Clean up endpoint
                    endpoint = endpoint.replace('${', '{').replace('`', '')
                    if '/api/' in endpoint:
                        # Extract just the API path
                        api_match = re.search(r'(/api/[^\s\'"`,\)]+)', endpoint)
                        if api_match:
                            endpoint = api_match.group(1)
                    
                    if endpoint.startswith('/api/'):
                        api_calls.append({
                            'file': str(tsx_file.relative_to(FRONTEND_DIR)),
                            'method': method.upper() if method else 'GET',
                            'endpoint': endpoint
                        })
        except Exception as e:
            print(f"Error reading {tsx_file}: {e}")
    
    # Also check .ts files in services
    for ts_file in FRONTEND_DIR.rglob("*.ts"):
        try:
            content = ts_file.read_text(encoding='utf-8')
            
            for pattern in patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    if isinstance(match, tuple):
                        if len(match) == 2:
                            method, endpoint = match
                        else:
                            endpoint = match[0]
                            method = 'GET'
                    else:
                        endpoint = match
                        method = 'GET'
                    
                    endpoint = endpoint.replace('${', '{').replace('`', '')
                    if '/api/' in endpoint:
                        api_match = re.search(r'(/api/[^\s\'"`,\)]+)', endpoint)
                        if api_match:
                            endpoint = api_match.group(1)
                    
                    if endpoint.startswith('/api/'):
                        api_calls.append({
                            'file': str(ts_file.relative_to(FRONTEND_DIR)),
                            'method': method.upper() if method else 'GET',
                            'endpoint': endpoint
                        })
        except Exception as e:
            pass
    
    return api_calls


def extract_backend_endpoints():
    """Extract all route definitions from backend Python files"""
    endpoints = []
    
    # Patterns to match Flask routes
    patterns = [
        # @app.route or @bp.route decorators
        r'@(?:app|[a-z_]+_bp|bp)\s*\.route\([\'"]([^\'"]+)[\'"](?:,\s*methods=\[([^\]]+)\])?',
        # Blueprint route
        r'\.route\([\'"]([^\'"]+)[\'"](?:,\s*methods=\[([^\]]+)\])?',
    ]
    
    for py_file in BACKEND_DIR.rglob("*.py"):
        if 'test_' in py_file.name or '__pycache__' in str(py_file):
            continue
            
        try:
            content = py_file.read_text(encoding='utf-8')
            
            for pattern in patterns:
                matches = re.findall(pattern, content)
                for match in matches:
                    endpoint = match[0]
                    methods = match[1] if len(match) > 1 and match[1] else 'GET'
                    
                    # Parse methods
                    if methods:
                        methods = [m.strip().strip("'\"") for m in methods.split(',')]
                    else:
                        methods = ['GET']
                    
                    for method in methods:
                        if method.upper() not in ['OPTIONS']:
                            endpoints.append({
                                'file': str(py_file.relative_to(BACKEND_DIR)),
                                'method': method.upper(),
                                'endpoint': endpoint
                            })
        except Exception as e:
            print(f"Error reading {py_file}: {e}")
    
    return endpoints


def normalize_endpoint(endpoint):
    """Normalize endpoint for comparison (replace path params with placeholders)"""
    # Replace UUID-like patterns
    normalized = re.sub(r'/[a-f0-9-]{36}', '/{id}', endpoint)
    # Replace numeric IDs
    normalized = re.sub(r'/\d+', '/{id}', normalized)
    # Replace path parameters like :id, {id}, <id>
    normalized = re.sub(r'[:<{][^>}:]+[>}:]?', '{id}', normalized)
    # Remove query strings
    normalized = normalized.split('?')[0]
    # Remove trailing slashes
    normalized = normalized.rstrip('/')
    return normalized


def analyze_completeness():
    """Main analysis function"""
    print("=" * 80)
    print("API COMPLETENESS ANALYSIS")
    print("=" * 80)
    
    # Extract calls and endpoints
    frontend_calls = extract_frontend_api_calls()
    backend_endpoints = extract_backend_endpoints()
    
    # Normalize and deduplicate
    frontend_normalized = {}
    for call in frontend_calls:
        key = (call['method'], normalize_endpoint(call['endpoint']))
        if key not in frontend_normalized:
            frontend_normalized[key] = []
        frontend_normalized[key].append(call)
    
    backend_normalized = {}
    for ep in backend_endpoints:
        key = (ep['method'], normalize_endpoint(ep['endpoint']))
        if key not in backend_normalized:
            backend_normalized[key] = []
        backend_normalized[key].append(ep)
    
    # Find missing endpoints
    missing = []
    for (method, endpoint), calls in frontend_normalized.items():
        found = False
        # Check exact match
        if (method, endpoint) in backend_normalized:
            found = True
        else:
            # Check with wildcards
            for (be_method, be_endpoint) in backend_normalized.keys():
                if method == be_method:
                    # Normalize both for comparison
                    if normalize_endpoint(endpoint) == normalize_endpoint(be_endpoint):
                        found = True
                        break
                    # Check if backend has a pattern that matches
                    be_pattern = be_endpoint.replace('{id}', '[^/]+')
                    if re.match(f'^{be_pattern}$', endpoint):
                        found = True
                        break
        
        if not found:
            missing.append({
                'method': method,
                'endpoint': endpoint,
                'files': list(set(c['file'] for c in calls))
            })
    
    # Group by API domain
    domains = defaultdict(list)
    for m in missing:
        parts = m['endpoint'].split('/')
        if len(parts) >= 3:
            domain = parts[2]  # /api/{domain}/...
        else:
            domain = 'other'
        domains[domain].append(m)
    
    # Print results
    print(f"\n📊 SUMMARY")
    print(f"   Frontend API calls found: {len(frontend_normalized)}")
    print(f"   Backend endpoints found: {len(backend_normalized)}")
    print(f"   Missing endpoints: {len(missing)}")
    
    print(f"\n🔴 MISSING ENDPOINTS BY DOMAIN")
    print("-" * 80)
    
    for domain in sorted(domains.keys()):
        endpoints = domains[domain]
        print(f"\n📁 {domain.upper()} ({len(endpoints)} missing)")
        for ep in endpoints:
            print(f"   [{ep['method']}] {ep['endpoint']}")
            for f in ep['files'][:2]:  # Show first 2 files
                print(f"       └─ {f}")
    
    # Print existing backend endpoints for reference
    print(f"\n✅ EXISTING BACKEND ENDPOINTS")
    print("-" * 80)
    
    backend_domains = defaultdict(list)
    for (method, endpoint), eps in backend_normalized.items():
        parts = endpoint.split('/')
        if len(parts) >= 3:
            domain = parts[2]
        else:
            domain = 'other'
        backend_domains[domain].append((method, endpoint, eps[0]['file']))
    
    for domain in sorted(backend_domains.keys()):
        endpoints = backend_domains[domain]
        print(f"\n📁 {domain.upper()} ({len(endpoints)} endpoints)")
        for method, endpoint, file in sorted(endpoints, key=lambda x: x[1])[:10]:  # Show first 10
            print(f"   [{method}] {endpoint}")
        if len(endpoints) > 10:
            print(f"   ... and {len(endpoints) - 10} more")
    
    # Return data for further processing
    return {
        'frontend_calls': list(frontend_normalized.keys()),
        'backend_endpoints': list(backend_normalized.keys()),
        'missing': missing,
        'domains': dict(domains)
    }


if __name__ == '__main__':
    results = analyze_completeness()
    
    # Save results to JSON
    with open('/home/ubuntu/Emirati_Pathways/api_analysis_results.json', 'w') as f:
        json.dump({
            'missing_count': len(results['missing']),
            'missing_endpoints': results['missing'],
            'domains': {k: len(v) for k, v in results['domains'].items()}
        }, f, indent=2)
    
    print(f"\n\n📄 Results saved to api_analysis_results.json")
