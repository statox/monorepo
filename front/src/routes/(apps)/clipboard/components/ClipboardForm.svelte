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

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);

    let name: string = $state('');
    let content: string = $state('');
    let files: FileList | undefined = $state();
    let isPublic = $state(false);
    let ttlSeconds: number = $state(0);
    let uploading = $state(false);

    const upload = async () => {
        noticeMessages = [];
        if (!name?.length) {
            noticeMessages.push({ level: 'error', header: 'name must be defined' });
        }

        if (ttlSeconds < 0) {
            noticeMessages.push({ level: 'error', header: 'TTL must be positive' });
        }

        if (noticeMessages.length) {
            return;
        }

        let file: File | undefined;
        if (files && files.length) {
            file = files[0] || undefined;
        }

        if (!content?.length && !file) {
            noticeMessages.push({
                level: 'error',
                header: 'Either content or file must be defined'
            });
            return;
        }

        try {
            uploading = true;
            await uploadToClipboard({ name, content, ttlSeconds, isPublic, file });
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
</script>

<FormLayout title="Add a new clipboard entry" backUrl="/clipboard" {noticeMessages}>
    <FormGrid>
        <label for="name">Name</label>
        <input type="text" bind:value={name} />

        <label for="content">Content</label>
        <input type="textarea" bind:value={content} />

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

        <FormSubmitButton onclick={upload} loading={uploading} />
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
</style>
