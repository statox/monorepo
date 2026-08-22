<script lang="ts">
    import { FilteredSelect } from '$lib/components/FilteredSelect';
    import {
        FormLayout,
        FormGrid,
        FormSubmitButton,
        handleFormError,
        showSuccessToast
    } from '$lib/components/FormLayout';
    import type { NoticeItem } from '$lib/components/Notice';
    import { getChords, uploadNewChord, type ChordData } from '$lib/Songbook';
    import { onMount } from 'svelte';

    interface Props {
        onUpload: () => void;
    }

    let { onUpload }: Props = $props();

    let fieldErrors: Record<string, string> = $state({});
    let title: string = $state('');
    let artist: string = $state('');
    let url: string = $state('');
    let tags: string = $state('');
    let uploading = $state(false);
    let noticeMessages: NoticeItem[] = $state([]);
    let existingArtists: string[] = $state([]);
    let existingTitles: string[] = $state([]);

    const validateTitle = () => {
        fieldErrors.title = title ? '' : 'Title is required';
    };

    const validateArtist = () => {
        fieldErrors.artist = artist ? '' : 'Artist is required';
    };

    const validateUrl = () => {
        try {
            new URL(url);
            fieldErrors.url = '';
        } catch {
            fieldErrors.url = url ? 'URL is invalid' : 'URL is required';
        }
    };

    const upload = async () => {
        noticeMessages = [];
        validateTitle();
        validateArtist();
        validateUrl();

        if (Object.values(fieldErrors).some((e) => e)) return;

        const tagList = tags ? tags.replaceAll(' ', '').split(',') : [];
        const newChord: ChordData = { title, artist, url, tags: tagList };

        try {
            uploading = true;
            await uploadNewChord(newChord);
            showSuccessToast('Song added successfully');
            onUpload();
        } catch (error) {
            handleFormError(error);
        } finally {
            uploading = false;
        }
    };

    onMount(async () => {
        const chords = await getChords();

        const data = chords.reduce(
            (acc, chord) => {
                acc.artists.add(chord.artist);
                acc.titles.add(chord.title);
                return acc;
            },
            { artists: new Set(), titles: new Set() }
        );

        existingArtists = [...data.artists] as string[];
        existingTitles = [...data.titles] as string[];
    });
</script>

<FormLayout
    title="Add a new song"
    backUrl="/songbook"
    authMessage="Login to add a new song"
    {noticeMessages}
>
    <FormGrid onsubmit={upload}>
        <label for="artist">Artist</label>
        <FilteredSelect bind:value={artist} options={existingArtists} oninput={validateArtist} />
        {#if fieldErrors.artist}
            <span class="field-error">{fieldErrors.artist}</span>
        {/if}

        <label for="title">Title</label>
        <FilteredSelect bind:value={title} options={existingTitles} oninput={validateTitle} />
        {#if fieldErrors.title}
            <span class="field-error">{fieldErrors.title}</span>
        {/if}

        <label for="url">URL</label>
        <input id="url" type="text" bind:value={url} onblur={validateUrl} />
        {#if fieldErrors.url}
            <span class="field-error">{fieldErrors.url}</span>
        {/if}

        <label for="tags">Tags</label>
        <input id="tags" type="text" bind:value={tags} />

        <FormSubmitButton loading={uploading} />
    </FormGrid>
</FormLayout>
