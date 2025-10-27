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
    echo "Usage: $0 {start|stop|restart|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the backend"
    echo "  stop    - Stop the backend"
    echo "  restart - Restart the backend"
    echo "  status  - Show backend status"
    echo ""
    echo "Examples:"
    echo "  $0 start     # Start the backend"
    echo "  $0 stop      # Stop the backend"
    echo "  $0 restart   # Restart the backend"
    echo "  $0 status    # Show backend status"
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
*)
    usage
    exit 1
    ;;
esac