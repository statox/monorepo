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
        isValidMove,
        cloneBoard
    } from '../gravitrips';
    import { makeMonteCarloMove, makeRandomMove, type MctsConfig, type MoveResult } from '../ai';
    import BoardComp from '../components/Board.svelte';
    import MctsSettings from '../components/MCTSSettings.svelte';
    import { pageMetadataStore } from '$lib/components/Header';
    import { goto } from '$app/navigation';

    const pageMetadata = {
        name: 'Gravitrips',
        description: '4 in a row',
        iconPath: '/gravitrips.png'
    } as const;
    pageMetadataStore.set(pageMetadata);

    let board: Board = $state(getNewBoard());
    let boardHistory: { board: Board; moveByPlayer: number }[] = $state([]);
    let boardState: BoardState = $derived(getBoardState(board));
    let winningCells: number[][] | null = $derived(getWinningCells(board));

    type PlayerStategy = 'mcts' | 'random' | 'manual';
    let player2Strategy = $state('mcts' as PlayerStategy);
    let mctsConfig: MctsConfig = $state({ iterations: 1000, c: 1.41 });

    let currentPlayer: Cell = $state(1);
    let humanPlayer: Cell = 1;
    let computerPlayer: Cell = 2;

    const resetBoard = () => {
        board = getNewBoard();
        boardHistory = [];
        currentPlayer = 1;

        // Alternate the player's number so that human alternatively
        // plays yellow then red
        [humanPlayer, computerPlayer] = [computerPlayer, humanPlayer];

        // Trigger computer move if computer must play first
        if (player2Strategy !== 'manual' && computerPlayer === currentPlayer) {
            computerMove();
        }
    };

    const addMoveToHistory = (board: Board, moveByPlayer: Cell) => {
        boardHistory.push({ board: cloneBoard(board), moveByPlayer });
        boardHistory = boardHistory;
    };

    const cancelLastMove = () => {
        if (player2Strategy === 'manual') {
            boardHistory.pop();
            changeCurrentPlayer();
        } else {
            if (
                boardHistory.length === 1 &&
                boardHistory[boardHistory.length - 1].moveByPlayer === computerPlayer
            ) {
                // Can't cancel the computer's first move
                return;
            }
            if (boardHistory[boardHistory.length - 1].moveByPlayer === computerPlayer) {
                boardHistory.pop();
            }
            if (
                boardHistory.length &&
                boardHistory[boardHistory.length - 1].moveByPlayer === humanPlayer
            ) {
                boardHistory.pop();
            }
        }
        boardHistory = boardHistory;
        if (boardHistory.length === 0) {
            board = getNewBoard();
        } else {
            // We are already adding clones to the history but if we don't clone
            // here sometimes the board component is not updated.
            board = cloneBoard(boardHistory[boardHistory.length - 1].board);
        }
    };

    const changeCurrentPlayer = () => (currentPlayer = currentPlayer === 1 ? 2 : 1);

    const humanMove = (col: number) => {
        if (humanPlayer !== currentPlayer && player2Strategy !== 'manual') {
            return;
        }
        if (!isValidMove(board, col)) {
            return;
        }
        if (getBoardState(board) !== BoardState.notOver) {
            return;
        }
        let player: Cell;
        if (humanPlayer === currentPlayer) {
            player = humanPlayer;
        } else if (computerPlayer === currentPlayer && player2Strategy === 'manual') {
            player = computerPlayer;
        } else {
            return;
        }
        board = makeMove(board, player, col);
        addMoveToHistory(board, player);
        changeCurrentPlayer();

        // We need to way a bit before triggering the new move
        // to let the previous piece drop in the grid
        if (player2Strategy !== 'manual') {
            setTimeout(() => computerMove(), 200);
        }
    };

    const computerMove = () => {
        if (computerPlayer !== currentPlayer) {
            return;
        }
        if (getBoardState(board) !== BoardState.notOver) {
            return;
        }
        if (player2Strategy === 'manual') {
            return;
        }

        let moveDone: MoveResult;
        if (player2Strategy === 'random') {
            moveDone = makeRandomMove(board, currentPlayer);
        } else if (player2Strategy === 'mcts') {
            moveDone = makeMonteCarloMove(board, currentPlayer, mctsConfig);
        } else {
            throw new Error('computer strategy not implemented');
        }

        const { board: newBoard } = moveDone;
        board = newBoard;
        addMoveToHistory(board, computerPlayer);
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

<HeadIOS
    title={pageMetadata.name}
    description={pageMetadata.description}
    iconPath={pageMetadata.iconPath}
/>
<svelte:window on:keydown={onKeyDown} />

<h3>Local game <button onclick={() => goto('/gravitrips')}>Back</button></h3>

<div class="opponent-choice">
    <label for="opponent-options">Choose your opponent:</label>
    <div class="opponent-options">
        <div>
            <button
                class:selected={player2Strategy === 'manual'}
                onclick={() => {
                    player2Strategy = 'manual';
                }}
            >
                Human
            </button>
            Play with another human on the same computer.
        </div>
        <div>
            <button
                class:selected={player2Strategy === 'random'}
                onclick={() => {
                    player2Strategy = 'random';
                    if (computerPlayer === currentPlayer) {
                        computerMove();
                    }
                }}
            >
                Random
            </button>
            The computer makes completely random moves, no intelligence at all.
        </div>
        <div>
            <button
                class:selected={player2Strategy === 'mcts'}
                onclick={() => {
                    player2Strategy = 'mcts';
                    if (computerPlayer === currentPlayer) {
                        computerMove();
                    }
                }}
            >
                MCTS
            </button>
            The computer uses a
            <a href="https://en.wikipedia.org/wiki/Monte_Carlo_tree_search">
                Monte Carlo tree search</a
            > algorithm to make smart moves. You can tweak the difficulty at the bottom of the page.
        </div>
    </div>
</div>

<div class="game-controls">
    <button onclick={resetBoard}>New game</button>
    <button onclick={cancelLastMove} disabled={boardHistory.length === 0}>Cancel move</button>
</div>

<div class="game-results">
    {#if boardState !== BoardState.notOver}
        Game Over -
        {#if boardState === BoardState.draw}
            Draw
        {:else if boardState === BoardState.winPlayer1 || boardState === BoardState.winPlayer2}
            Player {boardState} wins
        {/if}
    {/if}
</div>

<BoardComp {nbColumns} {nbRows} {board} {winningCells} onMove={humanMove} />

<div class="computer-settings">
    {#if player2Strategy === 'mcts'}
        <MctsSettings onUpdate={(newConfig: MctsConfig) => (mctsConfig = newConfig)} />
    {/if}
</div>

<style>
    .opponent-choice {
        margin: 2em;
    }
    .opponent-options {
        display: flex;
        flex-direction: column;
        gap: 1em;
    }
    .game-controls {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
    }
    .game-results {
        display: flex;
        flex-direction: row;
        justify-content: center;
    }
    .computer-settings {
        margin: 2em;
    }
</style>
