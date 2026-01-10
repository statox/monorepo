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

    let cause: string | undefined = $derived.by(() => {
        if ($user && userIsAllowed) {
            return;
        }
        if (!$user) {
            return 'User is logged out';
        }
        if (!userIsAllowed) {
            return "User doesn't have required scope";
        }
        return 'Something is wrong. Please contact admin.';
    });
</script>

{#if $user && userIsAllowed}
    {@render children()}
{:else if !hideIfForbidden}
    <Notice
        item={{
            level: 'info',
            header: message ?? 'Login required',
            message: cause
        }}
    />
{/if}
