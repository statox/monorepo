<script lang="ts">
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        FormFileInput,
        handleFormError
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { DurationPicker } from '$lib/components/DurationPicker';
    import { uploadToClipboard } from '$lib/Clipboard';
    import { getPageTitle } from '$lib/pageTitle';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);
    let fieldErrors: Record<string, string> = $state({});

    let name: string = $state('');
    let content: string = $state('');
    let files: FileList | undefined = $state();
    let isPublic = $state(false);
    let ttlSeconds: number = $state(0);
    let uploading = $state(false);
    let extractedTitle: string = $state('');

    // Debounce the API call: the cleanup function returned from $effect is called by Svelte
    // before each re-run, cancelling the previous timer. The API is only called once the
    // user has stopped typing for 500ms.
    $effect(() => {
        const currentContent = content;
        const timer = setTimeout(() => {
            getPageTitle(currentContent)
                .then((title) => (extractedTitle = title))
                .catch(() => (extractedTitle = ''));
        }, 500);

        return () => clearTimeout(timer);
    });

    const validateName = () => {
        fieldErrors.name = name?.length ? '' : 'Name is required';
    };

    const upload = async () => {
        noticeMessages = [];
        validateName();

        if (ttlSeconds < 0) {
            fieldErrors.ttl = 'TTL must be positive';
        } else {
            fieldErrors.ttl = '';
        }

        if (Object.values(fieldErrors).some((e) => e)) {
            return;
        }

        const file = files?.[0] ?? null;

        if (!content?.length && !file) {
            noticeMessages.push({
                level: 'error',
                header: 'Either content or file must be defined'
            });
            return;
        }

        try {
            uploading = true;
            await uploadToClipboard({ name, content, ttlSeconds, isPublic }, file);
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
</script>

<FormLayout title="Add a new clipboard entry" backUrl="/clipboard" {noticeMessages}>
    <FormGrid onsubmit={upload}>
        <label for="content">Content</label>
        <textarea id="content" bind:value={content} rows="3"></textarea>

        {#if extractedTitle}
            <span class="field-label">Extracted page title</span>
            <div class="extracted-title">
                <span>{extractedTitle}</span>
                <button type="button" onclick={() => (name = extractedTitle)}>Use as name</button>
            </div>
        {/if}

        <label for="name">Name</label>
        <input id="name" type="text" bind:value={name} onblur={validateName} />
        {#if fieldErrors.name}
            <span class="field-error">{fieldErrors.name}</span>
        {/if}

        <label for="file">File</label>
        <FormFileInput bind:files />

        <label for="ttlSeconds">TTL</label>
        <DurationPicker
            bind:valueInSeconds={ttlSeconds}
            allowedUnits={['minutes', 'hours', 'days', 'months', 'years']}
            defaultDuration={{ value: 10, unit: 'minutes' }}
        />

        <label for="isPublic">Access</label>
        <button
            type="button"
            class="visibility-status"
            class:visibility-public={isPublic}
            onclick={() => (isPublic = !isPublic)}
        >
            {#if isPublic}
                Public
                <i class="fas fa-lock-open"></i>
            {:else}
                Private
                <i class="fas fa-lock"></i>
            {/if}
        </button>

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>

<style>
    .visibility-status {
        background-color: var(--nc-success);
        max-width: 150px;
    }
    .visibility-public {
        background-color: var(--nc-error);
    }

    .extracted-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        span {
            flex: 1;
            font-style: italic;
            color: var(--nc-tx-2);
        }

        button {
            white-space: nowrap;
        }
    }

    .field-label {
        font-style: italic;
    }
</style>
