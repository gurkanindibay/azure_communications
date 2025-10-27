#!/bin/bash

# backend.sh - Backend management script for SimpleChat application
# Manages .NET API server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to start backend
start_backend() {
    # Check if backend is already running
    if [ -f /Users/gurkan_indibay/source/azure_communications/backend.pid ]; then
        BACKEND_PID=$(cat /Users/gurkan_indibay/source/azure_communications/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_warning "Backend is already running (PID: $BACKEND_PID)"
            print_warning "Use './backend.sh stop' to stop the current instance first"
            exit 1
        else
            print_warning "Found stale PID file, cleaning up..."
            rm /Users/gurkan_indibay/source/azure_communications/backend.pid
        fi
    fi
    
    print_status "Starting backend..."
    if command_exists dotnet; then
        cd src/backend/SimpleChat.API
        dotnet run &
        BACKEND_PID=$!
        echo $BACKEND_PID > /Users/gurkan_indibay/source/azure_communications/backend.pid
        cd ../../..
        print_status "Backend started (PID: $BACKEND_PID)"
    else
        print_error ".NET SDK not found. Please install .NET SDK."
        exit 1
    fi
}

# Function to stop backend
stop_backend() {
    print_status "Stopping backend..."
    if [ -f /Users/gurkan_indibay/source/azure_communications/backend.pid ]; then
        BACKEND_PID=$(cat /Users/gurkan_indibay/source/azure_communications/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            print_status "Backend stopped"
        fi
        rm /Users/gurkan_indibay/source/azure_communications/backend.pid
    else
        print_warning "Backend PID file not found"
    fi
}

# Function to restart backend
restart_backend() {
    print_status "Restarting backend..."
    stop_backend
    sleep 1
    start_backend
    print_status "Backend restarted"
}

# Function to kill all backend instances
kill_backend() {
    print_status "Killing all backend instances..."
    
    # Kill by PID file if it exists
    if [ -f /Users/gurkan_indibay/source/azure_communications/backend.pid ]; then
        BACKEND_PID=$(cat /Users/gurkan_indibay/source/azure_communications/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            print_status "Killed backend process (PID: $BACKEND_PID)"
        else
            print_warning "Backend process (PID: $BACKEND_PID) not found"
        fi
        rm -f /Users/gurkan_indibay/source/azure_communications/backend.pid
    fi
    
    # Also kill any remaining dotnet processes running the SimpleChat API
    DOTNET_PIDS=$(ps aux | grep "dotnet.*SimpleChat" | grep -v grep | awk '{print $2}')
    if [ ! -z "$DOTNET_PIDS" ]; then
        echo "$DOTNET_PIDS" | while read -r pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                print_status "Killed additional backend process (PID: $pid)"
            fi
        done
    fi
    
    print_status "All backend instances killed"
}

# Function to show backend status
show_backend_status() {
    if [ -f /Users/gurkan_indibay/source/azure_communications/backend.pid ]; then
        BACKEND_PID=$(cat /Users/gurkan_indibay/source/azure_communications/backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_status "Backend: Running (PID: $BACKEND_PID)"
        else
            print_warning "Backend: Process not found"
            rm /Users/gurkan_indibay/source/azure_communications/backend.pid
        fi
    else
        print_warning "Backend: Not running"
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 {start|stop|restart|status|kill}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the backend"
    echo "  stop    - Stop the backend"
    echo "  restart - Restart the backend"
    echo "  status  - Show backend status"
    echo "  kill    - Kill all backend instances"
    echo ""
    echo "Examples:"
    echo "  $0 start     # Start the backend"
    echo "  $0 stop      # Stop the backend"
    echo "  $0 restart   # Restart the backend"
    echo "  $0 status    # Show backend status"
    echo "  $0 kill      # Kill all backend instances"
}

# Main script logic
case "${1:-help}" in
start)
    start_backend
    ;;
stop)
    stop_backend
    ;;
restart)
    restart_backend
    ;;
status)
    show_backend_status
    ;;
kill)
    kill_backend
    ;;
*)
    usage
    exit 1
    ;;
esac