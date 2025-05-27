import type p5 from 'p5';

export type ColorMode =
    | 'white'
    | 'gradient'
    | 'quantized-gradient'
    | 'color-gradient'
    | 'color-scaled-gradient';

export type NoiseMode = 'carthesian' | 'polar';

export type SimulationParams = {
    gridSize: number;
    colorMode: ColorMode;
    noiseMode: NoiseMode;
    cellSize: number;
    t: number;
    noiseFactor: number;
    displacementX: number;
    displacementY: number;
    displacementZ: number;
    levelsStart: number;
    levelsEnd: number;
    levelsMargin: number;
    levelsStep: number;
};

const equalWithMargin = (value: number, target: number, margin: number) => {
    return target - margin <= value && value <= target + margin;
};

function toPolarCoordinates(x: number, y: number): { r: number; theta: number } {
    const r = Math.sqrt(x * x + y * y); // Radius
    const theta = Math.atan2(y, x); // Angle in radians
    return { r, theta };
}

export const drawSimulation = (p5: p5, params: SimulationParams) => {
    const {
        gridSize,
        colorMode,
        cellSize,
        t,
        noiseMode,
        noiseFactor,
        displacementX,
        displacementY,
        displacementZ,
        levelsStart,
        levelsEnd,
        levelsStep,
        levelsMargin
    } = params;
    p5.background(0);

    const colorHigh = p5.color(255, 0, 0);
    const colorLow = p5.color(0, 255, 0);

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            let v = 0;
            if (noiseMode === 'carthesian') {
                v = p5.noise(
                    x * noiseFactor + t * displacementX,
                    y * noiseFactor + t * displacementY,
                    t * displacementZ
                );
            } else if (noiseMode === 'polar') {
                const { r, theta } = toPolarCoordinates(
                    (x - gridSize / 2) * noiseFactor,
                    (y - gridSize / 2) * noiseFactor
                );
                v = p5.noise(theta * displacementX, r * displacementY, t * displacementZ);
            }

            for (
                let threshold = levelsStart;
                threshold <= levelsEnd;
                threshold += levelsStep || 0.1
            ) {
                if (!equalWithMargin(v, threshold, levelsMargin)) {
                    continue;
                }

                let color: p5.Color | number = 255;
                if (colorMode === 'white') {
                    color = 255;
                } else if (colorMode === 'gradient') {
                    color = p5.map(threshold, levelsStart, levelsEnd, 100, 255);
                } else if (colorMode === 'quantized-gradient') {
                    const level = Math.trunc(v * 10) / 10;
                    color = p5.map(level, levelsStart, levelsEnd, 100, 255);
                } else if (colorMode === 'color-gradient') {
                    color = p5.lerpColor(colorHigh, colorLow, v);
                } else if (colorMode === 'color-scaled-gradient') {
                    const scaledLevel = p5.map(v, levelsStart, levelsEnd, 0, 1);
                    color = p5.lerpColor(colorHigh, colorLow, scaledLevel);
                }

                p5.fill(color as p5.Color);
                p5.circle(x * cellSize, y * cellSize, cellSize);
            }
        }
    }
};
