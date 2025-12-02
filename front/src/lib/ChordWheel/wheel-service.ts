import type p5 from 'p5';
import type { Wheel, Ring, Tile, WheelTiles } from './types';

/*
 * TODO: Work out the math to replace the magic numbers by accurate coefficients
 */

const modulo = (value: number, modulo: number): number => {
    if (value >= 0) {
        return value % modulo;
    }

    while (value < 0) {
        value += modulo;
    }
    return value;
};

/**
 * Draws an arc through three points by calculating the circumcircle and sampling points along it.
 * The arc goes from (x1,y1) through (x2,y2) to (x3,y3).
 */
const arcThroughThreePoints = (
    p5: p5,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
) => {
    /**
     * Calculate the circumcenter coordinates (ux, uy) using the formula:
     *
     * ux = 1/D * [ (x₁²+y₁²)(y₂-y₃) + (x₂²+y₂²)(y₃-y₁) + (x₃²+y₃²)(y₁-y₂) ]
     * uy = 1/D * [ (x₁²+y₁²)(x₃-x₂) + (x₂²+y₂²)(x₁-x₃) + (x₃²+y₃²)(x₂-x₁) ]
     *
     * where D = 2[x₁(y₂-y₃) + x₂(y₃-y₁) + x₃(y₁-y₂)]
     *
     * The circumcenter is equidistant from all three points, making it the center
     * of the unique circle passing through them.
     *
     * Derivation: This comes from solving the system of equations where the distance
     * from (ux,uy) to each of the three points is equal (the radius).
     *
     * References:
     * - https://en.wikipedia.org/wiki/Circumcircle#Cartesian_coordinates_2
     *   https://mathworld.wolfram.com/Circumcircle.html
     */
    // Calculate the denominator for the circumcenter formula
    // This is twice the signed area of the triangle formed by the three points
    // If d ≈ 0, the points are collinear (lie on the same line)
    const d = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    const ux =
        ((x1 * x1 + y1 * y1) * (y2 - y3) +
            (x2 * x2 + y2 * y2) * (y3 - y1) +
            (x3 * x3 + y3 * y3) * (y1 - y2)) /
        d;
    const uy =
        ((x1 * x1 + y1 * y1) * (x3 - x2) +
            (x2 * x2 + y2 * y2) * (x1 - x3) +
            (x3 * x3 + y3 * y3) * (x2 - x1)) /
        d;

    // Calculate radius
    const radius = p5.dist(ux, uy, x1, y1);

    // Calculate angles for each point
    const angle1 = p5.atan2(y1 - uy, x1 - ux);
    // const angle2 = p5.atan2(y2 - uy, x2 - ux);
    const angle3 = p5.atan2(y3 - uy, x3 - ux);

    // Normalize angles to ensure we take the shorter arc through p2
    const normalizeAngle = (angle: number) => {
        let a = angle;
        while (a > p5.PI) a -= p5.TWO_PI;
        while (a < -p5.PI) a += p5.TWO_PI;
        return a;
    };

    // Determine direction and draw arc
    const startAngle = angle1;
    const endAngle = angle3;

    // Sample points along the arc to create smooth bezier vertices
    const numPoints = 5;
    let currentAngle = startAngle;
    const totalAngle = normalizeAngle(endAngle - startAngle);
    const angleStep = totalAngle / numPoints;

    for (let i = 1; i <= numPoints; i++) {
        currentAngle += angleStep;
        const x = ux + radius * p5.cos(currentAngle);
        const y = uy + radius * p5.sin(currentAngle);
        p5.vertex(x, y);
    }
};

const makeTile = (
    p5: p5,
    ring: Ring,
    labelIndex: number,
    wheelPosition: number,
    scale: number
): Tile => {
    if (labelIndex < 0 || labelIndex >= ring.labels.length) {
        throw new Error(`OOB labelIndex: ${labelIndex}`);
    }
    const { cellSize, innerDiameter, outerDiameter, ratio } = ring;

    const position = p5.createVector();
    position.x = 0;
    position.y = -outerDiameter / 2;

    const cellAngle = labelIndex * cellSize * ratio;
    position.rotate(cellAngle);

    const offsetAngle = cellSize / 2;
    const vertices = [
        position.copy().rotate(-offsetAngle).setMag(innerDiameter), // Bottom left
        position.copy().rotate(-offsetAngle).setMag(outerDiameter), // Top left
        position.copy().setMag(outerDiameter), // Top middle
        position.copy().rotate(offsetAngle).setMag(outerDiameter), // Top right
        position.copy().rotate(offsetAngle).setMag(innerDiameter), // Bottom right
        position.copy().setMag(innerDiameter) // Bottom middle
    ].map((v) => v.mult(scale));
    const center = position
        .copy()
        .setMag(innerDiameter + (outerDiameter - innerDiameter) / 2)
        .mult(scale);

    const colorAngle =
        (modulo(labelIndex + wheelPosition, ring.labels.length) * 360) / ring.labels.length;

    return {
        vertices,
        center,
        label: ring.labels[labelIndex],
        color: `hsb(${colorAngle}, 50%, 80%)`,
        colorHue: colorAngle
    };
};

