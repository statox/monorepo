<script lang="ts">
    import { goto } from '$app/navigation';
    import { checkAuth, login, user } from '$lib/auth2';
    import { Notice } from '$lib/components/Notice';

    let username = $state('');
    let password = $state('');
    let error = $state<Error | string>();

    const doLogin = async () => {
        try {
            await login(username, password);
            await checkAuth();
            if ($user?.status == 'logged_in') {
                goto('/auth/me');
            } else {
                error = new Error('Invalid password or username');
            }
        } catch (err) {
            if ((err as Error)?.message === '{"message":"UNAUTHORIZED"}') {
                error = 'Invalid password or username';
                return;
            }
            error = err as Error;
        }
    };

    $effect(() => {
        // When navigating to this page while logged in you get redirected automatically
        if ($user?.status == 'logged_in') {
            goto('/auth/me');
        }
    });
</script>

<h2>Login</h2>

<form>
    <section>
        <label for="username">Username</label>
        <input
            id="username"
            name="username"
            type="text"
            autocomplete="username"
            required
            bind:value={username}
        />
    </section>
    <section>
        <label for="current-password">Password</label>
        <input
            id="current-password"
            name="password"
            type="password"
            autocomplete="current-password"
            required
            bind:value={password}
        />
    </section>
    <button onclick={doLogin}>Sign in</button>
</form>

{#if error}
    <Notice
        item={{
            level: 'error',
            header: 'Failed auth',
            message: error.toString()
        }}
    />
{/if}
