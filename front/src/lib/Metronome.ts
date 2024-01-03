// Metronome code insired by
// https://github.com/grantjames/metronome/blob/master/app.js

type Note = {
    note: number;
    time: number;
};

export class Metronome {
    audioContext: AudioContext | null;
    notesInQueue: Note[] = []; // notes that have been put into the web audio and may or may not have been played yet {note, time}
    currentBeatInBar: number;
    beatsPerBar: number;
    currentSubdivision: number;
    subdivisionsInBeat: number;
    tempo: number;
    lookahead: number; // How frequently to call scheduling function (in milliseconds)
    scheduleAheadTime: number; // How far ahead to schedule audio (sec)
    nextNoteTime: number; // when the next note is due
    isRunning: boolean;
    intervalID: ReturnType<typeof setInterval> | null;

    // Functions used to update the GUI
    onBeatStart?: (beatNumber: number, subdivisionNumber: number) => void;
    onBeatEnd?: () => void;

    constructor(tempo = 80) {
        this.audioContext = null;
        this.notesInQueue = []; // notes that have been put into the web audio and may or may not have been played yet {note, time}
        this.currentBeatInBar = 0;
        this.currentSubdivision = 0;
        this.subdivisionsInBeat = 1;
        this.beatsPerBar = 4;
        this.tempo = tempo;
        this.lookahead = 25; // How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
        this.nextNoteTime = 0.0; // when the next note is due
        this.isRunning = false;
        this.intervalID = null;
    }

    nextNote() {
        // Advance current note and time by a quarter note (crotchet if you're posh)
        var secondsPerBeat = 60.0 / this.subdivisionsInBeat / this.tempo; // Notice this picks up the CURRENT tempo value to calculate beat length.
        this.nextNoteTime += secondsPerBeat; // Add beat length to last beat time

        this.currentSubdivision++;
        if (this.currentSubdivision >= this.subdivisionsInBeat) {
            this.currentBeatInBar++; // Advance the beat number, wrap to zero
            this.currentSubdivision = 0;
        }
        if (this.currentBeatInBar >= this.beatsPerBar) {
            this.currentBeatInBar = 0;
        }
    }

    scheduleNote(beatNumber: number, subdivisionNumber: number, time: number) {
        console.log('schedule note');
        if (!this.audioContext) {
            console.log('no audio context stopping scheduler');
            return;
        }

        // push the note on the queue, even if we're not playing.
        this.notesInQueue.push({ note: beatNumber, time: time });

        // create an oscillator
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        const accentedBeatFrequency = 1000;
        const beatFrequency = 400;
        const subdivisionFrequency = 200;

        if (subdivisionNumber !== 0) {
            osc.frequency.value = subdivisionFrequency;
        } else if (beatNumber % this.beatsPerBar === 0) {
            osc.frequency.value = accentedBeatFrequency;
        } else {
            osc.frequency.value = beatFrequency;
        }

        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);

        // The constantSourceNode is a hack to trigger a function when the oscillator
        // starts playing. See SO:
        // https://stackoverflow.com/a/69958258/4194289
        const constantSourceNode = this.audioContext.createConstantSource();
        console.log({ constantSourceNode });
        constantSourceNode.onended = () => {
            console.log('on constantSourceNode ended');
            this.onBeatStart && this.onBeatStart(beatNumber, subdivisionNumber);
            osc.start();
            osc.stop(time + 0.03);

            osc.onended = () => {
                this.onBeatEnd && this.onBeatEnd();
            };
        };

        constantSourceNode.start(time);
        constantSourceNode.stop(this.audioContext.currentTime + 0.0001); // stop immediately after starting
        console.log('done scheduleNote');
    }

    scheduler() {
        if (!this.audioContext) {
            console.log('no audio context, stopping scheduler');
            return;
        }

        // while there are notes that will need to play before the next interval, schedule them and advance the pointer.
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeatInBar, this.currentSubdivision, this.nextNoteTime);
            this.nextNote();
        }
    }

    start() {
        console.log('metronome start');
        if (this.isRunning) {
            console.log('already running');
            return;
        }

        if (!this.audioContext) {
            console.log('trying to create new audio context');
            // Code to try to fix iOS safari
            // https://gist.github.com/kus/3f01d60569eeadefe3a1
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        console.log('audio context ready');
        this.isRunning = true;

        this.currentBeatInBar = 0;
        this.currentSubdivision = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;

        console.log('start interval');
        this.intervalID = setInterval(() => this.scheduler(), this.lookahead);
    }

    stop() {
        this.isRunning = false;

        if (this.intervalID) {
            clearInterval(this.intervalID);
        }
    }

    startStop() {
        if (this.isRunning) {
            console.log('startstop stop');
            this.stop();
        } else {
            console.log('startstop start');
            this.start();
        }
    }
}
