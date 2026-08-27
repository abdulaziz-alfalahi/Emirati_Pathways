"""Reading source in a test without matching the prose that explains it.

WHY THIS EXISTS

Tests that assert on source text keep failing on their own comments. It has
happened four times in one session:

    assert 'ON CONFLICT (domain)' not in body     # matched the comment saying
                                                  # the old behaviour was that
    assert 'now()' not in block                   # matched "a fixed date, not
                                                  # now()"
    assert 'estimate' not in block                # matched "nothing is
                                                  # estimated"
    assert 'ILIKE' not in source                  # matched the docstring
                                                  # quoting the old query

The words a test searches for are exactly the words a good comment uses, because
both are describing the same thing. Stripping docstrings and comments first is
the fix, and doing it in one place stops the fifth occurrence.
"""
import re


def code_only(source):
    """`source` with docstrings, block strings and # comments removed.

    Deliberately crude: it also strips triple-quoted strings that are real
    values rather than docstrings. In a test that is the safe direction — a
    false pass on a string literal is recoverable, a permanent false failure on
    a comment gets the assertion deleted.
    """
    without_blocks = re.sub(r'(?s)""".*?"""', '', source)
    without_blocks = re.sub(r"(?s)'''.*?'''", '', without_blocks)
    return '\n'.join(line.split('#')[0] for line in without_blocks.splitlines())


def js_code_only(source):
    """The same, for TypeScript and JavaScript: /* */ and // removed."""
    without_blocks = re.sub(r'(?s)/\*.*?\*/', '', source)
    return '\n'.join(line.split('//')[0] for line in without_blocks.splitlines())
