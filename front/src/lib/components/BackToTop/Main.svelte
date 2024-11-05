<script lang="ts">
    let y: number;

    let hide = true;
    let scrollTimer: ReturnType<typeof setTimeout>;
    const onScroll = (y: number) => {
        // If the scroll value is greater than the window height, let's add a class to the scroll-to-top button to show it!
        if (y > 0) {
            hide = false;
        } else {
            hide = true;
        }

        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }
        scrollTimer = setTimeout(() => {
            hide = true;
        }, 3000);
    };

    const scrollToTop = () => {
        // Let's set a variable for the number of pixels we are from the top of the document.
        const c = document.documentElement.scrollTop || document.body.scrollTop;

        // If that number is greater than 0, we'll scroll back to 0, or the top of the document.
        // We'll also animate that scroll with requestAnimationFrame:
        // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
        if (c > 0) {
            window.requestAnimationFrame(scrollToTop);
            // ScrollTo takes an x and a y coordinate.
            // Increase the denominator value to get a smoother/slower scroll!
            window.scrollTo(0, c - c / 2);
        }
    };

    $: onScroll(y);
</script>

<svelte:window bind:scrollY={y} />

<button class="top-link" class:hide on:click={scrollToTop}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 6"><path d="M12 6H0l6-6z" /></svg>
    <span class="screen-reader-text">Back to top</span>
</button>

<style>
    .top-link {
        transition: all 0.25s ease-in-out;
        position: fixed;
        bottom: 0;
        left: 10;
        display: inline-flex;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        margin: 0 3em 3em 0;
        border-radius: 50%;
        padding: 0.25em;
        width: 40px;
        height: 40px;
        background-color: var(--nc-bg-2);

        visibility: visible;
        opacity: 1;
    }
    .top-link.hide {
        visibility: hidden;
        opacity: 0;
    }
    .top-link svg {
        fill: var(--nc-lk-1);
        width: 24px;
        height: 12px;
    }
    .top-link:hover {
        background-color: var(--nc-bg-0);
    }
    .top-link:hover svg {
        fill: var(--nc-lk-2);
    }

    .screen-reader-text {
        position: absolute;
        clip-path: inset(50%);
        margin: -1px;
        border: 0;
        padding: 0;
        width: 1px;
        height: 1px;
        overflow: hidden;
        word-wrap: normal !important;
        clip: rect(1px, 1px, 1px, 1px);
    }
    .screen-reader-text:focus {
        display: block;
        top: 5px;
        left: 5px;
        z-index: 100000;
        clip-path: none;
        background-color: #eee;
        padding: 15px 23px 14px;
        width: auto;
        height: auto;
        text-decoration: none;
        line-height: normal;
        color: #444;
        font-size: 1em;
        clip: auto !important;
    }
</style>
