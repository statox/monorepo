<script lang="ts">
    import { Notice } from '$lib/components/Notice';
    import { personalTrackerPassword } from '$lib/PersonalTracker';
    import { getAllEvents } from '$lib/PersonalTracker';
    import { getUserKey, decryptData } from '$lib/encryption';

    let password = $state('');
    let errorMessage = $state('');
    let isValidating = $state(false);

    const validateAndUnlock = async () => {
        errorMessage = '';
        isValidating = true;

        try {
            const events = await getAllEvents();

            if (events.length === 0) {
                personalTrackerPassword.setPassword(password);
                return;
            }

            const firstEvent = events[0];
            try {
                const { keyB64 } = getUserKey({ password, saltB64: firstEvent.saltB64 });
                decryptData({
                    ciphertextB64: firstEvent.ciphertextB64,
                    nonceB64: firstEvent.nonceB64,
                    keyB64
                });

                personalTrackerPassword.setPassword(password);
            } catch (decryptError) {
                errorMessage = 'Invalid password. Unable to decrypt existing events.';
            }
        } catch (error) {
            errorMessage = `Error validating password: ${(error as Error).message}`;
        } finally {
            isValidating = false;
        }
    };

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        validateAndUnlock();
    };
</script>

<div class="password-prompt-container">
    <div class="password-prompt-card">
        <h2>Enter Your Encryption Password</h2>

        <Notice
            item={{
                level: 'info',
                header: 'Important Security Notice',
                message:
                    'Your data is encrypted with your password. If you forget your password, your data cannot be recovered. Please store your password securely.'
            }}
        />

        <form onsubmit={handleSubmit}>
            <div class="input-group">
                <label for="password">Password:</label>
                <input
                    id="password"
                    type="password"
                    bind:value={password}
                    placeholder="Enter your encryption password"
                    disabled={isValidating}
                />
            </div>

            {#if errorMessage}
                <Notice item={{ level: 'error', header: 'Error', message: errorMessage }} />
            {/if}

            <button type="submit" disabled={!password || isValidating}>
                {isValidating ? 'Validating...' : 'Unlock'}
            </button>
        </form>
    </div>
</div>

<style>
    .password-prompt-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 400px;
        padding: 2rem;
    }

    .password-prompt-card {
        max-width: 500px;
        width: 100%;
        padding: 2rem;
        border: 1px solid var(--nc-bg-3);
        border-radius: 8px;
        background-color: var(--nc-bg-2);
    }

    h2 {
        margin-top: 0;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .input-group {
        margin: 1.5rem 0;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        border: 1px solid var(--nc-bg-3);
        border-radius: 4px;
        box-sizing: border-box;
    }

    input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        font-size: 1rem;
        font-weight: bold;
        margin-top: 1rem;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
</style>
