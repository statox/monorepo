We updated the SDK to use superagent instead of the plain `fetch` function.
This allowed to handle route which expect file uploads in the SDK using superagent to send either form data or plain json.

The code works on local front and local API but there are things to fix.

# TODO

- The fetcher mechanism in client.ts doesn't work anymore
- The SDK tests are broken because we don't provide a proper mock (since the fetcher mechanism was not reimplemented)
- ~The authentication headers for API authentication are not used in the request~ Tests to be added to confirm implementatino.
- Error handling needs to be reviewed to make sure it is easy to use
- ~We can probably merge `route.njk` and `routeWithFile.njk` into a single file (and maybe some simple string manipulation in typescript directly but we probably want to keep `sdk.njk` for now)~ Done
- Change the signature of `_fetch` in `client.ts` to use an object to pass the parameters in a more convenient way
- ~I don't think we handle CORS so the prod will break at deploy if we don't add them~ CORS should not be a problem as long as we use `.withCredentials()` (according to Claude)
- ~The typing of the `file` param needs to be fixed both in SDK and front. For now it is set as `unkown` everywhere but we need to find the right type.~


# SDK Tests

## Missing/To be checked
Stuff to test or make sure it is tested:

- input validation
- output validation
- error handling
    - API error with code and status
    - API 500 error
    - API 404
    - Network error
- CORS + Make sure credential cookies are only sent on routes with user2 auth
- Auth headers are properly set for API keys
- JSON input/multipart input with and without file
- Credentials cookies included when needed
