<script lang="ts">
    import NotesOnKeyboard from './NotesOnKeyboard.svelte';
    import NotesOnNeck from './NotesOnNeck.svelte';

    interface Props {
        notesToDisplay: string[];
    }

    let { notesToDisplay }: Props = $props();

    type LabelMode = 'name' | 'degree';
    let labelMode: LabelMode = $state('name');

    const displayModes = ['neck', 'keyboard', 'both'];
    let displayMode = $state(0);
</script>

<div>
    <span>Notation</span>
    <button onclick={() => (labelMode = labelMode === 'name' ? 'degree' : 'name')}>C / IV</button>
    <span>Instrument</span>
    <button onclick={() => (displayMode = (displayMode + 1) % displayModes.length)}
        ><i class="fas fa-guitar"></i> / <i class="fas fa-keyboard"></i></button
    >
</div>

{#if ['neck', 'both'].includes(displayModes[displayMode])}
    <NotesOnNeck {notesToDisplay} {labelMode} />
{/if}
{#if ['keyboard', 'both'].includes(displayModes[displayMode])}
    <NotesOnKeyboard {notesToDisplay} {labelMode} />
{/if}
