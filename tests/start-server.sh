#!/bin/sh
set -e

if [ -x ".venv/bin/python" ]; then
    exec .venv/bin/python application.py
fi

if [ -x "venv/bin/python" ]; then
    exec venv/bin/python application.py
fi

exec python3 application.py
