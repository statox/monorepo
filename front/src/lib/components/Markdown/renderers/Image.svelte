<script lang="ts">
    interface Props {
        href?: string;
        title?: string | undefined;
        text?: string;
    }

    let { href = '', title = undefined, text = '' }: Props = $props();
</script>

<img src={href} {title} alt={text} loading="lazy" />

<style>
    img {
        width: 70vw;
    }
</style>
