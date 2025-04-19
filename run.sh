#!/bin/bash

# Change to script directory to ensure paths are correct
cd "$(dirname "$0")"
# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Setup backend python environment and install dependencies
if [ ! -d "lumos/backend/.venv" ]; then
  python3 -m venv lumos/backend/.venv
fi
source lumos/backend/.venv/bin/activate
pip install -r lumos/backend/requirements.txt

# Initialize the database if not already initialized
cd lumos/backend && python -m app.init_db && cd ..

# Setup frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
  cd frontend && npm install && cd ..
fi

# Create a new detached tmux session
tmux new-session -d -s myapp

# Split the window vertically (now pane 0 and pane 1)
tmux split-window -v

# Split the second pane horizontally (now pane 1 becomes pane 1 and pane 2)
tmux split-window -h

# Send commands to each pane
tmux send-keys -t myapp:0.0 "cd lumos/backend && source .venv/bin/activate && python3 proxy.py" C-m
tmux send-keys -t myapp:0.1 "cd lumos/backend && source .venv/bin/activate && uvicorn app.main:app --reload" C-m
tmux send-keys -t myapp:0.2 "cd frontend && npm run dev" C-m

# Attach to the session
tmux attach -t myapp