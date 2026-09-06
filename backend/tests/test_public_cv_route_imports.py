"""get_public_cv imports its helpers before it uses them.

2026-09-06: a refactor placed the `share_retirement` call above the in-function
import that provides it. Every unit test passed (they test the helper), and
the route answered 500 on staging until the next deploy. This test reads the
route's source, so the ordering cannot regress silently again.
"""
import ast
import os

ROUTE = os.path.join(os.path.dirname(__file__), '..', 'routes', 'inline_routes.py')
HELPERS = ('share_retirement', 'fill_from_parsed', 'mask_contacts')


def _get_public_cv():
    tree = ast.parse(open(ROUTE, encoding='utf-8').read())
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == 'get_public_cv':
            return node
    raise AssertionError('get_public_cv not found')


def test_helpers_are_imported_before_first_use():
    fn = _get_public_cv()
    first_import = {}
    first_use = {}
    for node in ast.walk(fn):
        if isinstance(node, ast.ImportFrom):
            for alias in node.names:
                if alias.name in HELPERS:
                    first_import[alias.name] = min(first_import.get(alias.name, node.lineno), node.lineno)
        elif isinstance(node, ast.Name) and node.id in HELPERS:
            first_use[node.id] = min(first_use.get(node.id, node.lineno), node.lineno)
    for name in HELPERS:
        assert name in first_import, f'{name} is never imported in get_public_cv'
        assert name in first_use, f'{name} is never used in get_public_cv'
        assert first_import[name] < first_use[name], \
            f'{name} is used on line {first_use[name]} but imported on line {first_import[name]}'
