<script lang="ts">
    import { Notice, type NoticeItem } from '$lib/components/Notice';

    interface Props {
        value?: number;
    }

    let { value = $bindable(5) }: Props = $props();
    let noticeMessages: NoticeItem[] = $state([]);
</script>

<div>
    <h4>Mood</h4>

    {#each noticeMessages as item}
        <Notice {item} />
    {/each}

    <div class="options-container">
        {#each [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as mood}
            <button class:selected={value === mood} onclick={() => (value = mood)}>{mood}</button>
        {/each}
    </div>
</div>

<style>
    .options-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;

        gap: 10px;

        margin: 1em;
    }
</style>
