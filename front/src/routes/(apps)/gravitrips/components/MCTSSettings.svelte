<script lang="ts">
    import { type MctsConfig, type MctsPreset } from '../ai';
    interface Props {
        onUpdate: (config: MctsConfig) => void;
    }

    let { onUpdate }: Props = $props();

    const mctsPresets: MctsPreset[] = [
        // Low number of iterations → weak lookahead.
        // Higher c → favors exploration, making play less consistent (misses obvious wins).
        // Plays at a beginner level, beatable by casual players.
        { name: 'easy', iterations: 200, c: 2 },
        // Enough iterations to spot short-term tactics and avoid blunders.
        // Balanced exploration/exploitation.
        // Plays at a decent hobby level — challenging but still beatable by a practiced human.
        { name: 'medium', iterations: 1000, c: 1.41 },
        // Much deeper search → reliably sees 2–3 moves ahead.
        // Lower c makes it stick more to strong moves, less “experimental.”
        // Feels sharp and consistent, tough even for strong casual players.
        { name: 'hard', iterations: 5000, c: 0.7 }
    ];

    const initialPreset = mctsPresets[1];

    let iterations = $state(initialPreset.iterations);
    let c = $state(initialPreset.c);

    const update = () => {
        onUpdate({ iterations, c });
    };
</script>

<div>
    <h4>Monte Carlo Tree Search parameters</h4>

    <div class="difficulty-options">
        <label for="mcts-preset">Preset difficulty</label>
        {#each mctsPresets as preset}
            <button
                class:selected={c === preset.c && iterations === preset.iterations}
                onclick={() => {
                    iterations = preset.iterations;
                    c = preset.c;
                    update();
                }}
            >
                {preset.name}
            </button>
        {/each}
    </div>

    <div>
        <h5>Iterations:</h5>
        <input
            id="mcts-iterations"
            onchange={update}
            bind:value={iterations}
            type="number"
            min="0"
        />
    </div>
    <div>
        Number of simulations MCTS will run before choosing a move. Higher values usually mean
        stronger play but slower decisions.
    </div>

    <div>
        <h5>C (exploration constant):</h5>
        <input id="mcts-c" onchange={update} bind:value={c} type="number" min="0" step="0.1" />
    </div>
    <div>
        Controls the balance between exploration and exploitation. Lower values (e.g. 0.5, 0.7)
        favor tested moves, higher values (e.g. 2.0, 5.0) explore more. A typical default is √2 ≈
        1.41.
    </div>
</div>

<style>
    .difficulty-options {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
    }
</style>
