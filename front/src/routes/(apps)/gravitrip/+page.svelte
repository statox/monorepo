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

    type ComputerStategy = 'mcts' | 'random';
    let computerStategy = $state('mcts' as ComputerStategy);
    let mctsConfig: MctsConfig = $state({ iterations: 1000, c: 1.41 });

    let currentPlayer: Cell = $state(1);
    let humanPlayer: Cell = 1;
    let computerPlayer: Cell = 2;

    const resetBoard = () => {
        board = getNewBoard();
        currentPlayer = 1;

        // Alternate the player's number so that human alternatively
        // plays yellow then red
        [humanPlayer, computerPlayer] = [computerPlayer, humanPlayer];

        // Trigger computer move if computer must play first
        if (computerPlayer === currentPlayer) {
            computerMove();
        }
    };

    const changeCurrentPlayer = () => (currentPlayer = currentPlayer === 1 ? 2 : 1);
    const humanMove = (col: number) => {
        if (humanPlayer !== currentPlayer) {
            return;
        }
        if (!isValidMove(board, col)) {
            return;
        }
        if (getBoardState(board) !== BoardState.notOver) {
            return;
        }
        board = makeMove(board, humanPlayer, col);
        changeCurrentPlayer();

        // We need to way a bit before triggering the new move
        // to let the previous piece drop in the grid
        setTimeout(() => computerMove(), 200);
    };

    const computerMove = () => {
        if (computerPlayer !== currentPlayer) {
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

        const { board: newBoard } = moveDone;
        board = newBoard;
        changeCurrentPlayer();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'r':
                resetBoard();
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

<BoardComp {nbColumns} {nbRows} {board} {winningCells} onMove={humanMove} />
