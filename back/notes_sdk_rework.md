Use the superpower skill to create an implementation plan taking into consideration the following guidelines:

# Context

We want to rework the SDK after having changed the error handling system in the backend.
Before introducing new error handling logic in the SDK we want to improve the generation of the SDK to make logic more centralized and reduce code duplication.

# Resources

We are working with the files in `back/scripts/` for the SDK generation, `front/src/vendor` for the generated SDK.
The rework of error handling in the backend was done between commits e7a13caa49c5e157f3c861f0f09fc20c3f265557 and 8d71a7350fa7a997acbdd33685ff7b04a2cac810

# Notes

Current fetch method (in scripts/templates/sdk.njk) could be refactored from this:

```
    private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
        const url = `${this.baseURL}${path}`;

        try {
            const response = await fetch(url, {
                ...options,
                mode: 'cors',
                credentials: this.credentials
            });

            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                this.onError?.(error, path);
                throw error;
            }

            return response;
        } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            this.onError?.(err, path);
            throw err;
        }
    }
```

to this

```
private async fetch<OutputType>(
    path: string,
    input: unknown | null,
    validation: {
        inputSchema?: any;
        outputSchema: any;
        endpoint: string
    },
    options: RequestInit = {},
): Promise<OutputType> {
    if (input) {
        if (!validation.inputSchema) {
            throw new Error("Missing inputSchema but input is present");
        }
        validateInput(validation.inputSchema, input, validation.endpoint);
    }

    const url = `${this.baseURL}${path}`;

    try {
        const response = await fetch(url, {
            ...options,
            mode: 'cors',
            credentials: this.credentials
        });

        if (!response.ok) {
            const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
            this.onError?.(error, path);
            throw error;
        }

        const output = await response.json();
        validateOutput(schemas.auth_me_Output, output, 'auth.me');
        return output;
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.onError?.(err, path);
        throw err;
    }
}
```

And it will need further refactoring:

- Have `options` be narrowly typed or expanded into several strongly typed params: `method: 'GET' | 'POST'`, `body?: unknown`
- Move the logic of inserting authentication headers from the calling functions to the reworked `fetch` function. The callers will only need to pass flags to enable authentications methods and the body of `fetch` will be updated to add the credentials where needed only when needed.
-

The current template to build the calls is as follow so we have a full pictures of the new parameters to explicit the current `options` param.

```
    /**
     * {{ method }} {{ routePath }}
     * Authentication: {{ authentication }}
     */
    {{ name }}: async ({{ params }}): Promise<{{ outputType }}> => {
      {% if hasInput %}validateInput(schemas.{{ inputSchemaName }}, input, '{{ module }}.{{ name }}');{% endif %}
      const response = await this.fetch(
        '{{ routePath }}'{{ pathParamsTransform }},
        {% if hasInput %}{
          method: 'POST',
          headers: { 'Content-Type': 'application/json'{% if requiresApiKey %}, 'Authorization': `Bearer ${apiKey}`{% endif %} },
          body: JSON.stringify(input)
        }{% else %}{ method: 'GET'{% if requiresApiKey %}, headers: { 'Authorization': `Bearer ${apiKey}` }{% endif %} }{% endif %}
      );
      const output = await response.json();
      validateOutput(schemas.{{ outputSchemaName }}, output, '{{ module }}.{{ name }}');
      return output as {{ outputType }};
    },
```

This current template is bad, the nested `if` conditions are hard to read, the repeated `Authorization` header inclusion is not great either. When reworking the `fetch` method we should be able to avoid this.

Endpoint methods should look like this:

```
logout2: async (input: Auth_Logout_Input) => this.fetch2<Auth_Logout_Output>(
    '/auth/logout',
    input,
    {
        inputSchema: schemas.auth_logout_Input,
        outputSchema: schemas.auth_logout_Output,
        endpoint: 'auth.logout'
    },
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    }
),

me: async (input: Auth_Me_Input) => this.fetch2<Auth_Me_Output>(
    '/auth/me',
    input,
    {
        inputSchema: schemas.auth_me_Input,
        outputSchema: schemas.auth_me_Output,
        endpoint: 'auth.me'
    },
    {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
    }
)

checkLinks: async () => this.fetch2<Auth_Logout_Output>(
    '/auth/logout',
    null,
    {
        inputSchema: null,
        outputSchema: schemas.chords_checkLinks_Output,
        endpoint: 'chords.checkLinks'
    },
    {
        method: 'GET'
    }
),
```

TODO:

- Make sure the design covers all the cases (with/without input, with/without auth, others?)
- Make sure the new design works with the existing calls in `front`

The tests in `tests/scripts/generateSDK.test.ts` should be updated accordingly.
