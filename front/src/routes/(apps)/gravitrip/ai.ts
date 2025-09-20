import {
    cloneBoard,
    getBoardState,
    getPossibleMoves,
    makeMove,
    BoardState,
    type Board,
    type Cell
} from './gravitrip';

const getRandomMove = (board: Board) => {
    const candidates = getPossibleMoves(board);

    const randIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randIndex];
};

export type MoveResult = {
    board: Board;
    move: number;
};

export const makeRandomMove = (board: Board, cell: Cell): MoveResult => {
    const move = getRandomMove(board);
    return { board: makeMove(board, cell, move), move };
};

export const makeMonteCarloMove = (
    board: Board,
    cell: Cell,
    config?: { iterations?: number; c?: number }
): MoveResult => {
    const move = mcts(board, cell, config?.iterations, config?.c);
    return { board: makeMove(board, cell, move), move };
};

class MCTSNode {
    board: Board;
    player: Cell; // player to move at this node
    move: number | null; // column chosen from parent -> this node
    parent: MCTSNode | null;
    children: MCTSNode[] = [];
    visits = 0;
    wins = 0; // wins for parent.player

    constructor(
        board: Board,
        player: Cell,
        move: number | null = null,
        parent: MCTSNode | null = null
    ) {
        this.board = board;
        this.player = player;
        this.move = move;
        this.parent = parent;
    }

    isFullyExpanded(): boolean {
        return this.children.length === getPossibleMoves(this.board).length;
    }

    isTerminal(): boolean {
        return getBoardState(this.board) !== BoardState.notOver;
    }
}

// --- UCT formula ---
// The constant c in the UCT formula controls the exploration vs
// exploitation trade-off:
//
// Smaller c
// c (e.g. 0.5, 0.7)
// → The algorithm favors exploitation (moves with high win rates).
// → It will mostly focus on a few good moves quickly, but risks missing alternatives.
//
// Larger c
// c (e.g. 2.0, 5.0)
// → The algorithm favors exploration (trying less-visited moves).
// → It will search more broadly, but might waste time on weak moves.
function uctValue(
    totalVisits: number,
    nodeWins: number,
    nodeVisits: number,
    c = Math.sqrt(2)
): number {
    if (nodeVisits === 0) return Infinity;
    return nodeWins / nodeVisits + c * Math.sqrt(Math.log(totalVisits) / nodeVisits);
}

function select(node: MCTSNode, c: number): MCTSNode {
    while (!node.isTerminal()) {
        if (!node.isFullyExpanded()) return expand(node);
        else node = bestUCTChild(node, c);
    }
    return node;
}

function expand(node: MCTSNode): MCTSNode {
    const triedMoves = node.children.map((c) => c.move);
    const possibleMoves = getPossibleMoves(node.board);

    const untriedMoves = possibleMoves.filter((m) => !triedMoves.includes(m));
    const move = untriedMoves[Math.floor(Math.random() * untriedMoves.length)];

    const newBoard = cloneBoard(node.board);
    makeMove(newBoard, node.player, move);

    const child = new MCTSNode(newBoard, node.player === 1 ? 2 : 1, move, node);
    node.children.push(child);
    return child;
}

function bestUCTChild(node: MCTSNode, c: number): MCTSNode {
    return node.children.reduce((best, child) => {
        const bestVal = uctValue(node.visits, best.wins, best.visits, c);
        const childVal = uctValue(node.visits, child.wins, child.visits, c);
        return childVal > bestVal ? child : best;
    });
}

function simulate(node: MCTSNode): BoardState {
    const board = cloneBoard(node.board);
    let currentPlayer = node.player;

    while (true) {
        const state = getBoardState(board);
        if (state !== BoardState.notOver) return state;

        const moves = getPossibleMoves(board);
        const move = moves[Math.floor(Math.random() * moves.length)];
        makeMove(board, currentPlayer, move);

        currentPlayer = currentPlayer === 1 ? 2 : 1;
    }
}

function backpropagate(node: MCTSNode, result: BoardState): void {
    let current: MCTSNode | null = node;

    while (current !== null) {
        current.visits += 1;

        // Count a win if result matches parent’s perspective
        if (
            (result === BoardState.winPlayer1 && current.parent?.player === 1) ||
            (result === BoardState.winPlayer2 && current.parent?.player === 2)
        ) {
            current.wins += 1;
        } else if (result === BoardState.draw) {
            current.wins += 0.5; // optional: count draws as half-win
        }

        current = current.parent;
    }
}

// Main MCTS function
function mcts(rootBoard: Board, player: Cell, iterations = 1000, c = Math.sqrt(2)): number {
    const root = new MCTSNode(cloneBoard(rootBoard), player, null, null);

    for (let i = 0; i < iterations; i++) {
        const leaf = select(root, c);
        const result = simulate(leaf);
        backpropagate(leaf, result);
    }

    // Pick child with highest visit count
    const bestChild = root.children.reduce((a, b) => (a.visits > b.visits ? a : b));
    return bestChild.move!; // return best column
}
