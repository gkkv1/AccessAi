import sys
print(f"Python: {sys.executable}")
print(f"Path: {sys.path}")

try:
    import jose
    print(f"SUCCESS: jose found at {jose.__file__}")
except ImportError as e:
    print(f"ERROR: {e}")

try:
    import passlib
    print(f"SUCCESS: passlib found at {passlib.__file__}")
except ImportError as e:
    print(f"ERROR: {e}")
