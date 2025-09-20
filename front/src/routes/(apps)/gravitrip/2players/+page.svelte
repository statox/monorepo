<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { type Board, BoardState } from '../gravitrip';
    import BoardComp from '../components/Board.svelte';
    import { PUBLIC_API_URL } from '$env/static/public';

    let socket: WebSocket;
    let connected = $state(false);
    let gameReady = $state(false);
    let youAre: number | null = $state(null);
    let board: Board | null = $state(null);
    let boardState: BoardState | null = $state(null);
    let gameOver = $state(false);
    let gameOverReason: string | null = $state('');

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
        socket = new WebSocket(WS_SERVER_URL);
        board = null;

        socket.onopen = () => {
            connected = true;
            gameOver = false;
            gameOverReason = null;
        };

        socket.onclose = (event: CloseEvent) => {
            connected = false;
            gameOver = true;
            gameReady = false;
            gameOverReason = event.reason;
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'game_ready') {
                gameReady = true;
                youAre = data.youAre;
                board = data.board;
            } else if (data.type === 'update_board') {
                board = data.board;
                boardState = data.boardState;
            } else if (data.type === 'waiting_for_opponent') {
                gameReady = false;
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

{#if gameOver}
    <p>Game over - {gameOverReason}</p>
    <button onclick={restart}>New game</button>
{:else if !connected}
    <p>Connecting…</p>
{:else if !gameReady}
    <p>Waiting for another player…</p>
{:else}
    <p>Game started! You are Player {youAre}</p>
{/if}

<span style="font-weight: bold">
    {#if boardState === BoardState.draw}
        Game Over
    {:else if boardState === BoardState.winPlayer1 || boardState === BoardState.winPlayer2}
        Player {boardState} wins
    {/if}
</span>

{#if board !== null}
    <BoardComp nbColumns={7} nbRows={6} {board} winningCells={null} onMove={tryMove} />
{/if}
