<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import {
        type Board,
        type Cell,
        BoardState,
        getBoardState,
        getWinningCells,
        nbRows,
        nbColumns,
        makeMove,
        isValidMove
    } from './gravitrip';
    import { makeMonteCarloMove, makeRandomMove, type MoveResult } from './ai';

    let board: Board = $state(Array.from({ length: 7 }, () => []));
    let boardState: BoardState = $derived(getBoardState(board));
    let winningCells: number[][] | null = $derived(getWinningCells(board));
    let selectedColumn: number | null = $state(null);

    type MctsPreset = {
        name: string;
        iterations: number;
        c: number;
    };
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
    let mctsIterations = $state(currentMctsPreset.iterations);
    // svelte-ignore state_referenced_locally
    let mctsC = $state(currentMctsPreset.c);

    type ComputerStategy = 'mcts' | 'random';
    let computerStategy = $state('mcts' as ComputerStategy);

    const rowsIndices = Array.from({ length: nbRows }, (_, i) => i);
    const colsIndices = Array.from({ length: nbColumns }, (_, i) => i);

    let currentPlayer: Cell = $state(1);

    const resetBoard = () => {
        board = Array.from({ length: 7 }, () => []);
        currentPlayer = 1;
    };

    const tryMove = (col: number, cell: Cell) => {
        if (currentPlayer !== 1) {
            return;
        }
        if (!isValidMove(board, col)) {
            return;
        }
        if (getBoardState(board) !== BoardState.notOver) {
            return;
        }
        board = makeMove(board, cell, col);
        currentPlayer = currentPlayer === 1 ? 2 : 1;

        // We need to way a bit before triggering the new move
        // to let the previous piece drop in the grid
        setTimeout(() => computerMove(), 200);
    };

    const computerMove = () => {
        if (currentPlayer !== 2) {
            return;
        }
        if (getBoardState(board) !== BoardState.notOver) {
            return;
        }

        let moveDone: MoveResult;
        if (computerStategy === 'random') {
            moveDone = makeRandomMove(board, currentPlayer);
        } else if (computerStategy === 'mcts') {
            moveDone = makeMonteCarloMove(board, currentPlayer, {
                iterations: mctsIterations,
                c: mctsC
            });
        } else {
            throw new Error('computer strategy not implemented');
        }

        const { board: newBoard, move } = moveDone;
        board = newBoard;
        selectedColumn = move;
        currentPlayer = 1;
    };

    const isWinningCell = (row: number, col: number) => {
        if (winningCells === null) {
            return false;
        }
        return (
            winningCells.filter((winningcell) => {
                return winningcell[0] === row && winningcell[1] === col;
            }).length > 0
        );
    };
</script>

<HeadIOS title="Gravitrip" description="Gravitrip" />

<div class="main">
    <h3>Gravitrip</h3>
</div>

<div>
    See <a
        href="https://www.quora.com/What-is-the-winning-strategy-for-the-first-player-in-Connect-Four-games"
        >this quora thread</a
    > for some tips on the winning strategy
</div>

<span>
    <button onclick={resetBoard}>Restart game</button>

    <span style="font-weight: bold">
        {#if boardState === BoardState.draw}
            Game Over
        {:else if boardState === BoardState.winPlayer1 || boardState === BoardState.winPlayer2}
            Player {boardState} wins
        {/if}
    </span>
</span>

<div>
    Computer stategy:
    <select bind:value={computerStategy}>
        {#each ['mcts', 'random'] as strategy}
            <option value={strategy}>
                {strategy}
            </option>
        {/each}
    </select>
</div>

{#if computerStategy === 'mcts'}
    <div>
        <h4>Monte Carlo Tree Search parameters</h4>

        <label for="mcts-preset">Preset difficulty</label>
        <select
            bind:value={currentMctsPreset}
            onchange={() => {
                if (!currentMctsPreset) {
                    return;
                }
                mctsIterations = currentMctsPreset.iterations;
                mctsC = currentMctsPreset.c;
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
            onchange={() => (currentMctsPreset = null)}
            bind:value={mctsIterations}
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
            onchange={() => (currentMctsPreset = null)}
            bind:value={mctsC}
            type="number"
            min="0"
            step="0.1"
        />
        <small>
            Controls the balance between exploration and exploitation. Lower values (e.g. 0.5, 0.7)
            favor tested moves, higher values (e.g. 2.0, 5.0) explore more. A typical default is √2
            ≈ 1.41.
        </small>
    </div>
{/if}

<div class="board" style="--nb-col: {nbColumns}; --nb-row: {nbRows}">
    {#each rowsIndices.reverse() as row}
        {#each colsIndices as col}
            <div>
                <button
                    aria-label={'col-' + col}
                    class="outer-cell"
                    class:selected={selectedColumn === col}
                    class:winning-cell={isWinningCell(row, col)}
                    onclick={() => tryMove(col, currentPlayer)}
                    onmouseenter={() => (selectedColumn = col)}
                    onmouseleave={() => (selectedColumn = null)}
                >
                    <div
                        class="cell"
                        class:player1={board[col][row] === 1}
                        class:player2={board[col][row] === 2}
                        class:drop={board[col][row] && row === board[col].length - 1}
                        style="--drop-distance: {nbRows - row};"
                    ></div>
                </button>
            </div>
        {/each}
    {/each}
</div>

<style>
    .board {
        display: grid;
        grid-template-columns: repeat(var(--nb-col), 1fr);

        width: min(100vw, calc(80vh * (var(--nb-col) / var(--nb-row)))); /* match aspect ratio */
        height: min(80vh, calc(100vw * (var(--nb-row) / var(--nb-col)))); /* match aspect ratio */
        margin: auto; /* center horizontally */
    }
    .outer-cell,
    .outer-cell:hover {
        aspect-ratio: 1 / 1; /* keep each cell square */
        background-color: #1920fc;
        width: 100%;
        height: 100%;
        border-radius: 0;
        .cell {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: #7075f9;
        }
        .drop {
            animation: drop 500ms ease-in-out forwards;
        }
        .player1 {
            background-color: #d9ed07;
        }
        .player2 {
            background-color: #ed1207;
        }
    }
    .selected,
    .selected:hover {
        background-color: #3239fc;
    }
    .winning-cell,
    .winning-cell:hover {
        background-color: #21e07a;
    }

    @keyframes drop {
        0% {
            transform: translateY(calc(var(--drop-distance) * -100%));
        }
        80% {
            transform: translateY(0);
        }
        /* small bounce */
        90% {
            transform: translateY(-6%);
        }
        100% {
            transform: translateY(0);
        }
    }
</style>
