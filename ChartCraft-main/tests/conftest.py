# Pytest conftest: add backend to path when running tests from project root
import os
import sys
_backend = os.path.join(os.path.dirname(__file__), "..", "backend")
if _backend not in sys.path:
    sys.path.insert(0, _backend)
