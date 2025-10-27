#!/bin/bash

# database.sh - Database management script for SimpleChat application
# Manages SQL Server database via Docker Compose

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
    print_status "Starting database with Docker Compose..."
    if command_exists docker && command_exists docker-compose; then
        docker-compose up -d
        print_status "Database started successfully"
    else
        print_error "Docker or Docker Compose not found. Please install Docker."
        exit 1
    fi
}

# Function to stop database
stop_database() {
    print_status "Stopping database..."
    if command_exists docker && command_exists docker-compose; then
        docker-compose down
        print_status "Database stopped"
    fi
}

# Function to restart database
restart_database() {
    print_status "Restarting database..."
    stop_database
    sleep 2
    start_database
    print_status "Database restarted"
}

# Function to show database status
show_database_status() {
    if docker ps | grep -q simplechat-sqlserver; then
        print_status "Database: Running"
    else
        print_warning "Database: Not running"
    fi
}

# Function to show usage
usage() {
    echo "Usage: $0 {start|stop|restart|status}"
    echo ""
    echo "Commands:"
    echo "  start   - Start the database"
    echo "  stop    - Stop the database"
    echo "  restart - Restart the database"
    echo "  status  - Show database status"
    echo ""
    echo "Examples:"
    echo "  $0 start     # Start the database"
    echo "  $0 stop      # Stop the database"
    echo "  $0 restart   # Restart the database"
    echo "  $0 status    # Show database status"
}

# Main script logic
case "${1:-help}" in
start)
    start_database
    ;;
stop)
    stop_database
    ;;
restart)
    restart_database
    ;;
status)
    show_database_status
    ;;
*)
    usage
    exit 1
    ;;
esac