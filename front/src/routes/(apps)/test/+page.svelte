<script lang="ts">
    /**
     * This is a playground to experiment with my new auto generated client.
     * To be removed once I'm done integrating the SDK completely
     */
    import { client } from '$lib/api';
    import { client2 } from '$lib/api';
    import type { Auth_Me_Output } from '../../../vendor/statox-api';

    console.log(client);
    console.log(client2);

    let password = $state('');
    const test = async () => {
        const now = await client2.health.getRemoteTime();
        console.log(now);

        try {
            const me: Auth_Me_Output = await client2.auth.me({});
            console.log(me);
        } catch {
            console.log('Call to auth.me failed');
        }

        try {
            const resLogin = await client2.auth.login({
                username: 'statox',
                password: password
            });
            console.log(resLogin);
        } catch {
            console.log('Call to auth.login failed');
        }

        try {
            const me = await client2.auth.me({});
            console.log(me);
        } catch {
            console.log('Call to auth.me failed');
        }
    };
</script>

<h1>Test Page</h1>

<label for="password">password:</label>
<input type="text" bind:value={password} />

<button onclick={test}>Test</button>
