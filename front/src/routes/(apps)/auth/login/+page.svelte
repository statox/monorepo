<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    import { checkAuth, login, user } from '$lib/auth';
    import { showLoginSuccess } from '$lib/components/Header/store';
    import { Notice } from '$lib/components/Notice';

    let username = $state('');
    let password = $state('');
    let error = $state<Error | string>();

    let previousPage: string = '/';
    afterNavigate(({ from }) => {
        // Keep track of the url of the page on which we clicked the login button
        // to redirect to this page once the login is successful
        if (from?.url.pathname === '/auth/login') {
            // When we submit the form the page is reloaded, we don't want to store that
            return;
        }
        previousPage = from?.url.pathname || previousPage;
    });

    const doLogin = async (event: SubmitEvent) => {
        event.preventDefault(); // Prevent page reload
        try {
            await login(username, password);
            await checkAuth();
            if ($user?.status == 'logged_in') {
                showLoginSuccess.set(true);
                setTimeout(() => showLoginSuccess.set(false), 2500);
                goto(previousPage);
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
</script>

<h2>Login</h2>

{#if $user?.status == 'logged_in'}
    <p>You are already logged in a {$user?.user.username}</p>
{:else}
    <form onsubmit={doLogin}>
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
        <button type="submit">Sign in</button>
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
{/if}
