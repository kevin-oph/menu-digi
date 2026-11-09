"""Pruebas locales aisladas con SQLite; no son pruebas de PostgreSQL."""
import argparse
import sys
import unittest
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--dependencies', type=Path)
args = parser.parse_args()
if args.dependencies:
    sys.path.insert(0, str(args.dependencies.resolve()))
sys.path.insert(0, str(Path(__file__).parent.resolve()))
suite = unittest.defaultTestLoader.discover(str(Path(__file__).parent / 'tests'))
result = unittest.TextTestRunner(verbosity=2).run(suite)
raise SystemExit(0 if result.wasSuccessful() else 1)
