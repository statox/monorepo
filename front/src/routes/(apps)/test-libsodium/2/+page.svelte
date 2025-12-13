<script lang="ts">
    import { decryptData, encryptData, getUserKey, getRandomSalt } from '$lib/encryption';

    // Section 1: Password-based key derivation inputs
    let password = $state('Correct Horse Battery Staple');
    let saltB64 = $state(getRandomSalt().saltB64);

    // Section 2: Encryption inputs
    let message = $state('Secret message encrypted with password-derived key!');
    let { keyB64 } = getUserKey({ password, saltB64 });

    let encrypted = encryptData({ data: message, keyB64 });
    let decrypted = decryptData({
        ciphertextB64: encrypted.ciphertextB64,
        nonceB64: encrypted.nonceB64,
        keyB64
    });
</script>

<h2>Password-Based Encryption with Libsodium</h2>

<div>
    <div>
        <label for="password-input"><strong>Password:</strong></label><br />
        <input
            id="password-input"
            type="text"
            bind:value={password}
            style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace;"
        />
    </div>

    <div>
        <label for="salt-input"><strong>Salt:</strong></label>
        <input
            id="salt-input"
            type="text"
            bind:value={saltB64}
            style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
        />
    </div>

    {#if keyB64}
        <div
            style="margin: 1rem 0; padding: 0.75rem; background: var(--nc-bg-3); border-radius: 4px;"
        >
            <strong>Key:</strong><br />
            <code style="word-break: break-all; font-size: 0.85em;">{keyB64}</code>
        </div>
    {/if}

    <div>
        <label for="data-input"><strong>Data:</strong></label>
        <input
            id="data-input"
            type="text"
            bind:value={message}
            style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
        />
    </div>

    <div>
        <h3>Encryption</h3>

        <div>
            <label for="cipher-input"><strong>Ciphertext:</strong></label>
            <input
                id="cipher-input"
                type="text"
                bind:value={encrypted.ciphertextB64}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
            />
        </div>

        <div>
            <label for="nonce-input"><strong>Nonce:</strong></label>
            <input
                id="nonce-input"
                type="text"
                bind:value={encrypted.nonceB64}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
            />
        </div>
    </div>

    <div>
        <span>Data - {atob(decrypted.dataB64)}</span>
    </div>
</div>
