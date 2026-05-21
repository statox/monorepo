<script lang="ts">
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        FormFileInput,
        handleFormError
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { uploadToReactor } from '$lib/Reactor';

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

    const upload = async () => {
        noticeMessages = [];
        validateName();

        const file = files?.[0];
        if (!file) {
            noticeMessages.push({ level: 'error', header: 'A file must be uploaded' });
        }

        if (Object.values(fieldErrors).some((e) => e) || !file) {
            return;
        }

        try {
            uploading = true;
            await uploadToReactor({ name, commaSeparatedTags: tags }, file);
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

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
