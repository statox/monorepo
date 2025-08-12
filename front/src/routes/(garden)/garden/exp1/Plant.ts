import { Victor } from '@statox/vector';
import { map } from './utils';
import { defaultGenes, type PlantGene } from './Genes';

interface PlantCell {
    position: Victor;
    size: number;
    color: number[];
}

interface Agent {
    level: number;
    levelStep: number;
    direction: Victor;
}

export class Plant {
    genes: PlantGene[];
    structure: PlantCell[];

    constructor() {
        this.genes = defaultGenes;

        this.structure = [];
    }

    grow() {
        this.structure = [];

        const stack: { cell: PlantCell; agent: Agent }[] = [
            {
                cell: { position: new Victor(), size: 20, color: [200, 200, 200, 200]},
                agent: { level: 0, levelStep: 0, direction: new Victor(0, 20) }
            }
        ];

        while (stack.length) {
            const { cell, agent } = stack.shift()!;

            if (agent.level === this.genes.length) {
                continue;
            }

            const {
                cellSpacingVariationInSegment,
                nbCellsInSegment,
                color,
                cellSizeVariationInSegment,
                nextSegmentBaseCellSize,
                branchesMaxAngle,
                nbBranches
            } = this.genes[agent.level];

            if (agent.levelStep >= nbCellsInSegment) {
                const minAngle = -branchesMaxAngle / 2;
                const maxAngle = branchesMaxAngle / 2;

                for (let i = 0; i < nbBranches; i++) {
                    const angle = map(i, 0, nbBranches - 1, minAngle, maxAngle);

                    const nextCell = {
                        position: cell.position.clone(),
                        size: cell.size * nextSegmentBaseCellSize,
                        color: [200, 200, 200, 200]
                    };
                    const nextAgent = {
                        level: agent.level + 1,
                        levelStep: 0,
                        direction: agent.direction.clone().rotateDeg(angle)
                    };
                    stack.push({
                        cell: nextCell,
                        agent: nextAgent
                    });
                }

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
