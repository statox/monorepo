<script lang="ts">
    import _sodium from 'libsodium-wrappers-sumo';
    import { onMount } from 'svelte';
    import type { default as LibsodiumType } from 'libsodium-wrappers-sumo';

    type HistoryItem = {
        id: number;
        timestamp: Date;
        password: string;
        saltHex: string;
        nonceHex: string;
        encryptionKeyHex: string;
        message: string;
        ciphertextHex: string;
    };

    let sodium: typeof LibsodiumType | null = $state(null);
    let status = $state('Initializing...');
    let error = $state('');

    // Section 1: Password-based key derivation inputs
    let password = $state('Correct Horse Battery Staple');
    let saltHex = $state('');
    let derivedKeyHex = $state('');

    // Section 2: Encryption inputs
    let message = $state('Secret message encrypted with password-derived key!');
    let encryptionKeyHex = $state('');
    let nonceHex = $state('');
    let ciphertextHex = $state('');

    // Section 3: Decryption inputs
    let decryptionPassword = $state('');
    let decryptionSaltHex = $state('');
    let decryptionNonceHex = $state('');
    let decryptionKeyHex = $state('');
    let decryptionCiphertextHex = $state('');
    let decryptedMessage = $state('');
    let decryptionDerivedKeyHex = $state('');

    // History
    let history: HistoryItem[] = $state([]);
    let nextId = 0;

    onMount(async () => {
        try {
            await _sodium.ready;
            sodium = _sodium;

            // Generate initial salt and nonce
            const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
            saltHex = sodium.to_hex(salt);

            const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
            nonceHex = sodium.to_hex(nonce);

            status = 'Ready';
        } catch (e) {
            error = e instanceof Error ? e.message : String(e);
            status = 'Error loading library';
        }
    });

    function regenerateSalt() {
        if (!sodium) return;
        const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
        saltHex = sodium.to_hex(salt);
    }

    function regenerateNonce() {
        if (!sodium) return;
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
        nonceHex = sodium.to_hex(nonce);
    }

    function saveToHistory() {
        if (!message || !ciphertextHex || !encryptionKeyHex) {
            return;
        }

        const item: HistoryItem = {
            id: nextId++,
            timestamp: new Date(),
            password,
            saltHex,
            nonceHex,
            encryptionKeyHex,
            message,
            ciphertextHex
        };

        history = [...history, item];
    }

    function deleteHistoryItem(id: number) {
        history = history.filter((item) => item.id !== id);
    }

    function loadHistoryItem(item: HistoryItem) {
        password = item.password;
        saltHex = item.saltHex;
        nonceHex = item.nonceHex;
        encryptionKeyHex = item.encryptionKeyHex;
        message = item.message;
        // ciphertextHex will be regenerated automatically by the reactive effect
    }

    function loadToDecryption(item: HistoryItem) {
        decryptionPassword = item.password;
        decryptionSaltHex = item.saltHex;
        decryptionNonceHex = item.nonceHex;
        decryptionKeyHex = item.encryptionKeyHex;
        decryptionCiphertextHex = item.ciphertextHex;
    }

    function copyEncryptionToDecryption() {
        decryptionPassword = password;
        decryptionSaltHex = saltHex;
        decryptionNonceHex = nonceHex;
        decryptionKeyHex = encryptionKeyHex;
        decryptionCiphertextHex = ciphertextHex;
    }

    // Reactive effect: derive key from password + salt
    $effect(() => {
        if (!sodium || !password || !saltHex) {
            return;
        }

        try {
            error = '';
            const salt = sodium.from_hex(saltHex);

            const derivedKey = sodium.crypto_pwhash(
                sodium.crypto_box_SEEDBYTES,
                password,
                salt,
                sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
                sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
                sodium.crypto_pwhash_ALG_DEFAULT
            );
            derivedKeyHex = sodium.to_hex(derivedKey);
        } catch (e) {
            error = e instanceof Error ? e.message : String(e);
        }
    });

    // Reactive effect: encrypt message with encryption key + nonce
    $effect(() => {
        if (!sodium || !message || !encryptionKeyHex || !nonceHex) {
            return;
        }

        try {
            error = '';
            const encryptionKey = sodium.from_hex(encryptionKeyHex);
            const nonce = sodium.from_hex(nonceHex);

            const messageBytes = sodium.from_string(message);
            const ciphertext = sodium.crypto_secretbox_easy(messageBytes, nonce, encryptionKey);
            ciphertextHex = sodium.to_hex(ciphertext);
        } catch (e) {
            error = e instanceof Error ? e.message : String(e);
        }
    });

    // Reactive effect: derive key from decryption password + salt
    $effect(() => {
        if (!sodium || !decryptionPassword || !decryptionSaltHex) {
            decryptionDerivedKeyHex = '';
            return;
        }

        try {
            const salt = sodium.from_hex(decryptionSaltHex);

            const derivedKey = sodium.crypto_pwhash(
                sodium.crypto_box_SEEDBYTES,
                decryptionPassword,
                salt,
                sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
                sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
                sodium.crypto_pwhash_ALG_DEFAULT
            );
            decryptionDerivedKeyHex = sodium.to_hex(derivedKey);
        } catch (e) {
            decryptionDerivedKeyHex = '';
        }
    });

    // Reactive effect: decrypt ciphertext with decryption key + nonce
    $effect(() => {
        if (!sodium || !decryptionCiphertextHex || !decryptionKeyHex || !decryptionNonceHex) {
            decryptedMessage = '';
            return;
        }

        try {
            error = '';
            const decryptionKey = sodium.from_hex(decryptionKeyHex);
            const nonce = sodium.from_hex(decryptionNonceHex);
            const ciphertext = sodium.from_hex(decryptionCiphertextHex);

            const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, decryptionKey);
            decryptedMessage = sodium.to_string(decrypted);
        } catch (e) {
            decryptedMessage = '';
            error = e instanceof Error ? e.message : String(e);
        }
    });
