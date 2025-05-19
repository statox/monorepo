import type p5 from 'p5';

export type ColorMode = 'white' | 'gradient' | 'quantized-gradient';

export type SimulationParams = {
    gridSize: number;
    colorMode: ColorMode;
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

export const drawSimulation = (p5: p5, params: SimulationParams) => {
    const {
        gridSize,
        colorMode,
        cellSize,
        t,
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

    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const v = p5.noise(
                x * noiseFactor + t * displacementX,
                y * noiseFactor + t * displacementY,
                t * displacementZ
            );

            for (let threshold = levelsStart; threshold <= levelsEnd; threshold += levelsStep) {
                if (!equalWithMargin(v, threshold, levelsMargin)) {
                    continue;
                }

                let color = 255;
                if (colorMode === 'white') {
                    color = 255;
                } else if (colorMode === 'gradient') {
                    color = p5.map(threshold, levelsStart, levelsEnd, 100, 255);
                } else if (colorMode === 'quantized-gradient') {
                    const level = Math.trunc(v * 10) / 10;
                    color = p5.map(level, levelsStart, levelsEnd, 100, 255);
                }

                p5.fill(color);
                p5.circle(x * cellSize, y * cellSize, cellSize);
            }
        }
    }
};
