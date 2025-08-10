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
    genes: { lengthGene: number; cellSize: number; angleAmplitudeGene: number }[];
    structure: PlantCell[];

    constructor() {
        this.genes = [
            { lengthGene: 1.0, cellSize: 1.0, angleAmplitudeGene: 1.0 },
            { lengthGene: 1.0, cellSize: 0.9, angleAmplitudeGene: 0.9 },
            { lengthGene: 1.0, cellSize: 0.8, angleAmplitudeGene: 0.8 },
            { lengthGene: 1.0, cellSize: 0.7, angleAmplitudeGene: 0.7 },
            { lengthGene: 1.0, cellSize: 0.6, angleAmplitudeGene: 0.6 },
            { lengthGene: 1.0, cellSize: 0.5, angleAmplitudeGene: 0.5 }
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

            const { lengthGene, cellSize, angleAmplitudeGene } = this.genes[agent.level];

            if (agent.levelStep === 4) {
                const angle = 45 * angleAmplitudeGene;
                const leftCell = {
                    position: cell.position.clone(),
                    size: cell.size * cellSize,
                    color: 'white'
                };
                const leftAgent = {
                    level: agent.level + 1,
                    levelStep: 0,
                    direction: agent.direction
                        .clone()
                        .rotateDeg(-angle / 2)
                        .multiplyScalar(lengthGene)
                };
                stack.push({
                    cell: leftCell,
                    agent: leftAgent
                });

                const rightCell = {
                    position: cell.position.clone(),
                    size: cell.size * cellSize,
                    color: 'white'
                };
                const rightAgent = {
                    level: agent.level + 1,
                    levelStep: 0,
                    direction: agent.direction
                        .clone()
                        .rotateDeg(angle / 2)
                        .multiplyScalar(lengthGene)
                };
                stack.push({
                    cell: rightCell,
                    agent: rightAgent
                });

                continue;
            }

            const nextCell = {
                ...cell,
                position: cell.position.clone().add(agent.direction),
                size: cell.size
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
