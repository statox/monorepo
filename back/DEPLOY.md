# Deploying in production

I am transitioning the deployment of this API from heroku to my own production server.

## Before (Heroku)

Deployment on heroku is done by simply pushing main to the heroku remote. The npm scripts allow to do that

```
npm run heroku:login
npm run heroku:deploy
```

## After (panda)

This is still a work in progress. For now the process is as follow:

1. SSH to panda
1. In `~/monorepo` git pull the latest changes
1. In `~/monorepo` rebuild and restart the container `sudo docker compose -f back/src/tools/docker-compose.prod.yml up --build api`

The file `.env.keys` is alreaady copied in the directory to be included in the container and allow `dotenvx` to decrypt the env file.

This is not ideal and should be more automatised but I want to keep things simple.

We created an shell script at `src/tools/release/deploy.sh` to handle these steps and an npm script to make it simple to access:

```
npm run prod:deploy
```
