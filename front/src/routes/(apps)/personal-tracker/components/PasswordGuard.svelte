<script lang="ts">
    import { personalTrackerPassword } from '$lib/PersonalTracker';
    import PasswordPrompt from './PasswordPrompt.svelte';
    import type { Snippet } from 'svelte';

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();

    const handleLock = () => {
        if (confirm('Are you sure you want to lock? You will need to re-enter your password.')) {
            personalTrackerPassword.clearPassword();
        }
    };
</script>

{#if $personalTrackerPassword}
    <div class="unlocked-container">
        <div class="lock-button-container">
            <button onclick={handleLock}>🔒 Lock</button>
        </div>
        {@render children()}
    </div>
{:else}
    <PasswordPrompt />
{/if}

<style>
    .unlocked-container {
        position: relative;
    }

    .lock-button-container {
        display: flex;
        justify-content: flex-end;
        margin-bottom: 1rem;
        padding: 0 1rem;
    }
</style>
