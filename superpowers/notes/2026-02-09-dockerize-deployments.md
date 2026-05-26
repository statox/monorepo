# Goal

Dockerize the whole monorepo to stop relying on heroku to host the backend and Github Pages to host the front. The want to put both apps in docker containers and then deploy them to the same server already running the other parts of the infra (Mysql DB) in other containers.

I got inspired by the talk of this guy who talked about `docker builx bake` to simplifying the build process of apps with linters/check and frontend/backend.
Repo of examples: https://github.com/tosun-si/docker-bake-playground
EDIT: In the end I went with a simple `docker compose` workflow, maybe I'll revisit that later.

# Steps

## Step 1: Dockerize only the backend first

We want to tackle the following items in order:

- [x] **Update env variables handling** Update backend code to use `dotenvx` to load secrets from environment variables. This allows reducing the amount of Heroku config to migrate. All the secrets are encrypted then versioned in the repo. The app can start with a single environment variable `DOTENV_PRIVATE_KEY` which is easy to configure in Heroku and should be straightforward to pass to a docker container securely.
- [x] **Build a docker container running locally** Create `back/Dockerfile` to create a container which build the app and the server with the decrypted config. We validate that locally with the following:

    ```bash
    # This requires having `.env.keys` correctly setup with dotenvx decryption key
    # Create the image
    docker buildx bake -f back.hcl

    # Check the last created image
    docker images | head

    # Start the container
    docker run -p 3000:3000 statox/api

    # Check that the container respond from host
    curl http://localhost:3000/health/getRemoteTime # Should return a timestamp

    # Local version of apps.statox.fr plugged on this backend will discuss with the prod infra
    ```

- ~[ ] **Publish the container** Find a way to have the container available to the prod server and manually start it on the server~
- [ ] **Integrate the deployment process into current setup** Find the right amount of tooling with `docker buildx bake`, `docker compose`, the publication mechanism from previous step and my current ansible playbooks to deploy the infra. We want to automate the deployment as close as possible to Heroku (Just pushing a branch from dev machine deploys a new version), while keeping things simple. Have a setup flexible enough so that adding new components like frontend will be low friction.
    - [x] **Quick and dirty solution** For now we created `npm run prod:deploy` which calls a bash script responsible for ssh-ing to panda, pulling the changes, building the container and deploying it on the prod machine.
        - Update after a couple of months with this setup: We might just keep it like this, it's not ideal but its good enough for my usage.


## Step 2: Dockerize only the front end

This is less urgent, we want to get rid of Github Pages but it works so well for now. We probably want to do that only if we decide to also get rid of Github CI, otherwise we keep a Github dependency and don't get much benefits.

- [ ] **Dockerize the frontend** This is a simple Svelte app compiled as a static website to deploy. So we can have a simple webserver in a container serving the generated app.
- [ ] **Integrate this to the setup we create for backend deployment**
