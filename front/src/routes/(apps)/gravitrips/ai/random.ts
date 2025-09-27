import { getPossibleMoves, makeMove, type Board, type Cell } from '../gravitrips';
import type { MoveResult } from './types';

const getRandomMove = (board: Board) => {
    const candidates = getPossibleMoves(board);

    const randIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randIndex];
};

export const makeRandomMove = (board: Board, cell: Cell): MoveResult => {
    const move = getRandomMove(board);
    return { board: makeMove(board, cell, move), move };
};
