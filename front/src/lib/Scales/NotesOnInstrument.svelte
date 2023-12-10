<script lang="ts">
    import NotesOnKeyboard from './NotesOnKeyboard.svelte';
    import NotesOnNeck from './NotesOnNeck.svelte';

    export let notesToDisplay: string[];

    type LabelMode = 'name' | 'degree';
    let labelMode: LabelMode = 'name';

    const displayModes = ['neck', 'keyboard', 'both'];
    let displayMode = 0;
</script>

<h3>Instrument</h3>

<div>
    <button on:click={() => (labelMode = labelMode === 'name' ? 'degree' : 'name')}>C / IV</button>
    <button on:click={() => (displayMode = (displayMode + 1) % displayModes.length)}
        ><i class="fas fa-guitar"></i> / <i class="fas fa-keyboard"></i></button
    >
</div>

{#if ['neck', 'both'].includes(displayModes[displayMode])}
    <NotesOnNeck {notesToDisplay} {labelMode} />
{/if}
{#if ['keyboard', 'both'].includes(displayModes[displayMode])}
    <NotesOnKeyboard {notesToDisplay} {labelMode} />
{/if}
