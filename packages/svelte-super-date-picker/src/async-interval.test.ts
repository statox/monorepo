import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AsyncInterval } from './async-interval.js';

describe('AsyncInterval', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('calls fn once per interval and reschedules itself', async () => {
        const fn = vi.fn().mockResolvedValue(undefined);
        new AsyncInterval(fn, 1000);

        expect(fn).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('stops rescheduling once stop() is called', async () => {
        const fn = vi.fn().mockResolvedValue(undefined);
        const interval = new AsyncInterval(fn, 1000);

        await vi.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(1);

        interval.stop();

        await vi.advanceTimersByTimeAsync(5000);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('keeps rescheduling after fn rejects', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('boom'));
        new AsyncInterval(fn, 1000);

        await vi.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1000);
        expect(fn).toHaveBeenCalledTimes(2);
    });
});
