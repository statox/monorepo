<script lang="ts">
    import type { Board } from '../gravitrips';

    interface Props {
        nbColumns: number;
        nbRows: number;
        board: Board;
        winningCells: number[][] | null;
        onMove: (column: number) => void;
    }

    let { nbColumns, nbRows, board, winningCells, onMove }: Props = $props();
    const rowsIndices = $derived(Array.from({ length: nbRows }, (_, i) => i));
    const colsIndices = $derived(Array.from({ length: nbColumns }, (_, i) => i));
    let selectedColumn: number | null = $state(null);

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

    const onKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                if (selectedColumn === null) {
                    selectedColumn = Math.floor(nbColumns / 2);
                    return;
                }
                selectedColumn = Math.min(selectedColumn + 1, nbColumns - 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (selectedColumn === null) {
                    selectedColumn = Math.floor(nbColumns / 2);
                    return;
                }
                selectedColumn = Math.max(selectedColumn - 1, 0);
                break;
            case ' ':
                e.preventDefault();
                if (selectedColumn === null) {
                    return;
                }
                onMove(selectedColumn);
                break;
        }
    };
</script>

<svelte:window onkeydown={onKeyDown} />

<div class="board" style="--nb-col: {nbColumns}; --nb-row: {nbRows}">
    {#each rowsIndices.reverse() as row}
        {#each colsIndices as col}
            <div>
                <button
                    aria-label={'col-' + col}
                    class="outer-cell"
                    class:selected={selectedColumn === col}
                    class:winning-cell={isWinningCell(row, col)}
                    onclick={() => onMove(col)}
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
