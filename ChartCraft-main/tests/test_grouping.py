"""
Unit tests for chart_engine._aggregate (sum/avg/count).
Run from project root: python -m pytest tests/test_grouping.py -v
"""
import pandas as pd
import pytest
from chart_engine import _aggregate


def test_aggregate_sum():
    df = pd.DataFrame({"x": ["a", "a", "b"], "y": [10, 20, 30]})
    out = _aggregate(df, "x", "y", "sum")
    assert len(out) == 2
    assert set(out["x"].tolist()) == {"a", "b"}
    assert out[out["x"] == "a"]["y"].iloc[0] == 30
    assert out[out["x"] == "b"]["y"].iloc[0] == 30


def test_aggregate_avg():
    df = pd.DataFrame({"x": ["a", "a", "b"], "y": [10, 20, 30]})
    out = _aggregate(df, "x", "y", "avg")
    assert out[out["x"] == "a"]["y"].iloc[0] == 15.0
    assert out[out["x"] == "b"]["y"].iloc[0] == 30.0


def test_aggregate_count():
    df = pd.DataFrame({"loc": ["A", "A", "B", "A"], "val": [1, 2, 3, 4]})
    out = _aggregate(df, "loc", "val", "count")
    assert len(out) == 2
    assert out[out["loc"] == "A"]["val"].iloc[0] == 3
    assert out[out["loc"] == "B"]["val"].iloc[0] == 1
