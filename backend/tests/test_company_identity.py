"""
Unit tests for backend/company_identity.py (issue #99 — shadow companies).

Pure-Python tests: find_company_id is exercised with a fake cursor, so no
database is required.
"""
import pytest

from backend.company_identity import (
    NORMALIZED_NAME_SQL,
    display_company_name,
    find_company_id,
    normalize_company_name,
)


class TestNormalizeCompanyName:
    def test_case_folds(self):
        assert normalize_company_name("ACME LLC") == "acme llc"

    def test_trims_and_collapses_whitespace(self):
        assert normalize_company_name("  Acme \t LLC \n") == "acme llc"

    def test_variants_of_same_employer_collide(self):
        variants = ["Acme LLC", "ACME LLC", " acme  llc ", "Acme\tLLC"]
        assert len({normalize_company_name(v) for v in variants}) == 1

    def test_different_employers_do_not_collide(self):
        assert normalize_company_name("Acme LLC") != normalize_company_name("Acme FZE")

    def test_no_punctuation_stripping(self):
        # Deliberate: "L.L.C" vs "LLC" must NOT merge (different licensees
        # would be worse than a duplicate).
        assert normalize_company_name("Acme L.L.C") != normalize_company_name("Acme LLC")

    def test_arabic_passes_through(self):
        assert normalize_company_name(" شركة  الإمارات ") == "شركة الإمارات"

    @pytest.mark.parametrize("empty", [None, "", "   ", "\t\n"])
    def test_empty_inputs(self, empty):
        assert normalize_company_name(empty) == ""


class TestDisplayCompanyName:
    def test_preserves_case_collapses_whitespace(self):
        assert display_company_name("  AcMe \t LLC ") == "AcMe LLC"


class FakeCursor:
    """Records executed queries; returns canned rows per call."""

    def __init__(self, rows):
        self.rows = list(rows)
        self.queries = []

    def execute(self, sql, params=None):
        self.queries.append((sql, params))

    def fetchone(self):
        return self.rows.pop(0) if self.rows else None


class TestFindCompanyId:
    def test_trade_license_wins_over_name(self):
        cur = FakeCursor([{"id": "licence-match"}])
        assert find_company_id(cur, "Acme LLC", "TL-123") == "licence-match"
        assert len(cur.queries) == 1
        assert "trade_license_no" in cur.queries[0][0]
        assert cur.queries[0][1] == ("TL-123",)

    def test_falls_back_to_normalized_name(self):
        cur = FakeCursor([None, {"id": "name-match"}])
        assert find_company_id(cur, "  ACME  LLC ", "TL-999") == "name-match"
        assert len(cur.queries) == 2
        assert NORMALIZED_NAME_SQL in cur.queries[1][0]
        assert cur.queries[1][1] == ("acme llc",)

    def test_blank_trade_license_skips_licence_lookup(self):
        for blank in (None, "", "   "):
            cur = FakeCursor([{"id": "name-match"}])
            assert find_company_id(cur, "Acme", blank) == "name-match"
            assert len(cur.queries) == 1
            assert NORMALIZED_NAME_SQL in cur.queries[0][0]

    def test_tuple_cursor_supported(self):
        cur = FakeCursor([("tuple-id",)])
        assert find_company_id(cur, "Acme") == "tuple-id"

    def test_no_match_returns_none(self):
        cur = FakeCursor([None, None])
        assert find_company_id(cur, "Ghost Corp", "TL-000") is None

    def test_empty_name_and_no_licence_queries_nothing(self):
        cur = FakeCursor([])
        assert find_company_id(cur, "   ") is None
        assert cur.queries == []
