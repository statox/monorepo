<script lang="ts">
    import { toast } from '$lib/components/Toast';

    function showBasicToast() {
        toast.push('Basic toast message');
    }

    function showLongToast() {
        toast.push('This toast will stay visible for 8 seconds', { duration: 8000 });
    }

    function showShortToast() {
        toast.push('Quick message!', { duration: 2000 });
    }

    function showInfoToast() {
        toast.push('This is an informational toast', {
            classes: ['toast-info'],
            theme: {
                '--toastBackground': 'var(--nc-info)',
                '--toastColor': 'var(--nc-white)',
                '--toastBarBackground': 'var(--nc-white)'
            }
        });
    }

    function showSuccessToast() {
        toast.push('Success! Operation completed', {
            classes: ['toast-success'],
            theme: {
                '--toastBackground': 'var(--nc-success)',
                '--toastColor': 'var(--nc-white)',
                '--toastBarBackground': 'var(--nc-white)'
            }
        });
    }

    function showErrorToast() {
        toast.push('Error: Something went wrong', {
            classes: ['toast-error'],
            theme: {
                '--toastBackground': 'var(--nc-error)',
                '--toastColor': 'var(--nc-white)',
                '--toastBarBackground': 'var(--nc-white)'
            }
        });
    }

    function showAccentToast() {
        toast.push('Special action available!', {
            classes: ['toast-accent'],
            theme: {
                '--toastBackground': 'var(--nc-ac-1)',
                '--toastColor': 'var(--nc-ac-tx)',
                '--toastBarBackground': 'var(--nc-ac-tx)'
            }
        });
    }

    function showNonDismissableToast() {
        toast.push('This toast cannot be dismissed manually', {
            dismissable: false,
            duration: 5000
        });
    }

    function showPausableToast() {
        toast.push('Hover over this toast to pause the timer', {
            pausable: true,
            duration: 6000
        });
    }

    function showCustomPositionToast() {
        toast.push('Custom animation from bottom', {
            intro: { y: 200 },
            duration: 4000
        });
    }

    function clearAllToasts() {
        toast.pop(0);
    }
</script>

<section>
    <h2>Toasts</h2>
    <p class="section-intro">
        Click the buttons below to trigger various toast notifications. Toasts appear in the
        top-right corner by default.
    </p>

    <div class="toast-controls">
        <div class="control-group">
            <h3>Basic Toasts</h3>
            <div class="button-grid">
                <button onclick={showBasicToast}>Basic Toast</button>
                <button onclick={showLongToast}>Long Duration (8s)</button>
                <button onclick={showShortToast}>Short Duration (2s)</button>
            </div>
        </div>

        <div class="control-group">
            <h3>Semantic Toasts</h3>
            <div class="button-grid">
                <button class="btn-info" onclick={showInfoToast}>Info Toast</button>
                <button class="btn-success" onclick={showSuccessToast}>Success Toast</button>
                <button class="btn-error" onclick={showErrorToast}>Error Toast</button>
                <button class="btn-accent" onclick={showAccentToast}>Accent Toast</button>
            </div>
        </div>

        <div class="control-group">
            <h3>Special Behaviors</h3>
            <div class="button-grid">
                <button onclick={showNonDismissableToast}>Non-Dismissable</button>
                <button onclick={showPausableToast}>Pausable on Hover</button>
                <button onclick={showCustomPositionToast}>Custom Animation</button>
            </div>
        </div>

        <div class="control-group">
            <h3>Control</h3>
            <button class="btn-clear" onclick={clearAllToasts}>Clear All Toasts</button>
        </div>
    </div>
</section>

<style>
    section {
        margin-bottom: 3rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--nc-bg-3);
    }

    section:last-child {
        border-bottom: none;
    }

    .section-intro {
        color: var(--nc-tx-2);
        margin-bottom: 1.5rem;
    }

    .toast-controls {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .control-group {
        background-color: var(--nc-bg-2);
        padding: 1.5rem;
        border-radius: 4px;
    }

    .button-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 0.75rem;
    }

    .btn-info {
        background-color: var(--nc-info);
        color: var(--nc-white);
        border-color: var(--nc-info);
    }

    .btn-info:hover {
        opacity: 0.9;
    }

    .btn-success {
        background-color: var(--nc-success);
        color: var(--nc-white);
        border-color: var(--nc-success);
    }

    .btn-success:hover {
        opacity: 0.9;
    }

    .btn-error {
        background-color: var(--nc-error);
        color: var(--nc-white);
        border-color: var(--nc-error);
    }

    .btn-error:hover {
        opacity: 0.9;
    }

    .btn-accent {
        background-color: var(--nc-ac-1);
        color: var(--nc-ac-tx);
        border-color: var(--nc-ac-1);
    }

    .btn-accent:hover {
        opacity: 0.9;
    }

    .btn-clear {
        background-color: var(--nc-bg-1);
        border: 2px solid var(--nc-error);
        color: var(--nc-error);
    }

    .btn-clear:hover {
        background-color: var(--nc-error);
        color: var(--nc-white);
    }
</style>
