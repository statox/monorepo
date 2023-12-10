<script lang="ts">
    export let currentBpm: number;
    type Tempo = {
        name: string;
        description: string;
        low?: number;
        high?: number;
    };
    const tempos: Tempo[] = [
        { name: 'Larghissimo', description: 'Extremely slow, slowest type of tempo', high: 24 },
        {
            name: 'Adagissimo and Grave',
            description: 'Very slow, very slow and solemn',
            low: 24,
            high: 40
        },
        { name: 'Largo', description: 'Slow and broad', low: 40, high: 66 },
        { name: 'Larghetto', description: 'Rather slow and broad', low: 44, high: 66 },
        { name: 'Adagio', description: 'Slow with great expression', low: 44, high: 68 },
        {
            name: 'Adagietto',
            description: 'Slower than andante or slightly faster than adagio',
            low: 46,
            high: 80
        },
        { name: 'Lento', description: 'Slow', low: 52, high: 108 },
        { name: 'Andante', description: 'At a walking pace, moderately slow', low: 56, high: 108 },
        {
            name: 'Andantino',
            description:
                'Slightly faster than andante, but slower than moderato (although, in some cases, it can be taken to mean slightly slower than andante)',
            low: 80,
            high: 108
        },
        {
            name: 'Andante moderato',
            description: 'Between andante and moderato (at a moderate walking speed)',
            low: 80,
            high: 108
        },
        { name: 'Moderato', description: 'At a moderate speed', low: 108, high: 120 },
        {
            name: 'Allegretto',
            description: 'By the mid-19th century, moderately fast',
            low: 112,
            high: 120
        },
        {
            name: 'Allegro moderato',
            description: 'Close to, but not quite allegro',
            low: 116,
            high: 120
        },
        { name: 'Allegro', description: 'Fast and bright', low: 120, high: 156 },
        {
            name: 'Molto Allegro or Allegro vivace',
            description:
                'At least slightly faster and livelier than allegro, but always at its range (and no faster than vivace)',
            low: 124,
            high: 156
        },
        { name: 'Vivace', description: 'Lively and fast', low: 156, high: 176 },
        {
            name: 'Vivacissimo and Allegrissimo',
            description: 'Very fast, lively and bright',
            low: 172,
            high: 176
        },
        { name: 'Presto', description: 'Very fast', low: 168, high: 200 },
        {
            name: 'Prestissimo',
            description: 'Extremely fast (At this tempo, cut common time is often used)',
            low: 200
        }
    ];

    const selected = (currentBpm: number, tempo: Tempo) =>
        currentBpm > (tempo.low ?? 0) && currentBpm <= (tempo.high ?? 9999);
    const formatBPM = (tempo: Tempo) => {
        if (tempo.high && tempo.low) {
            return `${tempo.low} - ${tempo.high}`;
        }
        if (tempo.low) {
            return `>${tempo.low}`;
        }
        if (tempo.high) {
            return `<${tempo.high}`;
        }
    };
</script>

<div class="container">
    <span class="col table-head">BPM</span>
    <span class="col table-head">Tempo</span>
    <span class="col table-head">Description</span>

    {#each tempos as tempo}
        <span class="col" class:selected={selected(currentBpm, tempo)}>{formatBPM(tempo)}</span>
        <span class="col" class:selected={selected(currentBpm, tempo)}>{tempo.name}</span>
        <span class="col" class:selected={selected(currentBpm, tempo)}>{tempo.description}</span>
    {/each}
</div>

<style>
    .table-head {
        background-color: var(--nc-bg-2);
        font-weight: bold;
    }
    .container {
        display: grid;
        flex-wrap: wrap;
        grid-template-columns: auto 1fr 2fr;
    }
    .container .col {
        box-sizing: border-box;
        padding: 0.2em;
        border: 1px solid var(--nc-bg-3);
    }
    .selected {
        background-color: var(--nc-bg-2);
        font-weight: bold;
    }
</style>
