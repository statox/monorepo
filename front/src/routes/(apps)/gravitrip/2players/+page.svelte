<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { type Board, BoardState } from '../gravitrip';
    import BoardComp from '../components/Board.svelte';
    import { PUBLIC_API_URL } from '$env/static/public';

    let socket: WebSocket;
    let youAre: number | null = $state(null);
    let board: Board | null = $state(null);
    let boardState: BoardState | null = $state(null);
    let gameOverReason: string | null = $state('');
    let winningCells: number[][] | null = $state(null);

    type PageState =
        | 'connecting'
        | 'waiting_for_opponent'
        | 'playing'
        | 'game_over'
        | 'disconnected';
    let pageState: PageState = $state('connecting');

    // Note that we replace only "http" even for the "https" prod endpoint
    // because in prod we want to use wss://
    const WS_SERVER_URL = PUBLIC_API_URL.replace(/^http?/, 'ws');
    onMount(() => {
        restart();
    });

    onDestroy(() => {
        if (!socket) {
            return;
        }
        socket.close();
    });

    const restart = () => {
        socket = new WebSocket(WS_SERVER_URL + '/gravitrips/ws');
        pageState = 'connecting';
        board = null;
        boardState = null;
        winningCells = null;
        gameOverReason = null;

        socket.onopen = () => {
            pageState = 'waiting_for_opponent';
        };

        socket.onclose = (event: CloseEvent) => {
            pageState = 'game_over';
            gameOverReason = event.reason;
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'game_ready') {
                pageState = 'playing';
                youAre = data.youAre;
                board = data.board;
            } else if (data.type === 'update_board') {
                board = data.board;
                boardState = data.boardState;
                winningCells = data.winningCells;
            } else if (data.type === 'waiting_for_opponent') {
                boardState = null;
            }
        };
    };

    const tryMove = (col: number) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        const message = JSON.stringify({ move: col });
        socket.send(message);
    };
</script>

<h3>Simple WebSocket Client</h3>

{#if pageState === 'connecting'}
    <p>Connecting to the server…</p>
{/if}

{#if pageState === 'waiting_for_opponent'}
    <p>Waiting for an opponent to connect…</p>
{/if}

{#if pageState === 'playing'}
    {#if board !== null}
        <p>You are Player {youAre}</p>
        <BoardComp nbColumns={7} nbRows={6} {board} {winningCells} onMove={tryMove} />
    {:else}
        <p>Something went wrong. Board is not defined.</p>
    {/if}
{/if}

{#if pageState === 'game_over'}
    <p>Game over - {gameOverReason}</p>
    <button onclick={restart}>New game</button>
    <span style="font-weight: bold">
        {#if boardState === BoardState.draw}
            Game Over
        {:else if boardState === BoardState.winPlayer1 || boardState === BoardState.winPlayer2}
            Player {boardState} wins
        {/if}
    </span>
    {#if board !== null}
        <BoardComp nbColumns={7} nbRows={6} {board} {winningCells} onMove={tryMove} />
    {/if}
{/if}

{#if pageState === 'disconnected'}
    <p>Disconnected</p>
    <button onclick={restart}>New game</button>
{/if}
