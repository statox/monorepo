import { random } from './utils';

export interface PlantGene {
    cellDeviationFactor: number;
    cellSpacingVariationInSegment: number;
    cellSizeVariationInSegment: number;
    nbCellsInSegment: number;
    nextSegmentBaseCellSize: number;
    branchesMaxAngle: number;
    nbBranches: number;
    color: number[];
}

const colorByIndex = [
    [119, 114, 37, 250],
    [84, 119, 37, 220],
    [112, 181, 21, 190],
    [120, 211, 2, 160],
    [173, 211, 2, 130],
    [98, 54, 130, 100],
    [153, 83, 198, 70],
    [148, 39, 226, 40],
    [226, 39, 113, 10]
];

export const getRandomGenes = (): PlantGene[] => {
    const genes: PlantGene[] = [];

    genes.push({
        cellDeviationFactor: random(0.2, 1),
        cellSizeVariationInSegment: 0.997,
        cellSpacingVariationInSegment: 0.6,
        nbCellsInSegment: 15,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 110,
        nbBranches: Math.floor(random(2, 4)),
        color: colorByIndex[0]
    });

    for (let i = 0; i < random(5, 8); i++) {
        genes.push({
            cellDeviationFactor: random(0.2, 1),
            cellSizeVariationInSegment: random(0.93, 0.99),
            cellSpacingVariationInSegment: random(0.4, 0.6),
            nbCellsInSegment: Math.floor(random(2, 6)),
            nextSegmentBaseCellSize: 1.0,
            branchesMaxAngle: Math.floor(random(40, 180)),
            nbBranches: Math.floor(random(2, 4)),
            color: colorByIndex[i + 1]
        });
    }
    genes[1].nbCellsInSegment = 10;

    return genes;
};

export const defaultGenes: PlantGene[] = [
    {
        cellDeviationFactor: 0.9,
        cellSizeVariationInSegment: 0.997,
        cellSpacingVariationInSegment: 0.6,
        nbCellsInSegment: 25,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 110,
        nbBranches: 2,
        color: colorByIndex[0]
    },
    {
        cellDeviationFactor: 0.9,
        cellSizeVariationInSegment: 0.985,
        cellSpacingVariationInSegment: 0.8,
        nbCellsInSegment: 10,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: colorByIndex[1]
    },
    {
        cellDeviationFactor: 0.8,
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.7,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: colorByIndex[2]
    },
    {
        cellDeviationFactor: 0.8,
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.6,
        nbCellsInSegment: 1,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: colorByIndex[3]
    },
    {
        cellDeviationFactor: 0.8,
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.5,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 120,
        nbBranches: 2,
        color: colorByIndex[4]
    },
    {
        cellDeviationFactor: 0.7,
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.4,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: colorByIndex[5]
    },
    {
        cellDeviationFactor: 0.7,
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.6,
        nbCellsInSegment: 9,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 110,
        nbBranches: 2,
        color: colorByIndex[6]
    },
    {
        cellDeviationFactor: 0.7,
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.8,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: colorByIndex[7]
    },
    {
        cellDeviationFactor: 0.6,
        cellSizeVariationInSegment: 0.95,
        cellSpacingVariationInSegment: 0.7,
        nbCellsInSegment: 4,
        nextSegmentBaseCellSize: 1.0,
        branchesMaxAngle: 45,
        nbBranches: 2,
        color: colorByIndex[8]
    }
];
