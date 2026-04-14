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
    let tags = $state('');
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
            await uploadToReactor({ name, commaSeparatedTags: tags, file });
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
        <input id="name" type="text" bind:value={name} />

        <label for="tags">Tags</label>
        <textarea id="tags" bind:value={tags} rows="2"></textarea>

        <label for="file">File</label>
        <FormFileInput bind:files />

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
