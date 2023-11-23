<script lang="ts">
    // https://hellomusictheory.com/learn/scale-degree-names/
    // https://ianring.com/musictheory/scales/

    type Interval = number;
    const notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];

    // Intervals a numbers of semitones
    type Scale = { name: string, intervals: Interval[] };
    const scales: Scale[] = [
        { name: 'Major', intervals: [2, 2, 1, 2, 2, 2, 1]},
        { name: 'Natural minor', intervals: [ 2, 1, 2, 2, 1, 2, 2]},
        { name: 'Pentatonic major', intervals: [2, 2, 3, 2, 3]},
        { name: 'Pentatonic minor', intervals: [3, 2, 2, 3, 2]},
    ];

    type Mode = { name: string, degree: number };
    const modes: Mode[] = [
        { name: 'Ionian'     ,  degree: 1},
        { name: 'Dorian'     ,  degree: 2},
        { name: 'Phrygian'   ,  degree: 3},
        { name: 'Lydian'     ,  degree: 4},
        { name: 'Mixolydian' ,  degree: 5},
        { name: 'Aeolian'    ,  degree: 6},
        { name: 'Locrian'    ,  degree: 7}
    ];

    let tonic = 'C';
    let scale = scales[0];
    let mode = modes[0];

    const getScale = (tonic: string, scale: Scale, mode: Mode) => {
        const { intervals } = scale;
        const scaleNotes = [tonic];

        const tonicIndex = notes.indexOf(tonic);
        if (tonicIndex === -1) {
            throw new Error(`Tonic ${tonic} not found`);
        }

        let index = tonicIndex;
        for (const interval of intervals) {
            index = (index + interval) % notes.length;
            scaleNotes.push(notes[index]);
        }

        // Remove the tonic from the last position
        scaleNotes.pop();

        for (let i=1; i<mode.degree; i++) {
            scaleNotes.push(scaleNotes.shift()!);
        }

        return scaleNotes;
    };
</script>

<h2>Scales</h2>

<span>
    <label for='tonicInput'>Tonic</label>
    <select id='tonicInput' bind:value={tonic} >
        {#each notes as note}
            <option value={note}>
                {note}
            </option>
        {/each}
    </select>
</span>

<span>
    <label for='scaleInput'>Scale</label>
    <select id='scaleInput' bind:value={scale} >
        {#each scales as scale}
            <option value={scale}>
                {scale.name}
            </option>
        {/each}
    </select>
</span>

<span>
    <label for='modeInput'>mode</label>
    <select id='modeInput' bind:value={mode} >
        {#each modes as mode}
            <option value={mode}>
                {mode.name}
            </option>
        {/each}
    </select>
</span>

<br/>

{getScale(tonic, scale, mode).join(' ')}
