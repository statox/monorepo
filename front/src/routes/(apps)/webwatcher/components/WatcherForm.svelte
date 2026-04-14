<script lang="ts">
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        handleFormError
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { DurationPicker } from '$lib/components/DurationPicker';
    import { createWatcher, type WatchType } from '$lib/WebWatcher';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    let name: string = $state('');
    let notificationMessage: string = $state('');
    let url: string = $state('');
    let cssSelector: string = $state('');
    let checkIntervalSeconds: number = $state(0);
    let watchType: WatchType = $state('CSS');
    let uploading = $state(false);

    const upload = async () => {
        noticeMessages = [];
        if (!name?.length) {
            noticeMessages.push({ level: 'error', header: 'name must be defined' });
        }
        if (!notificationMessage) {
            noticeMessages.push({ level: 'error', header: 'notification message must be defined' });
        }

        if (watchType === 'CSS' && !cssSelector) {
            noticeMessages.push({
                level: 'error',
                header: 'A CSS watcher must have a css selector defined'
            });
        }

        if (checkIntervalSeconds < 15 * 60) {
            noticeMessages.push({
                level: 'error',
                header: 'Check interval too small. Must be >= 15mn'
            });
        }

        try {
            new URL(url);
        } catch (_error) {
            noticeMessages.push({ level: 'error', header: 'The URL is invalid' });
        }

        if (noticeMessages.length) {
            return;
        }

        try {
            uploading = true;
            if (watchType === 'CSS') {
                await createWatcher({
                    name,
                    notificationMessage,
                    url,
                    cssSelector,
                    checkIntervalSeconds,
                    watchType
                });
            } else if (watchType === 'HASH') {
                await createWatcher({
                    name,
                    notificationMessage,
                    url,
                    checkIntervalSeconds,
                    watchType
                });
            }
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
</script>

<FormLayout title="Add a new watcher" backUrl="/webwatcher" {noticeMessages}>
    <FormGrid onsubmit={upload}>
        <label for="name">Name</label>
        <input id="name" type="text" bind:value={name} />

        <label for="check-interval">Check interval</label>
        <DurationPicker
            bind:valueInSeconds={checkIntervalSeconds}
            allowedUnits={['minutes', 'hours', 'days']}
            defaultDuration={{ value: 1, unit: 'hours' }}
        />

        <label for="notification-message">
            Notification message (the @mention is automatically added)
        </label>
        <textarea id="notification-message" bind:value={notificationMessage} rows="2"></textarea>

        <label for="watch-type">Watcher type</label>
        <select id="watch-type" bind:value={watchType}>
            <option value="CSS">CSS</option>
            <option value="HASH">HASH</option>
        </select>

        <label for="url">URL</label>
        <textarea id="url" bind:value={url} rows="2"></textarea>

        {#if watchType === 'CSS'}
            <label for="css-selector">CSS selector</label>
            <textarea id="css-selector" bind:value={cssSelector} rows="2"></textarea>
        {/if}

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
