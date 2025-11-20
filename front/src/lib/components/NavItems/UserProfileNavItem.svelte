<script lang="ts">
    import { logout, user } from '$lib/auth';
</script>

{#if $user}
    <button title="Logout" onclick={logout}>
        <i class="fa fa-sign-out" aria-hidden="true"></i>
    </button>
{/if}

<style>
    button {
        background: none;
        color: var(--nc-lk-1);
        padding: 0;
    }
    button:hover {
        background: none;
        color: var(--nc-lk-2);
    }
    .fa {
        font-size: 1.5em;
    }
</style>
