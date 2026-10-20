<script lang="ts">
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        FormFileInput,
        handleFormError
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { isReactorMime, REACTOR_MAX_SIZE_BYTES, uploadToReactor } from '$lib/Reactor';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);
    let fieldErrors: Record<string, string> = $state({});

    let name: string = $state('');
    let tags = $state('');
    let files: FileList | undefined = $state();
    let uploading = $state(false);

    const validateName = () => {
        fieldErrors.name = name?.length ? '' : 'Name is required';
    };

    const validateFile = (file: File | undefined) => {
        if (!file) {
            fieldErrors.file = 'A file must be uploaded';
        } else if (!isReactorMime(file.type)) {
            fieldErrors.file = 'Only png, jpeg, gif and webp images are allowed';
        } else if (file.size > REACTOR_MAX_SIZE_BYTES) {
            fieldErrors.file = 'The file must be 10 MB or less';
        } else {
            fieldErrors.file = '';
        }
    };

    const upload = async () => {
        noticeMessages = [];
        validateName();

        const file = files?.[0];
        validateFile(file);

        if (Object.values(fieldErrors).some((e) => e) || !file) {
            return;
        }

        try {
            uploading = true;
            const tagList = tags
                .split(',')
                .map((tag) => tag.trim())
                .filter((tag) => tag.length);
            await uploadToReactor({ name, tags: tagList }, file);
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
</script>

<FormLayout title="Add a new file" backUrl="/reactor" {noticeMessages}>
    <FormGrid onsubmit={upload}>
        <label for="name">Name</label>
        <input id="name" type="text" bind:value={name} onblur={validateName} />
        {#if fieldErrors.name}
            <span class="field-error">{fieldErrors.name}</span>
        {/if}

        <label for="tags">Tags</label>
        <textarea id="tags" bind:value={tags} rows="2"></textarea>

        <label for="file">File</label>
        <FormFileInput bind:files />
        {#if fieldErrors.file}
            <span class="field-error">{fieldErrors.file}</span>
        {/if}

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
