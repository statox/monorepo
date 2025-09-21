<script lang="ts">
    import { HeadIOS } from '$lib/components/HeadIOS';
    import {
        type Board,
        type Cell,
        BoardState,
        getBoardState,
        getNewBoard,
        getWinningCells,
        nbRows,
        nbColumns,
        makeMove,
        isValidMove
    } from './gravitrip';
    import { makeMonteCarloMove, makeRandomMove, type MctsConfig, type MoveResult } from './ai';
    import BoardComp from './components/Board.svelte';
    import MctsSettings from './components/MCTSSettings.svelte';
    import { pageNameStore } from '$lib/components/Header';

    pageNameStore.set('Gravitrip');

    let board: Board = $state(getNewBoard());
    let boardState: BoardState = $derived(getBoardState(board));
    let winningCells: number[][] | null = $derived(getWinningCells(board));
    let selectedColumn: number | null = $state(null);

    type ComputerStategy = 'mcts' | 'random';
    let computerStategy = $state('mcts' as ComputerStategy);
    let mctsConfig: MctsConfig = $state({ iterations: 1000, c: 1.41 });

    let currentPlayer: Cell = $state(1);

    const resetBoard = () => {
        board = getNewBoard();
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
            moveDone = makeMonteCarloMove(board, currentPlayer, mctsConfig);
        } else {
            throw new Error('computer strategy not implemented');
        }

        const { board: newBoard, move } = moveDone;
        board = newBoard;
        selectedColumn = move;
        currentPlayer = 1;
    };

    const onKeyDown = (e: KeyboardEvent) => {
        switch (e.keyCode) {
            case 82: // r
                resetBoard();
                break;
            case 39: // right
                if (selectedColumn === null) {
                    selectedColumn = Math.floor(nbColumns / 2);
                    return;
                }
                selectedColumn = Math.min(selectedColumn + 1, nbColumns - 1);
                break;
            case 37: // left
                if (selectedColumn === null) {
                    selectedColumn = Math.floor(nbColumns / 2);
                    return;
                }
                selectedColumn = Math.max(selectedColumn - 1, 0);
                break;
            case 32: // space
                if (selectedColumn === null) {
                    return;
                }
                tryMove(selectedColumn, currentPlayer);
                break;
        }
    };
</script>

<HeadIOS title="Gravitrip" description="Gravitrip" />
<svelte:window on:keydown={onKeyDown} />

<div class="main">
    <h3>Gravitrip</h3>
</div>

<div>
    See <a
        href="https://www.quora.com/What-is-the-winning-strategy-for-the-first-player-in-Connect-Four-games"
        >this quora thread</a
    > for some tips on the winning strategy
</div>

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
    <MctsSettings onUpdate={(newConfig: MctsConfig) => (mctsConfig = newConfig)} />
{/if}

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

<BoardComp
    {nbColumns}
    {nbRows}
    {board}
    {winningCells}
    onMove={(col: number) => tryMove(col, currentPlayer)}
/>
