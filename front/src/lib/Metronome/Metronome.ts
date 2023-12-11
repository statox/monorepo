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
    tempo: number;
    lookahead: number; // How frequently to call scheduling function (in milliseconds)
    scheduleAheadTime: number; // How far ahead to schedule audio (sec)
    nextNoteTime: number; // when the next note is due
    isRunning: boolean;
    intervalID: ReturnType<typeof setInterval> | null;

    // Functions used to update the GUI
    onBeatStart: (beatNumber: number) => void;
    onBeatEnd: () => void;

    constructor(tempo = 120, onNoteStart: (beatNumber: number) => void, onNoteEnd: () => void) {
        this.audioContext = null;
        this.notesInQueue = []; // notes that have been put into the web audio and may or may not have been played yet {note, time}
        this.currentBeatInBar = 0;
        this.beatsPerBar = 4;
        this.tempo = tempo;
        this.lookahead = 25; // How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)
        this.nextNoteTime = 0.0; // when the next note is due
        this.isRunning = false;
        this.intervalID = null;

        this.onBeatStart = onNoteStart;
        this.onBeatEnd = onNoteEnd;
    }

    nextNote() {
        // Advance current note and time by a quarter note (crotchet if you're posh)
        var secondsPerBeat = 60.0 / this.tempo; // Notice this picks up the CURRENT tempo value to calculate beat length.
        this.nextNoteTime += secondsPerBeat; // Add beat length to last beat time

        this.currentBeatInBar++; // Advance the beat number, wrap to zero
        if (this.currentBeatInBar == this.beatsPerBar) {
            this.currentBeatInBar = 0;
        }
    }

    scheduleNote(beatNumber: number, time: number) {
        if (!this.audioContext) {
            return;
        }

        // push the note on the queue, even if we're not playing.
        this.notesInQueue.push({ note: beatNumber, time: time });

        // create an oscillator
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        osc.frequency.value = beatNumber % this.beatsPerBar == 0 ? 1000 : 400;
        envelope.gain.value = 1;
        envelope.gain.exponentialRampToValueAtTime(1, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);

        // The constantSourceNode is a hack to trigger a function when the oscillator
        // starts playing. See SO:
        // https://stackoverflow.com/a/69958258/4194289
        const constantSourceNode = this.audioContext.createConstantSource();
        constantSourceNode.onended = () => {
            this.onBeatStart(beatNumber);
            osc.start();
            osc.stop(time + 0.03);

            osc.onended = () => {
                this.onBeatEnd();
            };
        };

        constantSourceNode.start(time);
        constantSourceNode.stop(this.audioContext.currentTime + 0.0001); // stop immediately after starting
    }

    scheduler() {
        if (!this.audioContext) {
            return;
        }

        // while there are notes that will need to play before the next interval, schedule them and advance the pointer.
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.currentBeatInBar, this.nextNoteTime);
            this.nextNote();
        }
    }

    start() {
        if (this.isRunning) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) {
            throw new Error('no audio context available');
        }
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
        }

        // Try to fix iOS safari
        // https://gist.github.com/kus/3f01d60569eeadefe3a1
        const audioContext = this.audioContext;
        const fixAudioContext = function (e) {
            if (audioContext) {
                // Create empty buffer
                const buffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                // Connect to output (speakers)
                source.connect(audioContext.destination);
                // Play sound
                if (source.start) {
                    source.start(0);
                    // } else if (source.play) {
                    //     source.play(0);
                    // } else if (source.noteOn) {
                    //     source.noteOn(0);
                }
            }
            // Remove events
            document.removeEventListener('touchstart', fixAudioContext);
            document.removeEventListener('touchend', fixAudioContext);
        };
        // iOS 6-8
        document.addEventListener('touchstart', fixAudioContext);
        // iOS 9
        document.addEventListener('touchend', fixAudioContext);

        this.isRunning = true;

        this.currentBeatInBar = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;

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
            this.stop();
        } else {
            this.start();
        }
    }
}
