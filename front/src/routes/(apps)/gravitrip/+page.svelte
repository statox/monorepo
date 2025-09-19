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
    import { makeRandomMove } from './ai';

    let board: Board = $state(Array.from({ length: 7 }, () => []));
    let boardState: BoardState = $derived(getBoardState(board));
    let winningCells: number[][] | null = $derived(getWinningCells(board));

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

        setTimeout(() => computerMove(), 300);
    };

    const computerMove = () => {
        if (currentPlayer !== 2) {
            return;
        }
        if (getBoardState(board) !== BoardState.notOver) {
            return;
        }
        board = makeRandomMove(board, currentPlayer);
        currentPlayer = currentPlayer === 1 ? 2 : 1;
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

<div class="board" style="--nb-col: {nbColumns}; --nb-row: {nbRows}">
    {#each rowsIndices.reverse() as row}
        {#each colsIndices as col}
            <div>
                <button
                    aria-label={'col-' + col}
                    class="outer-cell"
                    class:winning-cell={isWinningCell(row, col)}
                    onclick={() => tryMove(col, currentPlayer)}
                >
                    <div
                        class="cell"
                        class:player1={board[col][row] === 1}
                        class:player2={board[col][row] === 2}
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
    .outer-cell {
        aspect-ratio: 1 / 1; /* keep each cell square */
        background-color: #1920fc;
        width: 100%;
        height: 100%;
        .cell {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: #7075f9;
        }
        .player1 {
            background-color: #d9ed07;
        }
        .player2 {
            background-color: #ed1207;
        }
    }
    .winning-cell {
        background-color: #21e07a;
    }
</style>
