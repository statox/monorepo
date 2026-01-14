#!/bin/bash
set -e

echo "========================================="
echo "Building All Docker Images"
echo "========================================="
echo ""

./scripts/build-backend.sh
./scripts/build-frontend.sh

echo "========================================="
echo "All Docker images built successfully!"
echo "========================================="
echo ""
echo "Images created:"
echo "  - statox-backend:latest"
echo "  - statox-frontend:latest"
echo ""
echo "To start the stack:"
echo "  docker-compose up -d"
echo ""
