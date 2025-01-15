<script lang="ts">
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';

    const darkModeEnabled = writable<boolean>(false);
    const buttonClassLight = 'fas fa-moon';
    const buttonClassDark = 'fas fa-sun';

    let buttonClass = $state(buttonClassLight);
    let htmlElement: HTMLElement;

    const toggle = () => {
        darkModeEnabled.set(!$darkModeEnabled);
        setClass();
    };

    const setClass = () => {
        if ($darkModeEnabled) {
            htmlElement.dataset.theme = 'dark';
            buttonClass = buttonClassDark;
        } else {
            htmlElement.dataset.theme = 'light';
            buttonClass = buttonClassLight;
        }
    };

    onMount(() => {
        htmlElement = document.documentElement;

        // Note: We need to do the localStorage operations in onMount because this
        // component is rendered server side and I didn't find a way to disable the SSR
        // only for this component and not for the other NavItems
        const darkModeEnabledStr = localStorage.getItem('darkModeEnabled') || true;
        darkModeEnabled.set(darkModeEnabledStr === 'true');
        darkModeEnabled.subscribe((value) => {
            localStorage.setItem('darkModeEnabled', value.toString());
        });

        setClass();
    });
</script>

<button aria-label="switch theme" onclick={toggle}>
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
