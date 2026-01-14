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

    let name: string = $state('');
    let commaSeparatedTags = $state('');
    let files: FileList | undefined = $state();
    let uploading = $state(false);

    const upload = async () => {
        noticeMessages = [];
        if (!name?.length) {
            noticeMessages.push({ level: 'error', header: 'name must be defined' });
        }
        let file: File | undefined;
        if (files && files.length) {
            file = files[0];
        }
        if (!file) {
            noticeMessages.push({ level: 'error', header: 'a file must be uploaded' });
        }

        if (noticeMessages.length || !file) {
            return;
        }

        try {
            uploading = true;
            await uploadToReactor({ name, commaSeparatedTags, file });
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };
</script>

<FormLayout title="Add a new file" backUrl="/reactor" {noticeMessages}>
    <FormGrid>
        <label for="name">Name</label>
        <input type="text" bind:value={name} />

        <label for="content">Tags</label>
        <input type="textarea" bind:value={commaSeparatedTags} />

        <label for="file">File</label>
        <FormFileInput bind:files />

        <FormSubmitButton onclick={upload} loading={uploading} />
    </FormGrid>
</FormLayout>