export const makeWheelTiles = (p5: p5, wheel: Wheel): WheelTiles => {
    const { scale } = wheel;
    const tilesInnerRing = wheel.innerRing.labels.map((_, i) =>
        makeTile(p5, wheel.innerRing, i, wheel.position, scale)
    );
    const tilesMiddleRing = wheel.middleRing.labels.map((_, i) =>
        makeTile(p5, wheel.middleRing, i, wheel.position * 2, scale)
    );
    const tilesOuterRing = wheel.outerRing.labels.map((_, i) =>
        makeTile(p5, wheel.outerRing, i, wheel.position, scale)
    );

    return {
        tilesInnerRing,
        tilesMiddleRing,
        tilesOuterRing
    };
};

export const drawTile = (p5: p5, tile: Tile, highlight?: true) => {
    if (highlight) {
        p5.strokeWeight(3);
        p5.stroke([0, 0, 0, 1]);
        p5.fill(`hsb(${tile.colorHue}, 60%, 90%)`);
    } else {
        p5.strokeWeight(2);
        p5.stroke([0, 0, 0, 0.5]);
        p5.fill(`hsb(${tile.colorHue}, 50%, 70%)`);
    }

    const [bottomLeft, topLeft, topMiddle, topRight, bottomRight, bottomMiddle] = tile.vertices;
    p5.beginShape();

    // Left side
    p5.vertex(bottomLeft.x, bottomLeft.y);
    p5.vertex(topLeft.x, topLeft.y);

    // Top arc (from topLeft through topMiddle to topRight)
    arcThroughThreePoints(
        p5,
        topLeft.x,
        topLeft.y,
        topMiddle.x,
        topMiddle.y,
        topRight.x,
        topRight.y
    );

    // Right side
    p5.vertex(bottomRight.x, bottomRight.y);

    // Bottom arc (from bottomRight through bottomMiddle to bottomLeft)
    arcThroughThreePoints(
        p5,
        bottomRight.x,
        bottomRight.y,
        bottomMiddle.x,
        bottomMiddle.y,
        bottomLeft.x,
        bottomLeft.y
    );

    p5.endShape();

    p5.noStroke();
    p5.fill(0);
    p5.textSize(13);
    if (highlight) {
        p5.textStyle(p5.BOLD);
        p5.text(tile.label, tile.center.x - p5.textWidth(tile.label) / 2, tile.center.y);
        p5.textStyle(p5.NORMAL);
    } else {
        p5.text(tile.label, tile.center.x - p5.textWidth(tile.label) / 2, tile.center.y);
    }
};

export const drawShape = (
    p5: p5,
    position: number,
    tilesInnerRing: Tile[],
    tilesMiddleRing: Tile[],
    tilesOuterRing: Tile[]
) => {
    const selectedTiles = [
        tilesInnerRing[modulo(position - 1, tilesInnerRing.length)],
        tilesInnerRing[modulo(position, tilesInnerRing.length)],
        tilesInnerRing[modulo(position + 1, tilesInnerRing.length)],

        tilesMiddleRing[modulo(2 * position - 1, tilesMiddleRing.length)],
        tilesMiddleRing[modulo(2 * position, tilesMiddleRing.length)],
        tilesMiddleRing[modulo(2 * position + 1, tilesMiddleRing.length)],

        tilesOuterRing[modulo(position, tilesOuterRing.length)]
    ];

    for (const tile of selectedTiles) {
        drawTile(p5, tile, true);
    }
};

