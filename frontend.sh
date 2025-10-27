#!/bin/bash

# frontend.sh - Frontend management script for SimpleChat application
# Manages React/Vite development server

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

# Function to start frontend
start_frontend() {
    # Check if frontend is already running
    if [ -f /Users/gurkan_indibay/source/azure_communications/frontend.pid ]; then
        FRONTEND_PID=$(cat /Users/gurkan_indibay/source/azure_communications/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_warning "Frontend is already running (PID: $FRONTEND_PID)"
            print_warning "Use './frontend.sh stop' to stop the current instance first"
            exit 1
        else
            print_warning "Found stale PID file, cleaning up..."
            rm /Users/gurkan_indibay/source/azure_communications/frontend.pid
        fi
    fi
    
    print_status "Starting frontend..."
    if command_exists npm; then
        cd src/frontend
        npm run dev &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > /Users/gurkan_indibay/source/azure_communications/frontend.pid
        cd ../..
        print_status "Frontend started (PID: $FRONTEND_PID)"
    else
        print_error "npm not found. Please install Node.js and npm."
        exit 1
    fi
}

# Function to stop frontend
stop_frontend() {
    print_status "Stopping frontend..."
    if [ -f /Users/gurkan_indibay/source/azure_communications/frontend.pid ]; then
        FRONTEND_PID=$(cat /Users/gurkan_indibay/source/azure_communications/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_status "Frontend stopped"
        fi
        rm /Users/gurkan_indibay/source/azure_communications/frontend.pid
    else
        print_warning "Frontend PID file not found"
    fi
}

# Function to restart frontend
restart_frontend() {
    print_status "Restarting frontend..."
    stop_frontend
    sleep 1
    start_frontend
    print_status "Frontend restarted"
}

# Function to kill all frontend instances
kill_frontend() {
    print_status "Killing all frontend instances..."
    
    # Kill by PID file if it exists
    if [ -f /Users/gurkan_indibay/source/azure_communications/frontend.pid ]; then
        FRONTEND_PID=$(cat /Users/gurkan_indibay/source/azure_communications/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill $FRONTEND_PID
            print_status "Killed frontend process (PID: $FRONTEND_PID)"
        else
            print_warning "Frontend process (PID: $FRONTEND_PID) not found"
        fi
        rm -f /Users/gurkan_indibay/source/azure_communications/frontend.pid
    fi
    
    # Also kill any remaining npm or vite processes
    NPM_PIDS=$(ps aux | grep -E "(npm|vite)" | grep -v grep | awk '{print $2}')
    if [ ! -z "$NPM_PIDS" ]; then
        echo "$NPM_PIDS" | while read -r pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid
                print_status "Killed additional frontend process (PID: $pid)"
            fi
        done
    fi
    
    print_status "All frontend instances killed"
}

# Function to show frontend status
show_frontend_status() {
    if [ -f /Users/gurkan_indibay/source/azure_communications/frontend.pid ]; then
        FRONTEND_PID=$(cat /Users/gurkan_indibay/source/azure_communications/frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_status "Frontend: Running (PID: $FRONTEND_PID)"
        else
            print_warning "Frontend: Process not found"
            rm /Users/gurkan_indibay/source/azure_communications/frontend.pid
        fi
    else
        print_warning "Frontend: Not running"
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 {start|stop|restart|status|kill}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the frontend"
    echo "  stop    - Stop the frontend"
    echo "  restart - Restart the frontend"
    echo "  status  - Show frontend status"
    echo "  kill    - Kill all frontend instances"
    echo ""
    echo "Examples:"
    echo "  $0 start     # Start the frontend"
    echo "  $0 stop      # Stop the frontend"
    echo "  $0 restart   # Restart the frontend"
    echo "  $0 status    # Show frontend status"
    echo "  $0 kill      # Kill all frontend instances"
}

# Main script logic
case "${1:-help}" in
start)
    start_frontend
    ;;
stop)
    stop_frontend
    ;;
restart)
    restart_frontend
    ;;
status)
    show_frontend_status
    ;;
kill)
    kill_frontend
    ;;
*)
    usage
    exit 1
    ;;
esac