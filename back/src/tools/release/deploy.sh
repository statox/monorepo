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
# Use reset --hard instead of pull so force-pushed histories don't cause failures
echo "Pulling latest changes on remote..."
$SSH "cd $REPO_DIRECTORY && git fetch origin && git checkout $BRANCH_TO_DEPLOY && git reset --hard origin/$BRANCH_TO_DEPLOY"

echo "Checking last commits"
$SSH "git log --oneline | head -n 5"

# TODO Find a way to avoid downtime

# Stop the current deployment
echo "Stopping current deployment..."
$SSH "$COMPOSE down"

# Restart the deployment
echo "Starting new deployment..."
$SSH "$COMPOSE up --build api -d"

# Validate the deployment by polling the health endpoint
echo "Validating deployment..."
HEALTH_URL='https://api.statox.fr/health/getRemoteTime'
MAX_ATTEMPTS=10
SLEEP_SECONDS=3

for i in $(seq 1 $MAX_ATTEMPTS); do
    HTTP_STATUS=$(curl --silent --output /dev/null --write-out "%{http_code}" "$HEALTH_URL")
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "Deploy complete. API is up (attempt $i/$MAX_ATTEMPTS)."
        exit 0
    fi
    echo "Attempt $i/$MAX_ATTEMPTS: got HTTP $HTTP_STATUS, retrying in ${SLEEP_SECONDS}s..."
    sleep $SLEEP_SECONDS
done

echo "ERROR: API did not respond with HTTP 200 after $MAX_ATTEMPTS attempts." >&2
exit 1
