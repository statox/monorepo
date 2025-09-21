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

    let currentMctsPreset: MctsPreset | null = $state(mctsPresets[1]);

    // svelte-ignore state_referenced_locally
    let iterations = $state(currentMctsPreset.iterations);
    // svelte-ignore state_referenced_locally
    let c = $state(currentMctsPreset.c);

    const update = () => {
        onUpdate({ iterations, c });
    };
</script>

<div>
    <h4>Monte Carlo Tree Search parameters</h4>

    <label for="mcts-preset">Preset difficulty</label>
    <select
        bind:value={currentMctsPreset}
        onchange={() => {
            if (!currentMctsPreset) {
                return;
            }
            iterations = currentMctsPreset.iterations;
            c = currentMctsPreset.c;
            update();
        }}
    >
        {#each mctsPresets as mctsPreset}
            <option value={mctsPreset}>
                {mctsPreset.name}
            </option>
        {/each}
    </select>

    <br /><br />

    <label for="mcts-iterations">Iterations:</label>
    <input
        id="mcts-iterations"
        onchange={() => {
            currentMctsPreset = null;
            update();
        }}
        bind:value={iterations}
        type="number"
        min="0"
    />
    <small>
        Number of simulations MCTS will run before choosing a move. Higher values usually mean
        stronger play but slower decisions.
    </small>

    <br /><br />

    <label for="mcts-c">C (exploration constant):</label>
    <input
        id="mcts-c"
        onchange={() => {
            currentMctsPreset = null;
            update();
        }}
        bind:value={c}
        type="number"
        min="0"
        step="0.1"
    />
    <small>
        Controls the balance between exploration and exploitation. Lower values (e.g. 0.5, 0.7)
        favor tested moves, higher values (e.g. 2.0, 5.0) explore more. A typical default is √2 ≈
        1.41.
    </small>
</div>
