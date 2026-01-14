# Adding a user to the API

Use the `npm run user:create` script. It interactively prompts for a username, password and scopes and creates the user in the `User` table of the database.

For prod users `npm run user:create:prod` runs the command on an temporary heroku instance to reach the prod database.

# Auth2 flow

Users are stored in `User` in mysql.

They call `/auth/login` with a username and password. `passportjs` is used to authenticate the credentials using the `passport-local` strategy to validate against the database. If that succeeds, `passport-session` strategy is used to store a new session for the user in the `sessions` table.

The response contains a header `Set-Cookie` containing a `connec.sid=` chunk which instructs the browser to store this cookie.

There are several security settings for cookies which comes into play here. `secure: true` forces us to have https connections, `sameSite` handles CORS, ... This might need to vary between the dev and the prod.

On the next calls, the browser adds the `connect.sid` cookie to the request and the server uses `passport-session` strategy to extract the cookie and validate its content.

The content of the cookie is 2 parts, one is the session id urlencoded and the other is the signature of the id with the session secret stored in the server config.

`auth/logout` removes the user session and notices the browser to do the same.

# Monorepo

Notes from migrating api.statox.fr and apps.statox.fr to this monorepo.

## API deployment

The old repo pushed the root of the repo to the heroku remote branch. In the monorepo the backend lives in `/back` so I want to push only this directory to the remote branch.

To do that we use `git subtree`. The idea is to have a subtree of the repo used independently.

At first I wanted to do `git subtree push --prefix back heroku master` to push the `back` directory to the heroku master branch. But git refused because the commits had been rewritten between the current deployment of the old repo and the new repo.

So I did the following:

```bash
# Split the subtree into a temporary branch
git subtree split --prefix back -b heroku-deploy

# Force push that branch to heroku
git push heroku heroku-deploy:master --force

# Clean up the temporary branch
git branch -D heroku-deploy
```

And now the deployment is just a matter of pushing the subtree to the branch.

> **_NOTE:_** When pushing the tree, git needs to review all the commits of the repo to extract
> those relevant to the subtree. That creates a progress bar counting the commit which is a bit
> long but for now I'll live with it.

In `package.json` the deploy scripts `heroku:deploy*` have been updated to use the following command:

```
 cd .. && git subtree push --prefix back heroku master
```

The `cd` is necessary because `git subtree` can only be ran from the root of the repo.

And `heroky:force-deploy*` uses a temporary branch to force update the remote. This is the same commands as the ones mentioned earlier but in a one liner

```
 cd .. && git push heroku $(git subtree split --prefix back):master --force
```
