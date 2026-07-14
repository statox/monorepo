export class AsyncInterval {
    private timeoutId: ReturnType<typeof setTimeout> | null = null;
    private isStopped = false;

    constructor(fn: () => Promise<void> | void, refreshInterval: number) {
        this.scheduleNext(fn, refreshInterval);
    }

    private scheduleNext = (fn: () => Promise<void> | void, milliseconds: number) => {
        if (this.isStopped) return;
        this.timeoutId = setTimeout(async () => {
            try {
                await fn();
            } catch {
                // Swallow errors from fn so a rejected/thrown call doesn't
                // stop future reschedules.
            }
            this.scheduleNext(fn, milliseconds);
        }, milliseconds);
    };

    stop = () => {
        this.isStopped = true;
        if (this.timeoutId !== null) {
            clearTimeout(this.timeoutId);
        }
    };
}
