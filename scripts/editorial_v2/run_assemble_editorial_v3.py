"""Compatibility launcher for the V3 compositor filter graph."""
import os

SOURCE = os.path.join(os.path.dirname(__file__), "assemble_editorial_v3.py")
with open(SOURCE, "r", encoding="utf-8") as handle:
    code = handle.read()
code = code.replace("x=740:y=590:drawtext=fontfile=", "x=740:y=590,drawtext=fontfile=")
exec(compile(code, SOURCE, "exec"), {"__name__": "__main__", "__file__": SOURCE})
