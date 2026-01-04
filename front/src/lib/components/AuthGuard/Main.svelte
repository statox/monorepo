<script lang="ts">
    import { isAllowedForUser, user, type Scope } from '$lib/auth';
    import type { Snippet } from 'svelte';
    import { Notice } from '../Notice';

    interface Props {
        message?: string;
        requiredScope?: Scope;
        hideIfForbidden?: true;
        children: Snippet;
    }

    let { children, hideIfForbidden, message, requiredScope }: Props = $props();

    let userIsAllowed = $derived(
        requiredScope !== undefined ? isAllowedForUser(requiredScope, $user) : true
    );
</script>

{#if !$user}
    {#if !hideIfForbidden}
        <Notice
            item={{
                level: 'info',
                header: message ?? 'Login required',
                message: 'User is logged out'
            }}
        />
    {/if}
{:else if !userIsAllowed}
    {#if !hideIfForbidden}
        <Notice
            item={{
                level: 'info',
                header: message ?? 'Login required',
                message: "User doesn't have required scope"
            }}
        />
    {/if}
{:else}
    {@render children()}
{/if}
