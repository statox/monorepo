export interface PlantGene {
    cellSpacingVariationInSegment: number;
    cellSizeVariationInSegment: number;
    nbCellsInSegment: number;
    nextSegmentBaseCellSize: number;
    branchesMaxAngle: number;
    nbBranches: number;
    color: string;
}

function random(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

export const getRandomGenes = (): PlantGene[] => {
    const genes: PlantGene[] = [];

    genes.push({
        cellSizeVariationInSegment: 0.997,
        cellSpacingVariationInSegment: 0.6,
        nbCellsInSegment: 25,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 110,
        nbBranches: Math.floor(random(2, 4)),
        color: 'white'
    });

    for (let i = 0; i < random(5, 8); i++) {
        genes.push({
            cellSizeVariationInSegment: random(0.93, 0.99),
            cellSpacingVariationInSegment: random(0.4, 0.6),
            nbCellsInSegment: Math.floor(random(2, 6)),
            nextSegmentBaseCellSize: 1.0,
            branchesMaxAngle: Math.floor(random(40, 180)),
            nbBranches: Math.floor(random(2, 4)),
            color: 'white'
        });
    }
    genes[1].nbCellsInSegment = 10;

    return genes;
};

export const defaultGenes: PlantGene[] = [
    {
        cellSizeVariationInSegment: 0.997,
        cellSpacingVariationInSegment: 0.6,
        nbCellsInSegment: 25,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 110,
        nbBranches: 2,
        color: 'white'
    },
    {
        cellSizeVariationInSegment: 0.985,
        cellSpacingVariationInSegment: 0.8,
        nbCellsInSegment: 10,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: 'red'
    },
    {
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.7,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: 'orange'
    },
    {
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.6,
        nbCellsInSegment: 1,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: 'green'
    },
    {
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.5,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 120,
        nbBranches: 2,
        color: 'yellow'
    },
    {
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.4,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: 'lightblue'
    },
    {
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.6,
        nbCellsInSegment: 9,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 110,
        nbBranches: 2,
        color: 'lightgreen'
    },
    {
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.8,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: 'lightred'
    },
    {
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.7,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: 'purple'
    }
];
