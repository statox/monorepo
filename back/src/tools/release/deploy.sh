#!/usr/bin/env bash

set -euo pipefail

#
# This is a script to be run locally to deploy the API to our prod server
#

# Prod server access
SSH_HOST='panda.statox.fr'
SSH_USER='ubuntu'
SSH_KEY_FILE="$HOME/.ssh/panda" # TODO: Use dotenvx to handle that

# Prod server config
REPO_DIRECTORY='/home/ubuntu/.docker-apps/apistatox'
BRANCH_TO_DEPLOY='main'

SSH="ssh -i $SSH_KEY_FILE $SSH_USER@$SSH_HOST"
COMPOSE="sudo docker compose -f $REPO_DIRECTORY/back/src/tools/docker-compose.prod.yml"

# Make sure the REPO_DIRECTORY exists on remote
echo "Ensuring $REPO_DIRECTORY exists on remote..."
GIT_REMOTE_URL='https://github.com/statox/monorepo.git'
$SSH "
    if [ ! -d '$REPO_DIRECTORY/.git' ]; then
        mkdir -p '$REPO_DIRECTORY'
        git clone '$GIT_REMOTE_URL' '$REPO_DIRECTORY'
    fi
"

# Pull the latest changes of the main branch and checkout on remote
echo "Pulling latest changes on remote..."
$SSH "cd $REPO_DIRECTORY && git fetch origin && git checkout $BRANCH_TO_DEPLOY && git pull origin $BRANCH_TO_DEPLOY"

# TODO Find a way to avoid downtime

# Stop the current deployment
echo "Stopping current deployment..."
$SSH "$COMPOSE down"

# Restart the deployment
echo "Starting new deployment..."
$SSH "$COMPOSE up --build api -d"

echo "Deploy complete."
