import type { Vector } from 'p5';

export type Ring = {
    labels: string[];
    cellSize: number;
    ratio: number;
    innerDiameter: number;
    outerDiameter: number;
};

export type Wheel = {
    scale: number;
    position: number;
    innerRing: Ring;
    middleRing: Ring;
    outerRing: Ring;
};

export type Tile = {
    vertices: Vector[];
    center: Vector;
    label: string;
    color: string;
    colorHue: number; // 0 -> 360
};

export type WheelTiles = {
    tilesInnerRing: Tile[];
    tilesMiddleRing: Tile[];
    tilesOuterRing: Tile[];
};
