<script lang="ts">
    import { onDestroy } from 'svelte';
    import { type Board, BoardState } from '../gravitrip';
    import BoardComp from '../components/Board.svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { requestAPIGet } from '$lib/api';
    import { goto } from '$app/navigation';

    let socket: WebSocket;
    let youAre: number | null = $state(null);
    let board: Board | null = $state(null);
    let boardState: BoardState | null = $state(null);
    let winningCells: number[][] | null = $state(null);

    type PageState =
        | 'initial'
        | 'connecting'
        | 'waiting_for_opponent'
        | 'playing'
        | 'game_over'
        | 'disconnected';
    let pageState: PageState = $state('initial');

    let gameId = $state('');

    const getNewGameId = async () => {
        const res = await requestAPIGet<{ gameId: string }>({ path: '/gravitrips/getNewGame' });
        gameId = res.gameId;
        startGame();
    };

    // Note that we replace only "http" even for the "https" prod endpoint
    // because in prod we want to use wss://
    const WS_SERVER_URL = PUBLIC_API_URL.replace(/^http?/, 'ws');

    onDestroy(() => {
        if (!socket) {
            return;
        }
        socket.close();
    });

    const startGame = () => {
        socket = new WebSocket(WS_SERVER_URL + '/gravitrips/ws?' + gameId);
        pageState = 'connecting';
        board = null;
        boardState = null;
        winningCells = null;

        socket.onopen = () => {
            pageState = 'waiting_for_opponent';
        };

        socket.onclose = (event: CloseEvent) => {
            console.log(event.reason);
            pageState = 'disconnected';
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
            } else if (data.type === 'game_over') {
                pageState = 'game_over';
            }
        };
    };

    const tryMove = (col: number) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        const message = JSON.stringify({ type: 'move', column: col });
        socket.send(message);
    };

    const tryRestart = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;
        const message = JSON.stringify({ type: 'restart' });
        socket.send(message);
    };
</script>

<h3>Online game <button onclick={() => goto('/gravitrip')}>Back</button></h3>

{#if ['initial', 'waiting_for_opponent', 'game_over', 'disconnected'].includes(pageState)}
    <button onclick={getNewGameId}>Start a new game</button>
    <br />
    <input bind:value={gameId} type="string" />
    <button onclick={startGame}>Join Game</button>
{/if}

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
    <p>Game over</p>
    <button onclick={tryRestart}>Restart</button>
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
{/if}
