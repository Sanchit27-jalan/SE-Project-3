#!/bin/bash

# Create a new detached tmux session
tmux new-session -d -s myapp

# Split the window vertically (now pane 0 and pane 1)
tmux split-window -v

# Split the second pane horizontally (now pane 1 becomes pane 1 and pane 2)
tmux split-window -h

# Send commands to each pane
tmux send-keys -t myapp:0.0 "cd backend && source .venv/bin/activate && python3 proxy.py" C-m
tmux send-keys -t myapp:0.1 "cd backend && source .venv/bin/activate && uvicorn app.main:app --reload" C-m
tmux send-keys -t myapp:0.2 "cd frontend && npm run dev" C-m

# Attach to the session
tmux attach -t myapp