<script lang="ts">
    import { PUBLIC_API_URL } from '$env/static/public';
    import { login, getAccessToken, logout, user } from '$lib/auth/service';
    import { toast } from '$lib/components/Toast';

    let message: string;

    const testAPIcall = async () => {
        getAccessToken()
            .then((token) =>
                fetch(PUBLIC_API_URL + '/protected', {
                    method: "GET",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                })
            )
            .then(async (response) => {
                message = await response.json();
            })
            .catch((error) => {
                message = error.message;
                toast.push(message,  {
                    theme: {
                        '--toastBarBackground': '#FF0000'
                    }
                });
            });
    };
</script>

<h2>Authentication</h2>

<div>
    <button on:click={() => login()}>Login</button>
    <button on:click={() => testAPIcall()}>API</button>
    <button on:click={() => logout()}>Logout</button>
</div>

<div class="user">
    {#if $user}
        <img class="user-profile" alt='user profile' src={$user.picture} />
        <span>{$user.nickname} - {$user.email}</span>
    {:else}
        <span>Not authenticated</span>
    {/if}
</div>

{#if message}
    <div>
        <span>{JSON.stringify(message)}</span>
    </div>
{/if}

<style>
    .user {
        display: flex;
        justify-content: flex-start;
    }
    .user-profile {
        height: 2em;
        width: 2em;
    }
</style>
