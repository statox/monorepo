#!/bin/bash
set -e

echo "========================================="
echo "Building Backend Docker Image"
echo "========================================="

cd "$(dirname "$0")/.."

docker build -t statox-backend:latest ./back

echo ""
echo "✓ Backend Docker image built successfully!"
echo "  Image: statox-backend:latest"
echo ""