</script>

<h2>Password-Based Encryption with Libsodium</h2>

<div>
    <p><strong>Status:</strong> {status}</p>

    {#if error}
        <p style="color: red;"><strong>Error:</strong> {error}</p>
    {/if}

    <!-- Section 1: Password-based Key Derivation -->
    <div style="margin-top: 1.5rem; padding: 1rem; border: 2px solid #4CAF50; border-radius: 4px;">
        <h3 style="margin-top: 0;">1. Key Derivation (Password + Salt → Key)</h3>

        <div style="margin: 1rem 0;">
            <label for="password-input"><strong>Password:</strong></label><br />
            <input
                id="password-input"
                type="text"
                bind:value={password}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace;"
                placeholder="Enter password"
            />
        </div>

        <div style="margin: 1rem 0;">
            <label for="salt-input"><strong>Salt (hex):</strong></label>
            <button
                onclick={regenerateSalt}
                disabled={!sodium}
                style="margin-left: 1rem; padding: 0.25rem 0.75rem; cursor: pointer;"
            >
                Regenerate
            </button>
            <br />
            <input
                id="salt-input"
                type="text"
                bind:value={saltHex}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
                placeholder="Salt (hex)"
            />
            <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                Length: {saltHex.length / 2} bytes
            </p>
        </div>

        {#if derivedKeyHex}
            <div
                style="margin: 1rem 0; padding: 0.75rem; background: var(--nc-bg-3); border-radius: 4px;"
            >
                <strong>Derived Key:</strong><br />
                <code style="word-break: break-all; font-size: 0.85em;">{derivedKeyHex}</code>
                <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                    Length: {derivedKeyHex.length / 2} bytes
                </p>
                <button
                    onclick={() => (encryptionKeyHex = derivedKeyHex)}
                    disabled={!sodium}
                    style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; cursor: pointer;"
                >
                    Use for Encryption
                </button>
                <button
                    onclick={() => (decryptionKeyHex = derivedKeyHex)}
                    disabled={!sodium}
                    style="margin-left: 0.5rem; padding: 0.25rem 0.75rem; cursor: pointer;"
                >
                    Use for Decryption
                </button>
            </div>
        {/if}
    </div>

    <!-- Section 2: Encryption -->
    <div style="margin-top: 1.5rem; padding: 1rem; border: 2px solid #2196F3; border-radius: 4px;">
        <h3 style="margin-top: 0;">2. Encryption (Message + Key + Nonce → Ciphertext)</h3>

        <div style="margin: 1rem 0;">
            <label for="message-input"><strong>Message:</strong></label><br />
            <input
                id="message-input"
                type="text"
                bind:value={message}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace;"
                placeholder="Enter message to encrypt"
            />
        </div>

        <div style="margin: 1rem 0;">
            <label for="encryption-key-input"><strong>Encryption Key (hex):</strong></label><br />
            <input
                id="encryption-key-input"
                type="text"
                bind:value={encryptionKeyHex}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
                placeholder="Enter encryption key (32 bytes / 64 hex chars)"
            />
            <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                Length: {encryptionKeyHex.length / 2} bytes
            </p>
        </div>

        <div style="margin: 1rem 0;">
            <label for="nonce-input"><strong>Nonce (hex):</strong></label>
            <button
                onclick={regenerateNonce}
                disabled={!sodium}
                style="margin-left: 1rem; padding: 0.25rem 0.75rem; cursor: pointer;"
            >
                Regenerate
            </button>
            <br />
            <input
                id="nonce-input"
                type="text"
                bind:value={nonceHex}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
                placeholder="Nonce (hex)"
            />
            <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                Length: {nonceHex.length / 2} bytes
            </p>
        </div>

        {#if ciphertextHex}
            <div
                style="margin: 1rem 0; padding: 0.75rem; background: var(--nc-bg-3); border-radius: 4px;"
            >
                <strong>Ciphertext:</strong><br />
                <code style="word-break: break-all; font-size: 0.85em;">{ciphertextHex}</code>
                <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                    Length: {ciphertextHex.length / 2} bytes (includes 16-byte MAC)
                </p>
                <button
                    onclick={saveToHistory}
                    disabled={!sodium || !message || !ciphertextHex || !encryptionKeyHex}
                    style="margin-top: 0.5rem; padding: 0.5rem 1rem; cursor: pointer; background: #2196F3; color: white; border: none; border-radius: 4px;"
                >
                    Save to History
                </button>
            </div>
        {/if}

        <!-- History -->
        {#if history.length > 0}
            <div style="margin-top: 2rem; border-top: 1px solid #ccc; padding-top: 1rem;">
                <h4>Encryption History</h4>
                {#each history as item (item.id)}
                    <div
                        style="margin: 1rem 0; padding: 0.75rem; background: var(--nc-bg-3); border: 1px solid #ddd; border-radius: 4px;"
                    >
                        <div
                            style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;"
                        >
                            <strong>
                                {item.timestamp.toLocaleString()}
                            </strong>
                            <div>
                                <button
                                    onclick={() => loadHistoryItem(item)}
                                    style="padding: 0.25rem 0.5rem; margin-right: 0.5rem; cursor: pointer;"
                                >
                                    Load to Encryption
                                </button>
                                <button
                                    onclick={() => loadToDecryption(item)}
                                    style="padding: 0.25rem 0.5rem; margin-right: 0.5rem; cursor: pointer; background: #FF9800; color: white; border: none; border-radius: 4px;"
                                >
                                    Load to Decryption
                                </button>
                                <button
                                    onclick={() => deleteHistoryItem(item.id)}
                                    style="padding: 0.25rem 0.5rem; cursor: pointer; background: #f44336; color: white; border: none; border-radius: 4px;"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                        <p style="margin: 0.25rem 0; font-size: 0.9em;">
                            <strong>Message:</strong> "{item.message}"
                        </p>
                        <p style="margin: 0.25rem 0; font-size: 0.85em; font-family: monospace;">
                            <strong>Password:</strong>
                            {item.password}
                        </p>
                        <p
                            style="margin: 0.25rem 0; font-size: 0.75em; font-family: monospace; word-break: break-all;"
                        >
                            <strong>Salt:</strong>
                            {item.saltHex}
                        </p>
                        <p
                            style="margin: 0.25rem 0; font-size: 0.75em; font-family: monospace; word-break: break-all;"
                        >
                            <strong>Nonce:</strong>
                            {item.nonceHex}
                        </p>
                        <p
                            style="margin: 0.25rem 0; font-size: 0.75em; font-family: monospace; word-break: break-all;"
                        >
                            <strong>Key:</strong>
                            {item.encryptionKeyHex}
                        </p>
                        <p
                            style="margin: 0.25rem 0; font-size: 0.75em; font-family: monospace; word-break: break-all;"
                        >
                            <strong>Ciphertext:</strong>
                            {item.ciphertextHex}
                        </p>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Section 3: Decryption -->
    <div style="margin-top: 1.5rem; padding: 1rem; border: 2px solid #FF9800; border-radius: 4px;">
        <h3 style="margin-top: 0;">3. Decryption (Ciphertext + Key + Nonce → Message)</h3>

        <button
            onclick={copyEncryptionToDecryption}
            disabled={!sodium || !ciphertextHex}
            style="margin-bottom: 1rem; padding: 0.5rem 1rem; cursor: pointer;"
        >
            Copy from Encryption Section
        </button>

        <div style="margin: 1rem 0;">
            <label for="decryption-password-input"><strong>Password (optional):</strong></label><br
            />
            <input
                id="decryption-password-input"
                type="text"
                bind:value={decryptionPassword}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace;"
                placeholder="Enter password to derive key"
            />
        </div>

        <div style="margin: 1rem 0;">
            <label for="decryption-salt-input"><strong>Salt (hex):</strong></label><br />
            <input
                id="decryption-salt-input"
                type="text"
                bind:value={decryptionSaltHex}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
                placeholder="Salt (hex)"
            />
            <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                Length: {decryptionSaltHex.length / 2} bytes
            </p>
        </div>

        {#if decryptionDerivedKeyHex}
            <div
                style="margin: 1rem 0; padding: 0.75rem; background: var(--nc-bg-3); border-radius: 4px;"
            >
                <strong>Derived Key (from password + salt):</strong><br />
                <code style="word-break: break-all; font-size: 0.85em;"
                    >{decryptionDerivedKeyHex}</code
                >
                <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                    Length: {decryptionDerivedKeyHex.length / 2} bytes
                </p>
                <button
                    onclick={() => (decryptionKeyHex = decryptionDerivedKeyHex)}
                    disabled={!sodium}
                    style="margin-top: 0.5rem; padding: 0.25rem 0.75rem; cursor: pointer;"
                >
                    Use as Decryption Key
                </button>
            </div>
        {/if}

        <div style="margin: 1rem 0;">
            <label for="decryption-key-input"><strong>Decryption Key (hex):</strong></label><br />
            <input
                id="decryption-key-input"
                type="text"
                bind:value={decryptionKeyHex}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
                placeholder="Enter decryption key (32 bytes / 64 hex chars)"
            />
            <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                Length: {decryptionKeyHex.length / 2} bytes
            </p>
        </div>

        <div style="margin: 1rem 0;">
            <label for="decryption-nonce-input"><strong>Nonce (hex):</strong></label><br />
            <input
                id="decryption-nonce-input"
                type="text"
                bind:value={decryptionNonceHex}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
                placeholder="Nonce (hex)"
            />
            <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                Length: {decryptionNonceHex.length / 2} bytes
            </p>
        </div>

        <div style="margin: 1rem 0;">
            <label for="decryption-ciphertext-input"><strong>Ciphertext (hex):</strong></label><br
            />
            <input
                id="decryption-ciphertext-input"
                type="text"
                bind:value={decryptionCiphertextHex}
                style="width: 100%; max-width: 600px; padding: 0.5rem; margin-top: 0.25rem; font-family: monospace; font-size: 0.85em;"
                placeholder="Ciphertext (hex)"
            />
            <p style="font-size: 0.85em; color: #666; margin-top: 0.25rem;">
                Length: {decryptionCiphertextHex.length / 2} bytes
            </p>
        </div>

        {#if decryptedMessage}
            <div
                style="margin: 1rem 0; padding: 0.75rem; background: var(--nc-bg-3); border-radius: 4px;"
            >
                <strong>Decrypted Message:</strong><br />
                <span style="font-family: monospace; font-size: 1.1em;">"{decryptedMessage}"</span>
                <p style="font-size: 0.85em; color: #666; margin-top: 0.5rem;">
                    {decryptedMessage === message
                        ? '✓ Matches encryption message!'
                        : '⚠ Different from encryption message'}
                </p>
            </div>
        {:else if decryptionKeyHex && decryptionCiphertextHex && decryptionNonceHex}
            <p style="color: #999; font-style: italic;">
                Decryption failed - check key, nonce, or ciphertext
            </p>
        {/if}
    </div>
</div>