export const drawShapeInformation = (p5: p5, position: number, wheel: Wheel) => {
    const { scale } = wheel;
    p5.textSize(10);
    p5.push();
    p5.rotate(position * ((2 * p5.PI) / 12));

    p5.fill(250);
    p5.circle(0, 0, wheel.innerRing.innerDiameter * 2 * scale);
    p5.fill(0);

    const referencePos = p5.createVector();
    referencePos.x = 0;
    referencePos.y = -wheel.innerRing.innerDiameter * scale;

    /*
     * Key marker
     */
    const arrowText = '▲';
    p5.text(arrowText, referencePos.x - p5.textWidth(arrowText) / 2, referencePos.y * 0.9);
    const keyText = 'Key';
    p5.text(keyText, referencePos.x - p5.textWidth(keyText) / 2, referencePos.y * 0.75);

    /*
     * Signature markers
     */
    const signaturePos = p5.createVector();
    const signatures = [
        '♯',
        '♯♯',
        '♯♯♯',
        '♯♯♯♯',
        '7♭/5♯',
        '6♭/6♯',
        '5♭/7♯',
        '♭♭♭♭',
        '♭♭♭',
        '♭♭',
        '♭'
    ];
    signaturePos.y = -wheel.innerRing.innerDiameter * 0.85 * scale;
    p5.push();
    for (const signature of signatures) {
        p5.rotate((2 * p5.PI) / 12);
        p5.text(signature, -p5.textWidth(signature) / 2, signaturePos.y);
    }
    p5.pop();

    /*
     * Degrees markers
     */
    // I
    const markerPos = p5.createVector();
    markerPos.y = -wheel.innerRing.innerDiameter * 1.04 * scale;
    const Itext = 'I';
    p5.text(Itext, markerPos.x - p5.textWidth(Itext) / 2, markerPos.y);

    const typePos = p5.createVector();
    typePos.y = -wheel.innerRing.outerDiameter * 0.9 * scale;
    const tItext = 'maj7,maj9';
    p5.text(tItext, typePos.x - p5.textWidth(tItext) / 2, typePos.y);

    // IV
    p5.push();
    p5.rotate(-(2 * p5.PI) / 12);
    const IVtext = 'IV';
    p5.text(IVtext, markerPos.x - p5.textWidth(IVtext) / 2, markerPos.y);
    const tIVtext = 'maj7,maj9';
    p5.text(tIVtext, typePos.x - p5.textWidth(tIVtext) / 2, typePos.y);
    p5.pop();

    // V
    p5.push();
    p5.rotate((2 * p5.PI) / 12);
    const Vtext = 'V';
    p5.text(Vtext, markerPos.x - p5.textWidth(Vtext) / 2, markerPos.y);
    const tVtext = '7,9,11,sus4,13';
    p5.text(tVtext, typePos.x - p5.textWidth(tVtext) / 2, typePos.y);
    p5.pop();

    markerPos.y = -wheel.middleRing.innerDiameter * 1.02 * scale;
    typePos.y = -wheel.middleRing.outerDiameter * 0.95 * scale;

    // III
    const IIItext = 'III';
    p5.text(IIItext, markerPos.x - p5.textWidth(IIItext) / 2, markerPos.y);
    const tIIItext = 'm7';
    p5.text(tIIItext, typePos.x - p5.textWidth(tIIItext) / 2, typePos.y);

    p5.push();
    p5.rotate(-(2 * p5.PI) / 24);
    const IItext = 'II';
    p5.text(IItext, markerPos.x - p5.textWidth(IItext) / 2, markerPos.y);
    const tIItext = 'm7,m9';
    p5.text(tIItext, typePos.x - p5.textWidth(tIItext) / 2, typePos.y);
    p5.pop();

    p5.push();
    const VItext = 'V I';
    p5.rotate((2 * p5.PI) / 24);
    p5.text(VItext, markerPos.x - p5.textWidth(VItext) / 2, markerPos.y);
    const tVItext = 'm7,m9';
    p5.text(tVItext, typePos.x - p5.textWidth(tVItext) / 2, typePos.y);
    p5.pop();

    const VIItext = 'V II°';
    markerPos.y = -wheel.outerRing.innerDiameter * 1.015 * scale;
    typePos.y = -wheel.outerRing.outerDiameter * 0.96 * scale;

    p5.text(VIItext, markerPos.x - p5.textWidth(VIItext) / 2, markerPos.y);
    const tVIItext = 'm7♭5';
    p5.text(tVIItext, typePos.x - p5.textWidth(tVIItext) / 2, typePos.y);
};

export const rotateWheel = (wheel: Wheel, clockwise: boolean) => {
    if (clockwise) {
        wheel.position--;
        wheel.innerRing.labels.unshift(wheel.innerRing.labels.pop()!);
        wheel.middleRing.labels.unshift(wheel.middleRing.labels.pop()!);
        wheel.middleRing.labels.unshift(wheel.middleRing.labels.pop()!);
        wheel.outerRing.labels.unshift(wheel.outerRing.labels.pop()!);
        return;
    }

    wheel.position++;
    wheel.innerRing.labels.push(wheel.innerRing.labels.shift()!);
    wheel.middleRing.labels.push(wheel.middleRing.labels.shift()!);
    wheel.middleRing.labels.push(wheel.middleRing.labels.shift()!);
    wheel.outerRing.labels.push(wheel.outerRing.labels.shift()!);
};
