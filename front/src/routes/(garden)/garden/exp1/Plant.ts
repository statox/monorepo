import { Victor } from '$packages/Victor';

interface PlantCell {
    position: Victor;
    size: number;
    color: string;
}

interface Agent {
    level: number;
    levelStep: number;
    direction: Victor;
}

export class Plant {
    genes: {
        cellSpacingVariationInSegment: number;
        cellSizeVariationInSegment: number;
        nbCellsInSegment: number;
        nextSegmentBaseCellSize: number;
        angleAmplitudeGene: number;
        color: string;
    }[];
    structure: PlantCell[];

    constructor() {
        this.genes = [
            {
                cellSizeVariationInSegment: 0.95,
                cellSpacingVariationInSegment: 0.9,
                nbCellsInSegment: 4,
                nextSegmentBaseCellSize: 1.0,
                angleAmplitudeGene: 1.0,
                color: 'white'
            },
            {
                cellSizeVariationInSegment: 0.95,
                cellSpacingVariationInSegment: 0.8,
                nbCellsInSegment: 4,
                nextSegmentBaseCellSize: 1.0,
                angleAmplitudeGene: 1.0,
                color: 'red'
            },
            {
                cellSizeVariationInSegment: 0.95,
                cellSpacingVariationInSegment: 0.7,
                nbCellsInSegment: 4,
                nextSegmentBaseCellSize: 1.0,
                angleAmplitudeGene: 1.0,
                color: 'orange'
            },
            {
                cellSizeVariationInSegment: 0.95,
                cellSpacingVariationInSegment: 0.6,
                nbCellsInSegment: 4,
                nextSegmentBaseCellSize: 1.0,
                angleAmplitudeGene: 1.0,
                color: 'green'
            },
            {
                cellSizeVariationInSegment: 0.95,
                cellSpacingVariationInSegment: 0.5,
                nbCellsInSegment: 4,
                nextSegmentBaseCellSize: 1.0,
                angleAmplitudeGene: 1.0,
                color: 'yellow'
            },
            {
                cellSizeVariationInSegment: 0.95,
                cellSpacingVariationInSegment: 0.4,
                nbCellsInSegment: 4,
                nextSegmentBaseCellSize: 1.0,
                angleAmplitudeGene: 1.0,
                color: 'blue'
            }
        ];

        this.structure = [];
    }

    grow() {
        this.structure = [];

        const stack: { cell: PlantCell; agent: Agent }[] = [
            {
                cell: { position: new Victor(), size: 20, color: 'white' },
                agent: { level: 0, levelStep: 0, direction: new Victor(0, 20) }
            }
        ];

        while (stack.length) {
            const { cell, agent } = stack.pop()!;

            if (agent.level === this.genes.length) {
                continue;
            }

            const {
                cellSpacingVariationInSegment,
                nbCellsInSegment,
                color,
                cellSizeVariationInSegment,
                nextSegmentBaseCellSize,
                angleAmplitudeGene
            } = this.genes[agent.level];

            if (agent.levelStep >= nbCellsInSegment) {
                const angle = 45 * angleAmplitudeGene;
                const leftCell = {
                    position: cell.position.clone(),
                    size: cell.size * nextSegmentBaseCellSize,
                    color: 'white'
                };
                const leftAgent = {
                    level: agent.level + 1,
                    levelStep: 0,
                    direction: agent.direction.clone().rotateDeg(-angle / 2)
                };
                stack.push({
                    cell: leftCell,
                    agent: leftAgent
                });

                const rightCell = {
                    position: cell.position.clone(),
                    size: cell.size * nextSegmentBaseCellSize,
                    color: 'white'
                };
                const rightAgent = {
                    level: agent.level + 1,
                    levelStep: 0,
                    direction: agent.direction.clone().rotateDeg(angle / 2)
                };
                stack.push({
                    cell: rightCell,
                    agent: rightAgent
                });

                continue;
            }

            const nextCell = {
                ...cell,
                position: cell.position
                    .clone()
                    .add(agent.direction.clone().multiplyScalar(cellSpacingVariationInSegment)),
                size: cell.size * cellSizeVariationInSegment,
                color
            };
            const nextAgent = {
                level: agent.level,
                levelStep: agent.levelStep + 1,
                direction: agent.direction.clone()
            };

            stack.push({
                cell: nextCell,
                agent: nextAgent
            });
            this.structure.push(nextCell);
        }
    }
}
