# Adding a user to the API

Use the `npm run user:create` script. It interactively prompts for a username, password and scopes and creates the user in the `User` table of the database.

For prod users `npm run user:create:prod` runs the command locally with `ENV=prod`, connecting directly to the prod database via the `APIDB_URL` secret decrypted by `dotenvx`.

# Auth2 flow

Users are stored in `User` in mysql.

They call `/auth/login` with a username and password. `passportjs` is used to authenticate the credentials using the `passport-local` strategy to validate against the database. If that succeeds, `passport-session` strategy is used to store a new session for the user in the `sessions` table.

The response contains a header `Set-Cookie` containing a `connec.sid=` chunk which instructs the browser to store this cookie.

There are several security settings for cookies which comes into play here. `secure: true` forces us to have https connections, `sameSite` handles CORS, ... This might need to vary between the dev and the prod.

On the next calls, the browser adds the `connect.sid` cookie to the request and the server uses `passport-session` strategy to extract the cookie and validate its content.

The content of the cookie is 2 parts, one is the session id urlencoded and the other is the signature of the id with the session secret stored in the server config.

`auth/logout` removes the user session and notices the browser to do the same.

# Secrets and Environment Variables

Secrets used to be stored in environment variables on Heroku. In 02/2026 we are starting to use [dotenvx](https://dotenvx.com/) to store the secrets in a `.env` file committed with the code.

- The private key is stored in the Dashlane secure note "api.statox.fr env variables"
    - In prod we need to define the environment variable `DOTENV_PRIVATE_KEY=xxx...`
    - Locally we can create `.env.keys` defining this same env variable

- To start the application we need to have `node index.js` as a subprocess of the `dotenvx` process.
    - The [`Dockerfile`](./Dockerfile) `CMD` `npx dotenvx run -- node dist/index.js`
    - That relies on `DOTENV_PRIVATE_KEY` being provided to the container on the VPS

- To access the values locally we use the `dotenvx` cli provided by the npm package. Both commands rely on having the `.env.keys` file locally:
    - Get a value: `npx dotenvx get DUMMY`
    - Set a value: `npx dotenvx set DUMMY "encrypted dummy prod"`

- Once the app runs as a subprocess of `dotenvx`, the environment variable defined in `.env` are available to the `node` process in clear text.
- The package in `src/packages/config` is then responsible for reading the environment variable and populating the `config` object that the rest of the code should use to access an env variable.

`dotenvx` also provides convenient commands to encrypt/decrypt the whole file and supports having some non-encrypted values in the file.

# Monorepo

## API deployment

See [DEPLOY.md](./DEPLOY.md). Kept here as historical record only.

## Front end deployment

On Github Page via Github Actions.
