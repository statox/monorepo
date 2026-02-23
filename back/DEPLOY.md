# Deploying in production

The API used to be deployed on heroku on a single dyno which costed ~7€/month. Now it is deployed on my own VPS (panda) with a Docker container

## Deployment process

1. Make sure you have SSH configured to login as `ubunu` on panda (TODO Change that to version the credentials)
1. Deploy with the npm script. This will pull `main` from origin and deploy it.
    ```bash
    npm run prod:deploy
    ```
1. It's possible to skip tests ran locally before pushing
    ```bash
    npm run prod:deploy:skip-tests
    ```

> [!TODO]
> I might need to create a `force-deploy` version of this for when the main branch has been rebased

## Under the hood

This is still a work in progress.

The `src/tools/release/deploy.sh` script is responsible for controlling the deployment on the remote server. What it does:

1. SSH to prod server to make sure the repo is cloned and up to date on the server.
1. Run `docker compose down` in the repo directory using our [`docker-compose.prod.yml`](./src/tools/docker-compose.prod.yml)
1. Run `docker compose up -d`
1. Poll the API healtcheck endpoint to validate the deployment

This process creates a small down time because after `docker compose down` the container doesn't serves requests anymore and `docker compose up` triggers the build of the container which takes some time during we don't have a container running.

> [!TODO]
> This downtime could be reduced by building the container before the shutdown

## The container

The docker compose we have in this repo is responsible for building a container with the sources of the app and running the server process. It also references the `reverse-proxy` network we define on panda in my setup repository to let traefik route the requests to the different applications.

The file `.env.keys` is alreaady copied in the directory to be included in the container and allow `dotenvx` to decrypt the env file.
