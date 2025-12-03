<script lang="ts">
    export let href = '';
    export let title: string | undefined = undefined;
    export let text = '';
</script>

<img src={href} {title} alt={text} loading="lazy" />

<style>
    img {
        width: 70vw;
    }
</style>
