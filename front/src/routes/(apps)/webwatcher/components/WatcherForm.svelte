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
    let fieldErrors: Record<string, string> = $state({});

    let name: string = $state('');
    let notificationMessage: string = $state('');
    let url: string = $state('');
    let cssSelector: string = $state('');
    let checkIntervalSeconds: number = $state(0);
    let watchType: WatchType = $state('CSS');
    let uploading = $state(false);

    const validateName = () => {
        fieldErrors.name = name?.length ? '' : 'Name is required';
    };

    const validateNotificationMessage = () => {
        fieldErrors.notificationMessage = notificationMessage
            ? ''
            : 'Notification message is required';
    };

    const validateUrl = () => {
        try {
            new URL(url);
            fieldErrors.url = '';
        } catch {
            fieldErrors.url = url ? 'URL is invalid' : 'URL is required';
        }
    };

    const validateCssSelector = () => {
        if (watchType === 'CSS') {
            fieldErrors.cssSelector = cssSelector
                ? ''
                : 'CSS selector is required for CSS watchers';
        } else {
            fieldErrors.cssSelector = '';
        }
    };

    const upload = async () => {
        noticeMessages = [];
        validateName();
        validateNotificationMessage();
        validateUrl();
        validateCssSelector();

        if (checkIntervalSeconds < 15 * 60) {
            noticeMessages.push({
                level: 'error',
                header: 'Check interval too small. Must be >= 15mn'
            });
        }

        if (Object.values(fieldErrors).some((e) => e) || noticeMessages.length) {
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
        <input id="name" type="text" bind:value={name} onblur={validateName} />
        {#if fieldErrors.name}
            <span class="field-error">{fieldErrors.name}</span>
        {/if}

        <label for="check-interval">Check interval</label>
        <DurationPicker
            bind:valueInSeconds={checkIntervalSeconds}
            allowedUnits={['minutes', 'hours', 'days']}
            defaultDuration={{ value: 1, unit: 'hours' }}
        />

        <label for="notification-message">
            Notification message (the @mention is automatically added)
        </label>
        <textarea
            id="notification-message"
            bind:value={notificationMessage}
            rows="2"
            onblur={validateNotificationMessage}
        ></textarea>
        {#if fieldErrors.notificationMessage}
            <span class="field-error">{fieldErrors.notificationMessage}</span>
        {/if}

        <label for="watch-type">Watcher type</label>
        <select id="watch-type" bind:value={watchType}>
            <option value="CSS">CSS</option>
            <option value="HASH">HASH</option>
        </select>

        <label for="url">URL</label>
        <textarea id="url" bind:value={url} rows="2" onblur={validateUrl}></textarea>
        {#if fieldErrors.url}
            <span class="field-error">{fieldErrors.url}</span>
        {/if}

        {#if watchType === 'CSS'}
            <label for="css-selector">CSS selector</label>
            <textarea
                id="css-selector"
                bind:value={cssSelector}
                rows="2"
                onblur={validateCssSelector}
            ></textarea>
            {#if fieldErrors.cssSelector}
                <span class="field-error">{fieldErrors.cssSelector}</span>
            {/if}
        {/if}

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
