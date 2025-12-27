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

<div class="login-container">
    <div class="login-card">
        <h2>Login</h2>

        {#if $user?.status == 'logged_in'}
            <p>You are already logged in as {$user?.user.username}</p>
        {:else}
            <form onsubmit={doLogin}>
                <div class="input-group">
                    <label for="username">Username:</label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        autocomplete="username"
                        placeholder="Enter your username"
                        required
                        bind:value={username}
                    />
                </div>
                <div class="input-group">
                    <label for="current-password">Password:</label>
                    <input
                        id="current-password"
                        name="password"
                        type="password"
                        autocomplete="current-password"
                        placeholder="Enter your password"
                        required
                        bind:value={password}
                    />
                </div>

                {#if error}
                    <Notice
                        item={{
                            level: 'error',
                            header: 'Failed auth',
                            message: error.toString()
                        }}
                    />
                {/if}

                <button type="submit">Sign in</button>
            </form>
        {/if}
    </div>
</div>

<style>
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        padding: 2rem;
    }

    .login-card {
        max-width: 500px;
        width: 100%;
        padding: 2rem;
        border: 1px solid var(--nc-bg-3);
        border-radius: 8px;
        background-color: var(--nc-bg-2);
    }

    h2 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .input-group {
        margin: 1.5rem 0;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        border: 1px solid var(--nc-bg-3);
        border-radius: 4px;
        box-sizing: border-box;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        font-weight: bold;
        margin-top: 1rem;
    }

    p {
        text-align: center;
    }
</style>
