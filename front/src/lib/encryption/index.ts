import _sodium from 'libsodium-wrappers-sumo';
import type { default as LibsodiumType } from 'libsodium-wrappers-sumo';

let sodium: typeof LibsodiumType | null = null;

export const getRandomSalt = () => {
    if (!sodium) {
        throw new Error("Sodium isn't ready");
    }
    const salt = sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES);
    return { saltB64: sodium.to_base64(salt) };
};

export const getUserKey = (params: { password: string; saltB64: string }) => {
    if (!sodium) {
        throw new Error("Sodium isn't ready");
    }

    const { password, saltB64 } = params;

    try {
        const salt = sodium.from_base64(saltB64);

        const derivedKey = sodium.crypto_pwhash(
            sodium.crypto_box_SEEDBYTES,
            password,
            salt,
            sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
            sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
            sodium.crypto_pwhash_ALG_DEFAULT
        );

        return { keyB64: sodium.to_base64(derivedKey) };
    } catch (e) {
        console.log('Error while deriving key');
        console.error(e);
        throw e;
    }
};

export const encryptData = (params: { data: string; keyB64: string }) => {
    if (!sodium) {
        throw new Error("Sodium isn't ready");
    }

    const { data, keyB64 } = params;

    try {
        const encryptionKey = sodium.from_base64(keyB64);
        // Nonces must not be reused in two different messages so we generate the
        // nonce here for each message. It can then be stored next to the data, it's not secret.
        const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
        const nonceB64 = sodium.to_base64(nonce);

        const messageBytes = sodium.from_string(data);
        const ciphertext = sodium.crypto_secretbox_easy(messageBytes, nonce, encryptionKey);
        const ciphertextB64 = sodium.to_base64(ciphertext);

        return { ciphertextB64, nonceB64 };
    } catch (e) {
        console.log('Error while encrypting data');
        console.error(e);
        throw e;
    }
};

export const decryptData = (params: {
    ciphertextB64: string;
    nonceB64: string;
    keyB64: string;
}) => {
    if (!sodium) {
        throw new Error("Sodium isn't ready");
    }

    const { ciphertextB64, nonceB64, keyB64 } = params;
    console.log('in decryptData', params);

    try {
        const decryptionKey = sodium.from_base64(keyB64);
        const nonce = sodium.from_base64(nonceB64);
        const ciphertext = sodium.from_base64(ciphertextB64);

        const decrypted = sodium.crypto_secretbox_open_easy(ciphertext, nonce, decryptionKey);

        return { dataB64: sodium.to_base64(decrypted) };
    } catch (e) {
        console.log('Error while decrypting data');
        console.error(e);
        throw e;
    }
};

(async () => {
    try {
        await _sodium.ready;
        sodium = _sodium;
    } catch (e) {
        console.log("Couldn't initialize sodium. Panic.");
        throw e;
    }
})();
