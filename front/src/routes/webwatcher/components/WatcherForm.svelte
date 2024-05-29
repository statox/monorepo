<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { DurationPicker } from '$lib/components/DurationPicker';
    import { toast } from '$lib/components/Toast';
    import { user } from '$lib/auth/service';
    import { createWatcher } from '$lib/WebWatcher/api';

    const dispatch = createEventDispatcher();

    let name: string;
    let notificationMessage: string;
    let url: string;
    let cssSelector: string;
    let checkIntervalSeconds: number;

    const upload = async () => {
        if (!name.length || !notificationMessage || !cssSelector) {
            // TODO handle this error in the UI
            console.error('name should be defined');
            return;
        }

        try {
            new URL(url);
        } catch (error) {
            const message = `<strong>URL is invalid</strong>`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
            return;
        }

        if (checkIntervalSeconds < 15 * 60) {
            const message = `<strong>Check interval too small</strong><br/>Must be >= 15mn`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
            return;
        }

        try {
            await createWatcher({
                name,
                notificationMessage,
                url,
                cssSelector,
                checkIntervalSeconds
            });
            dispatch('upload');
        } catch (error) {
            const message = `<strong>Entry not created</strong><br/> ${(error as Error).message}`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };
</script>

{#if $user}
    <div class="section">
        <p class="section-1-item">
            <label for="name">Name</label>
            <input type="text" bind:value={name} />
        </p>
        <p class="section-1-item">
            <label for="check-interval">Check interval</label>
            <DurationPicker
                bind:valueInSeconds={checkIntervalSeconds}
                allowedUnits={['minutes', 'hours', 'days']}
                defaultDuration={{value: 1, unit: 'hours'}}
            />
        </p>
    </div>

    <div class="section">
        <p class="section-2-item">
            <label for="notification-message"
                >Notification message (the @mention is automatically added)</label
            >
            <input type="textarea" bind:value={notificationMessage} />
        </p>
    </div>

    <div class="section">
        <p class="section-3-item">
            <label for="content">URL</label>
            <input type="textarea" bind:value={url} />
        </p>
        <p class="section-3-item">
            <label for="css-selector">CSS selector</label>
            <input type="textarea" bind:value={cssSelector} />
        </p>
    </div>

    <p>
        <button on:click={upload}>Upload</button>
    </p>
{:else}
    <p>Login to upload content</p>
{/if}

<style>
    .section {
        display: flex;
        flex-wrap: wrap;
    }

    .section-2-item {
        flex: 1 0 100%;
    }
    .section-2-item > input {
        width: 100%;
    }

    .section-3-item {
        flex: 1 0 100%;
    }
    .section-3-item > input {
        width: 100%;
    }

    @media screen and (max-width: 750px) {
        .section-1-item {
            flex: 1 0 100%;
        }
        .section-1-item > input {
            width: 100%;
        }
    }
    @media screen and (min-width: 750px) {
        .section-1-item {
            flex: 1 0 50%; /* This will make the items take up 50% of the container's width, effectively creating two columns */
        }
        .section-1-item > input {
            width: 100%;
        }
    }
</style>
