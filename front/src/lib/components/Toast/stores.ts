import { writable } from 'svelte/store';
import type { FlyParams } from 'svelte/transition';

type SvelteToastOnPopCallback = (id: number) => void;

export interface SvelteToastOptions {
    id: number; // unique id generated for every toast
    target: string; // container target name to send toast to
    msg: string; // toast message
    duration: number; // duration of progress bar tween from initial to next
    initial: number; // initial progress bar value
    next: number; // next progress bar value
    pausable: boolean; // pause progress bar tween on mouse hover
    dismissable: boolean; // allow dissmiss with close button
    reversed: boolean; // display toasts in reverse order
    intro: FlyParams; // toast intro fly animation settings
    theme: Record<string, string | number>; // css var overrides
    classes: string[]; // user-defined classes
    onpop: SvelteToastOnPopCallback; // callback that runs on toast dismiss
}

const defaults: Partial<SvelteToastOptions> = {
    duration: 4000,
    initial: 1,
    next: 0,
    pausable: false,
    dismissable: true,
    reversed: false,
    intro: { x: 256 }
};

function createToast() {
    const { subscribe, update } = writable<
        Partial<SvelteToastOptions> & { id: number; target?: string }[]
    >([]);
    const options: Record<string, Partial<SvelteToastOptions>> = {};
    let count = 0;

    function _init(target = 'default', opts = {}) {
        options[target] = opts;
        return options;
    }

    /**
     * Send a new toast
     */
    function push(msg: string, opts?: Partial<SvelteToastOptions>) {
        const param = {
            target: 'default',
            msg,
            ...opts
        };
        const conf = options[param.target] || {};
        const entry = {
            ...defaults,
            ...conf,
            ...param,
            theme: { ...conf.theme, ...param.theme },
            classes: [...(conf.classes || []), ...(param.classes || [])],
            id: ++count
        };
        update((n) => (entry.reversed ? [...n, entry] : [entry, ...n]));
        return count;
    }

    /**
     * Remove toast(s)
     * - toast.pop() // removes the last toast
     * - toast.pop(0) // remove all toasts
     * - toast.pop(id) // removes the toast with specified `id`
     * - toast.pop({ target: 'foo' }) // remove all toasts from target `foo`
     */
    function pop(id?: number | { target: string }) {
        update((n) => {
            // pop(0) or there wasn't previous toasts
            if (!n.length || id === 0) return [];

            // pop()
            if (id === undefined) {
                const lastId = Math.max(...n.map((i) => i.id));
                return n.filter((i) => i.id !== lastId);
            }

            // pop(id)
            if (typeof id === 'number') {
                return n.filter((i) => i.id !== id);
            }

            return n.filter((i) => i.target !== id.target);
        });
    }

    return { subscribe, push, pop, _init };
}

export const toast = createToast();
