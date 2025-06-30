#!/bin/bash

# Capture deployment information
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
DEPLOY_TIME=${DEPLOY_TIME:-$BUILD_TIME}

# Export as environment variables for Vite
export VITE_GIT_BRANCH="$BRANCH_NAME"
export VITE_BUILD_TIME="$BUILD_TIME"
export VITE_DEPLOY_TIME="$DEPLOY_TIME"

echo "Deployment Info:"
echo "  Branch: $BRANCH_NAME"
echo "  Build Time: $BUILD_TIME"
echo "  Deploy Time: $DEPLOY_TIME"