#!/bin/bash
set -e

echo "========================================="
echo "Building Frontend Docker Image"
echo "========================================="

cd "$(dirname "$0")/.."

docker build -t statox-frontend:latest ./front

echo ""
echo "✓ Frontend Docker image built successfully!"
echo "  Image: statox-frontend:latest"
echo ""
