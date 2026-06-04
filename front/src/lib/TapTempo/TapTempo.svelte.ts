export class TapTempo {
    taps: number[] = $state([]);
    keptDuration: number = 1000 * 15;
    bpm: number = $state(0);
    lastTap: number = 0;
    groundZero: number = 0;
    counter: number = 0;
    previousTap: number = 0;

    reset() {
        this.taps = [];
        this.bpm = 0;
        this.lastTap = 0;
    }

    addBeat() {
        const now = Date.now();
        this.taps.push(Date.now());
        while (this.taps.length && this.taps[0] < now - this.keptDuration) {
            this.taps.shift();
        }

        this.computeBPM();
    }

    computeBPM() {
        const now = Date.now();

        if (this.lastTap === 0) {
            this.groundZero = now;
            this.counter = 0;
        }

        this.lastTap = now;
        const elapsed = now - this.previousTap;

        this.previousTap = this.lastTap;
        const tapDiff = this.lastTap - this.groundZero;
        if (tapDiff !== 0) {
            this.bpm = Math.round((60000 * this.counter) / tapDiff);
        }
        this.counter++;

        if (elapsed > 3000) {
            this.lastTap = 0;
        }
    }
}
