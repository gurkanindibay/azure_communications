#!/bin/bash

# dev.sh - Development environment manager for SimpleChat application
# Manages local execution of frontend, backend, and database

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

# Function to start database
start_database() {
    ./database.sh start
}

# Function to start backend
start_backend() {
    ./backend.sh start
}

# Function to start frontend
start_frontend() {
    ./frontend.sh start
}

# Function to stop database
stop_database() {
    ./database.sh stop
}

# Function to stop backend
stop_backend() {
    ./backend.sh stop
}

# Function to stop frontend
stop_frontend() {
    ./frontend.sh stop
}

# Function to stop all services
stop_all() {
    print_status "Stopping all services..."
    stop_database
    stop_backend
    stop_frontend
    print_status "All services stopped"
}

# Function to restart database
restart_database() {
    ./database.sh restart
}

# Function to restart backend
restart_backend() {
    ./backend.sh restart
}

# Function to restart frontend
restart_frontend() {
    ./frontend.sh restart
}

# Function to restart all
restart_all() {
    print_status "Restarting all services..."
    stop_all
    sleep 2
    start_database
    sleep 5
    start_backend
    start_frontend
    print_status "All services restarted"
}

# Function to kill database
kill_database() {
    print_status "Stopping database containers..."
    ./database.sh stop
}

# Function to kill backend
kill_backend() {
    ./backend.sh kill
}

# Function to kill frontend
kill_frontend() {
    ./frontend.sh kill
}

# Function to kill all services
kill_all() {
    print_status "Killing all services..."
    kill_database
    kill_backend
    kill_frontend
    print_status "All services killed"
}

# Function to show usage
usage() {
    echo "Usage: $0 {start|stop|restart|status|kill} {all|database|backend|frontend}"
    echo ""
    echo "Commands:"
    echo "  start   - Start specified service(s)"
    echo "  stop    - Stop specified service(s)"
    echo "  restart - Restart specified service(s)"
    echo "  status  - Show status of all services"
    echo "  kill    - Kill all instances of specified service(s)"
    echo ""
    echo "Services:"
    echo "  all      - All services (database, backend, frontend)"
    echo "  database - SQL Server via Docker Compose"
    echo "  backend  - .NET API server"
    echo "  frontend - React/Vite development server"
    echo ""
    echo "Examples:"
    echo "  $0 start all          # Start all services"
    echo "  $0 stop frontend      # Stop only frontend"
    echo "  $0 restart backend    # Restart only backend"
    echo "  $0 kill all           # Kill all service instances"
    echo "  $0 status             # Show status of all services"
}

# Function to show status
show_status() {
    print_status "Checking service status..."
    ./database.sh status
    ./backend.sh status
    ./frontend.sh status
}

# Main script logic
case "${1:-help}" in
start)
        case "${2:-all}" in
            all)
                print_status "Starting development environment..."
                start_database
                sleep 5  # Wait for database to be ready
                start_backend
                start_frontend
                print_status "Development environment started!"
                print_status "Frontend should be available at http://localhost:5173"
                print_status "Backend should be available at http://localhost:5000 (or configured port)"
                show_status
                ;;
            database)
                start_database
                show_status
                ;;
            backend)
                start_backend
                show_status
                ;;
            frontend)
                start_frontend
                show_status
                ;;
            *)
                echo "Usage: $0 start {all|database|backend|frontend}"
                exit 1
                ;;
        esac
        ;;
    stop)
        case "${2:-all}" in
            all)
                stop_all
                show_status
                ;;
            database)
                stop_database
                show_status
                ;;
            backend)
                stop_backend
                show_status
                ;;
            frontend)
                stop_frontend
                show_status
                ;;
            *)
                echo "Usage: $0 stop {all|database|backend|frontend}"
                exit 1
                ;;
        esac
        ;;
    restart)
        case "${2:-all}" in
            all)
                restart_all
                ;;
            database)
                restart_database
                ;;
            backend)
                restart_backend
                ;;
            frontend)
                restart_frontend
                ;;
            *)
                echo "Usage: $0 restart {all|database|backend|frontend}"
                exit 1
                ;;
        esac
        ;;
    status)
        show_status
        ;;
    kill)
        case "${2:-all}" in
            all)
                kill_all
                show_status
                ;;
            database)
                kill_database
                show_status
                ;;
            backend)
                kill_backend
                show_status
                ;;
            frontend)
                kill_frontend
                show_status
                ;;
            *)
                echo "Usage: $0 kill {all|database|backend|frontend}"
                exit 1
                ;;
        esac
        ;;
esac