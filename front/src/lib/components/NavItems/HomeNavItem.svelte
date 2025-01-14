<script lang="ts">
    import { goto } from '$app/navigation';
</script>

<button aria-label="home" title="Home" type="button" on:click={() => goto('/')}>
    <i class="fa fa-home" aria-hidden="true"></i>
</button>

<style>
    button {
        background: none;
        color: var(--nc-lk-1);
        padding: 0;
    }
    button:hover {
        background: none;
        color: var(--nc-lk-2);
    }
    .fa {
        font-size: 1.5em;
    }
</style>
