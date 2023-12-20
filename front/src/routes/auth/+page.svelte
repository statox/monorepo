<script lang="ts">
    import { login, getAccessToken, logout, user } from '$lib/auth/service';

    let token: string;
    let message: string;

    const testAPIcall = () => {
        if (!token) {
            message = 'cant make call, token is not defined';
            return;
        }
        fetch('http://localhost:3000/protected', {
            method: "GET",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
        }).then(async (response) => {
            message = await response.json();
        }).catch((reason) => {
                message = reason;
        });
    };
</script>

<h2>Authentication</h2>

<div>
    <button on:click={() => login()}>Login</button>
    <button on:click={async () => token = await getAccessToken()}>Token</button>
    <button on:click={() => testAPIcall()}>API</button>
    <button on:click={() => logout()}>Logout</button>
</div>

{#if $user}
    <div>
        <span>{$user.nickname} - {$user.email}</span>
        <img alt='user profile' src={$user.picture} />
    </div>
{/if}

{#if token}
    <div>
        <span>{token}</span>
    </div>
{/if}

{#if message}
    <div>
        <span>{JSON.stringify(message)}</span>
    </div>
{/if}
