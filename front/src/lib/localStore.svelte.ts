/*
 * Helper to bind a svelte $state to the local storage.
 * Inspired from https://www.reddit.com/r/sveltejs/comments/1d43d8p/svelte_5_runes_with_localstorage_thanks_to_joy_of/
 *
 * Usage (In svelte component)
 *
 * // Initialization
 * let myReactiveProperty = localStore('localStorageKey', initialValue);
 *
 * // Read
 * console.log(myReactiveProperty.value);
 *
 * // Update
 * myReactiveProperty.value = 10;
 *
 */

import { browser } from '$app/environment';

export class LocalStore<T> {
    default: T;
    value = $state<T>() as T;
    key = '';

    constructor(key: string, value: T) {
        this.key = key;
        this.value = value;
        this.default = value;

        if (browser) {
            const item = localStorage.getItem(key);
            if (item) this.value = this.deserialize(item);
        }

        $effect(() => {
            localStorage.setItem(this.key, this.serialize(this.value));
        });
    }

    reset() {
        localStorage.removeItem(this.key);
        this.value = this.default;
    }

    serialize(value: T): string {
        return JSON.stringify(value);
    }

    deserialize(item: string): T {
        return JSON.parse(item);
    }
}

export function localStore<T>(key: string, value: T) {
    return new LocalStore(key, value);
}
