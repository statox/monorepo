<script lang="ts">
    import { AuthGuard } from '$lib/components/AuthGuard';
    import { toast } from '$lib/components/Toast';
    import EventFormEmotionWheel from './components/EventFormEmotionWheel.svelte';
    import EventFormMood from './components/EventFormMood.svelte';
    import EventFormWeight from './components/EventFormWeight.svelte';
    import PasswordGuard from '../../components/PasswordGuard.svelte';
    import {
        encryptAndUpload,
        eventsStore,
        personalTrackerPassword,
        type PersonalTrackerData
    } from '$lib/PersonalTracker';

    import { pageMetadataStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { SvelteSet } from 'svelte/reactivity';
    import { onMount } from 'svelte';
    import { DateTime } from 'luxon';

    pageMetadataStore.set({
        name: 'Personal Tracker',
        iconPath: '/personal_tracker.png',
        showAuthInHeader: true
    });

    // Form values
    let moodValue = $state<number>(5);
    let weightValue = $state<number>(100);
    let emotionSelection = new SvelteSet<string>();

    // Track which sections are enabled
    let moodEnabled = $state<boolean>(false);
    let weightEnabled = $state<boolean>(false);
    let emotionEnabled = $state<boolean>(false);

    // Form refs for validation
    let weightFormRef: EventFormWeight;

    // Compute consistent timestamp for today (start of day in UTC)
    const getTodayTimestamp = () => {
        return DateTime.now().toUTC().startOf('day').toUnixInteger();
    };

    // Get the timestamp to work with (from URL param or default to today)
    const getTargetTimestamp = (): number => {
        const timestampParam = page.params.timestamp;
        if (timestampParam) {
            const parsed = parseInt(timestampParam, 10);
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
        return getTodayTimestamp();
    };

    // Check if we're in edit mode
    const isEditMode = $derived(!!page.params.timestamp);

    // Load existing event on mount
    onMount(async () => {
        try {
            // Fetch events if not already cached
            await eventsStore.fetch($personalTrackerPassword);

            const targetTimestamp = getTargetTimestamp();

            // Find event with target timestamp (exact match)
            const existingEvent = $eventsStore.events.find(
                (event) => event.eventDateUnix === targetTimestamp
            );

            if (existingEvent) {
                // Pre-populate form values and enable sections with data
                if (existingEvent.mood !== undefined) {
                    moodValue = existingEvent.mood;
                    moodEnabled = true;
                }
                if (existingEvent.weight !== undefined) {
                    // Convert back from storage format (centikgs to kg)
                    weightValue = existingEvent.weight / 100;
                    weightEnabled = true;
                }
                if (existingEvent.emotionwheel?.emotions) {
                    // Reconstruct selection set
                    const newSelection = new SvelteSet<string>();
                    existingEvent.emotionwheel.emotions.forEach((emotion) => {
                        const entryAsStr = [
                            emotion.category,
                            emotion.subcategory,
                            emotion.emotion,
                            emotion.color
                        ].join(' - ');
                        newSelection.add(entryAsStr);
                    });
                    emotionSelection.clear();
                    newSelection.forEach((v) => emotionSelection.add(v));
                    emotionEnabled = true;
                }
            }
        } catch (error) {
            console.error('Failed to load existing event:', error);
            toast.push('Failed to load existing event', {
                theme: {
                    '--toastBarBackground': '#FFA500'
                }
            });
        }
    });

    const handleSubmit = async () => {
        // Check if at least one section is enabled
        if (!moodEnabled && !weightEnabled && !emotionEnabled) {
            toast.push('Please enable at least one section to submit', {
                theme: {
                    '--toastBarBackground': '#FFA500'
                }
            });
            return;
        }

        // Validate weight if enabled
        if (weightEnabled && weightFormRef && !weightFormRef.validate()) {
            return;
        }

        // Build combined data object with only enabled sections
        const data: PersonalTrackerData = {};

        if (moodEnabled) {
            data.mood = moodValue;
        }

        if (weightEnabled) {
            data.weight = weightFormRef.getStorageValue();
        }

        if (emotionEnabled && emotionSelection.size > 0) {
            const emotions = [...emotionSelection].map((item) => {
                const [category, subcategory, emotion, color] = item.split(' - ');
                return { category, subcategory, emotion, color };
            });
            data.emotionwheel = { emotions };
        }

        try {
            const eventDateUnix = getTargetTimestamp();
            await encryptAndUpload(data, $personalTrackerPassword, eventDateUnix);

            // Invalidate cache so list page will refetch
            eventsStore.invalidate();

            goto('/personal-tracker');
            toast.push(isEditMode ? 'Entry updated' : 'Entry created');
        } catch (error) {
            let errorMessage = (error as Error).message;
            const action = isEditMode ? 'updated' : 'created';
            const message = `<strong>Entry not ${action}</strong><br/> ${errorMessage}`;
            toast.push(message, {
                theme: {
                    '--toastBarBackground': '#FF0000'
                }
            });
        }
    };
</script>

<AuthGuard message="Login to add an entry">
    <PasswordGuard>
        <div class="contents">
            <h4 class="title-bar">
                {isEditMode ? 'Edit Entry' : "Today's Personal Metrics"}
                <button
                    onclick={() => {
                        goto('/personal-tracker');
                    }}>Back</button
                >
            </h4>

            <div class="input-form" class:disabled={!emotionEnabled}>
                <div class="section-header">
                    <label>
                        <input type="checkbox" bind:checked={emotionEnabled} />
                        <span class="section-title">Emotions</span>
                    </label>
                </div>
                {#if emotionEnabled}
                    <EventFormEmotionWheel selection={emotionSelection} />
                {/if}
            </div>
            <hr class="separator" />

            <div class="input-form" class:disabled={!moodEnabled}>
                <div class="section-header">
                    <label>
                        <input type="checkbox" bind:checked={moodEnabled} />
                        <span class="section-title">Mood</span>
                    </label>
                </div>
                {#if moodEnabled}
                    <EventFormMood bind:value={moodValue} />
                {/if}
            </div>
            <hr class="separator" />

            <div class="input-form" class:disabled={!weightEnabled}>
                <div class="section-header">
                    <label>
                        <input type="checkbox" bind:checked={weightEnabled} />
                        <span class="section-title">Weight</span>
                    </label>
                </div>
                {#if weightEnabled}
                    <EventFormWeight bind:this={weightFormRef} bind:value={weightValue} />
                {/if}
            </div>
            <hr class="separator" />

            <div class="submit-container">
                <button class="form-action" onclick={handleSubmit}>
                    {isEditMode ? 'Update Entry' : 'Create Entry'}
                </button>
            </div>
        </div>
    </PasswordGuard>
</AuthGuard>

<style>
    .contents {
        min-width: 240px;
        padding: 16px;
    }
    .title-bar {
        margin-bottom: 1em;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .separator {
        height: 2px;
        border: none;
        background-color: var(--nc-bg-3);
        margin: 1em 0;
    }
    .input-form {
        max-width: 800px;
        transition: opacity 0.2s ease;
    }
    .input-form.disabled {
        opacity: 0.5;
    }
    .section-header {
        margin-bottom: 1em;
    }
    .section-header label {
        display: flex;
        align-items: center;
        gap: 0.5em;
        cursor: pointer;
        user-select: none;
    }
    .section-header input[type='checkbox'] {
        width: 20px;
        height: 20px;
        cursor: pointer;
    }
    .section-title {
        font-weight: bold;
        font-size: 1.1em;
    }
    .submit-container {
        margin-top: 2em;
    }
</style>
