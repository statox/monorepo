<script lang="ts">
    import Notice from '$lib/components/Notice/Main.svelte';
    import type { NoticeItem } from '$lib/components/Notice/types';

    const notices: NoticeItem[] = [
        { level: 'info', header: 'Info Notice', message: 'This is an informational message.' },
        {
            level: 'success',
            header: 'Success Notice',
            message: 'Operation completed successfully!'
        },
        { level: 'error', header: 'Error Notice', message: 'Something went wrong.' }
    ];
</script>

<section>
    <h2>Semantic States</h2>
    <div class="semantic-examples">
        <h3>Notice Components</h3>
        {#each notices as notice}
            <Notice item={notice} />
        {/each}

        <h3>Contextual Colors</h3>
        <div class="state-examples">
            <div class="state-box success">
                <strong>Success State</strong>
                <p>Operation completed successfully. All systems operational.</p>
            </div>

            <div class="state-box info">
                <strong>Info State</strong>
                <p>Here is some helpful information you should know about.</p>
            </div>

            <div class="state-box error">
                <strong>Error State</strong>
                <p>An error occurred. Please check your input and try again.</p>
            </div>
        </div>

        <h3>Accent Colors</h3>
        <div class="accent-examples">
            <button class="accent-button">Accent Button</button>
            <span class="accent-badge">New</span>
            <div class="accent-highlight">Highlighted content using accent color</div>
        </div>
    </div>
</section>

<style>
    section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    .state-examples {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        margin-top: 1rem;
    }

    .state-box {
        padding: 1rem;
        border-radius: 4px;
        border-left: 4px solid;
        background-color: var(--nc-bg-2);
    }

    .state-box.success {
        border-left-color: var(--nc-success);
    }

    .state-box.info {
        border-left-color: var(--nc-info);
    }

    .state-box.error {
        border-left-color: var(--nc-error);
    }

    .state-box strong {
        display: block;
        margin-bottom: 0.5rem;
        color: var(--nc-tx-1);
    }

    .state-box p {
        margin: 0;
        color: var(--nc-tx-2);
    }

    .accent-examples {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
        margin-top: 1rem;
    }

    .accent-button {
        background-color: var(--nc-ac-1);
        color: var(--nc-ac-tx);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
    }

    .accent-button:hover {
        opacity: 0.9;
    }

    .accent-badge {
        background-color: var(--nc-ac-1);
        color: var(--nc-ac-tx);
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.85rem;
        font-weight: 600;
    }

    .accent-highlight {
        background-color: rgba(var(--nc-error-rgb), 0.1);
        border-left: 3px solid var(--nc-ac-1);
        padding: 1rem;
        border-radius: 4px;
        color: var(--nc-tx-2);
    }
</style>
