export class TapTempo {
    taps: number[];
    keptDuration: number;
    bpm: number;
    lastTap: number;
    groundZero: number;
    counter: number;
    previousTap: number;

    constructor() {
        this.taps = [];
        this.keptDuration = 1000 * 15;
        this.bpm = 0;
        this.lastTap = 0;
        this.groundZero = 0;
        this.counter = 0;
        this.previousTap = 0;
    }

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
