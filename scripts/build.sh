#!/bin/bash

# Build script for sampha - creates a single executable
set -e

echo "- building sampha"

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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    print_error "please run this script from the project root directory"
    exit 1
fi

# Step 1: Build the frontend
print_status "building frontend..."
cd apps/web
bun run build
print_status "frontend build complete"

# Step 2: Copy assets to server static directory
print_status "copying frontend assets to server..."
mkdir -p ../server/internal/server/static
cp -r ./build/client/* ../server/internal/server/static/
print_status "assets copied to server/internal/server/static/"

# Step 3: Build the Go executable
print_status "building go executable..."
cd ../server

# Check if Go is installed
if ! command -v go &> /dev/null; then
    print_error "go is not installed. please install go first."
    exit 1
fi

# Set environment variables for the build
export PORT=8080
export BLUEPRINT_DB_URL=./sampha.db

# Build the executable
go build -o ../../sampha ./cmd/api
print_status "go executable built successfully"

# Step 4: Clean up
print_status "cleaning up temporary files..."
# Remove copied assets but preserve the .keep placeholder for go:embed
# if [ -d "internal/server/static" ]; then
    # find internal/server/static -mindepth 1 -not -name ".keep" -exec rm -rf {} +
# fi
print_status "cleanup complete"

# Step 5: Final status
cd ../..
if [ -f "sampha" ]; then
    print_status "sampha executable created successfully!"
    print_status "location: $(pwd)/sampha"
    print_status "run with: ./sampha"
    
    # Show file size
    SIZE=$(du -h sampha | cut -f1)
    print_status "size: $SIZE"
else
    print_error "build failed - executable not found"
    exit 1
fi

print_status "build process complete!"

