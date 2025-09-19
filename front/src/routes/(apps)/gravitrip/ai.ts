import { getPossibleMoves, makeMove, type Board, type Cell } from './gravitrip';

const getRandomMove = (board: Board) => {
    const candidates = getPossibleMoves(board);

    const randIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randIndex];
};

export const makeRandomMove = (board: Board, cell: Cell) => {
    const move = getRandomMove(board);
    return makeMove(board, cell, move);
};
