import sys
import os

# Add ChartCraft-main/backend to Python module search path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), "ChartCraft-main", "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app
