#!/bin/bash
# Start backend server

echo "Starting Grid Intelligence Backend..."
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Initializing database..."
python -c "from models.database import init_db; init_db()"

echo "Starting FastAPI server on http://localhost:8000"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

