"""Find the actual source file and line number for each dead handler."""
import sys, inspect
sys.path.insert(0, '.')

from backend.app import app

from collections import defaultdict
route_map = defaultdict(list)

rules = sorted(app.url_map.iter_rules(), key=lambda r: r.rule)
for r in rules:
    methods = sorted(r.methods - {'OPTIONS', 'HEAD'})
    for m in methods:
        key = (m, r.rule)
        route_map[key].append(r.endpoint)

dupes = {k: v for k, v in route_map.items() if len(v) > 1}

print(f"=== {len(dupes)} DUPLICATE ROUTES WITH SOURCE ===\n")
for (method, url), endpoints in sorted(dupes.items()):
    print(f"{method} {url}")
    for i, ep in enumerate(endpoints):
        label = "WINNER" if i == 0 else "DEAD  "
        # Get the view function
        view_func = app.view_functions.get(ep)
        if view_func:
            try:
                source_file = inspect.getfile(view_func)
                source_line = inspect.getsourcelines(view_func)[1]
                # Shorten the path
                short_path = source_file.split('backend\\')[-1] if 'backend\\' in source_file else source_file.split('backend/')[-1]
                print(f"  [{label}] {ep} -> {short_path}:{source_line}")
            except:
                print(f"  [{label}] {ep} -> (source unknown)")
        else:
            print(f"  [{label}] {ep} -> (no view function)")
    print()
