<script lang="ts">
    import { notes, degreeToRoman } from '$lib/Scales';

    type TypeOfChord = 'major' | 'minor' | 'diminished';

    export type Scale = { name: string; intervals: number[]; chords: TypeOfChord[] };
    export type Mode = { name: string; degree: number };

    type Props = {
        tonic: string;
        scale: Scale;
        mode: Mode;
        scales: Scale[];
        modes: Mode[];
        scaleNotes: string[];
        onchange: (tonic: string, scale: Scale, mode: Mode) => void;
    };

    let {
        tonic = $bindable(),
        scale = $bindable(),
        mode = $bindable(),
        scales,
        modes,
        scaleNotes,
        onchange
    }: Props = $props();

    const formatDegreeName = (degree: number, chord: TypeOfChord) => {
        let roman = degreeToRoman(degree);
        if (chord === 'minor') {
            roman = roman.toLowerCase();
        } else if (chord === 'diminished') {
            roman += '°';
        }
        return roman;
    };

    const formatDegreeNote = (note: string, chord: TypeOfChord) => {
        let label = note;
        if (chord === 'minor') {
            label += 'm';
        } else if (chord === 'diminished') {
            label += '°';
        }
        return label;
    };
</script>

<table>
    <thead>
        <tr>
            <th>
                <label for="tonicInput">Tonic</label>
            </th>
            <th>
                <label for="scaleInput">Scale</label>
            </th>
            <th>
                <label for="modeInput">mode</label>
            </th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>
                <select
                    id="tonicInput"
                    bind:value={tonic}
                    onchange={() => onchange(tonic, scale, mode)}
                >
                    {#each notes as note}
                        <option value={note}>
                            {note}
                        </option>
                    {/each}
                </select>
            </td>

            <td>
                <select
                    id="scaleInput"
                    bind:value={scale}
                    onchange={() => onchange(tonic, scale, mode)}
                >
                    {#each scales as s}
                        <option value={s}>
                            {s.name}
                        </option>
                    {/each}
                </select>
            </td>

            <td>
                <select
                    id="modeInput"
                    bind:value={mode}
                    onchange={() => onchange(tonic, scale, mode)}
                >
                    {#each modes as m}
                        <option value={m}>
                            {m.name}
                        </option>
                    {/each}
                </select>
            </td>
        </tr>
    </tbody>
</table>

<table>
    <tbody>
        <tr>
            {#each scale.chords as chord, index}
                <th>{formatDegreeName(index + 1, chord)}</th>
            {/each}
        </tr>
        <tr>
            {#each scaleNotes as note, index}
                <td>{formatDegreeNote(note, scale.chords[index])}</td>
            {/each}
        </tr>
    </tbody>
</table>

<style>
    th,
    td {
        text-align: center;
    }
</style>
