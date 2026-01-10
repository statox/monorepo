<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/state';
    import { PUBLIC_BLOG_URL } from '$env/static/public';

    // We need to do the redirection on component mount on the client side
    // Because doing that on the server side with the static adapter is not possible
    // since all the possibles links are not referenced from this app

    // The idea comes from this repo
    // https://github.com/mohit2152sharma/svelte-mpa-example
    onMount(() => {
        const { path } = page.params;
        window.location.href = PUBLIC_BLOG_URL + /posts/ + path;
    });
</script>
