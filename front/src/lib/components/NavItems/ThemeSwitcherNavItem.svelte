<script lang="ts">
    import { onMount } from 'svelte';

    const buttonClassLight = 'fas fa-moon';
    const buttonClassDark = 'fas fa-sun';

    let darkTheme = false;
    let buttonClass = buttonClassLight;

    let htmlElement: HTMLElement;

    const toggle = () => {
        darkTheme = !darkTheme;

        if (darkTheme) {
            htmlElement.dataset.theme = 'dark';
            buttonClass = buttonClassDark;
        } else {
            htmlElement.dataset.theme = 'light';
            buttonClass = buttonClassLight;
        }
    };

    onMount(() => (htmlElement = document.documentElement));
</script>

<button on:click={toggle}>
    <i class={buttonClass} aria-hidden="true"></i>
</button>

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
    .fas {
        font-size: 1.5em;
    }
</style>
