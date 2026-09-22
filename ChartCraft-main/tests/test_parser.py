"""
Unit tests for parser.parse_prompt and count fallback.
Run from project root: python -m pytest tests/test_parser.py -v
"""
import pytest
from parser import parse_prompt, suggest_chart_type


def test_parse_prompt_sales_by_region():
    intent = parse_prompt("sales by region", ["region", "sales", "profit"], numeric_columns=["sales", "profit"])
    assert intent.chart == "bar"
    assert intent.x in ("region", "sales")
    assert intent.y is not None
    assert intent.x in ["region", "sales", "profit"]
    assert intent.y in ["region", "sales", "profit"]


def test_parse_prompt_location_categorical_only():
    intent = parse_prompt("location", ["No.", "Name", "Location", "Total Weight"], numeric_columns=["No.", "Total Weight"])
    assert intent.aggregation == "count"
    assert intent.x == "Location"
    assert intent.y == "Location"


def test_parse_prompt_price_vs_rating():
    intent = parse_prompt("price vs rating", ["product", "price", "rating"], numeric_columns=["price", "rating"])
    assert intent.chart == "scatter"
    assert intent.x in ["price", "rating", "product"]
    assert intent.y in ["price", "rating", "product"]


def test_suggest_chart_type_two_numeric():
    assert suggest_chart_type(["a", "b", "c"], 2) == "scatter"


def test_suggest_chart_type_one_numeric():
    assert suggest_chart_type(["x", "y"], 1) == "bar"
