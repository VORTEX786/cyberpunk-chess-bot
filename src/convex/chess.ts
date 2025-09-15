import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

export const createGame = mutation({
  args: {
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated to create a game");
    }

    const initialBoard = [
      ["r", "n", "b", "q", "k", "b", "n", "r"],
      ["p", "p", "p", "p", "p", "p", "p", "p"],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ["P", "P", "P", "P", "P", "P", "P", "P"],
      ["R", "N", "B", "Q", "K", "B", "N", "R"],
    ];

    return await ctx.db.insert("games", {
      userId: user._id,
      board: initialBoard,
      currentTurn: "white",
      difficulty: args.difficulty,
      status: "active",
      capturedPieces: { white: [], black: [] },
      moveHistory: [],
      isCheck: false,
      winner: null,
    });
  },
});

export const makeMove = mutation({
  args: {
    gameId: v.id("games"),
    from: v.object({ row: v.number(), col: v.number() }),
    to: v.object({ row: v.number(), col: v.number() }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Must be authenticated");
    }

    const game = await ctx.db.get(args.gameId);
    if (!game || game.userId !== user._id) {
      throw new Error("Game not found");
    }

    if (game.status !== "active" || game.currentTurn !== "white") {
      throw new Error("Invalid move");
    }

    // Update the board with the move
    const newBoard = game.board.map(row => [...row]);
    const piece = newBoard[args.from.row][args.from.col];
    const capturedPiece = newBoard[args.to.row][args.to.col];
    
    newBoard[args.from.row][args.from.col] = null;
    newBoard[args.to.row][args.to.col] = piece;

    const newCapturedPieces = { ...game.capturedPieces };
    if (capturedPiece) {
      newCapturedPieces.white.push(capturedPiece);
    }

    const newMoveHistory = [...game.moveHistory, {
      from: args.from,
      to: args.to,
      piece: piece!,
      capturedPiece,
      timestamp: Date.now(),
    }];

    await ctx.db.patch(args.gameId, {
      board: newBoard,
      currentTurn: "black",
      capturedPieces: newCapturedPieces,
      moveHistory: newMoveHistory,
    });

    return args.gameId;
  },
});

export const makeBotMove = mutation({
  args: {
    gameId: v.id("games"),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId);
    if (!game || game.currentTurn !== "black" || game.status !== "active") {
      return;
    }

    // Simple bot logic - find all possible moves and pick one based on difficulty
    const board = game.board;
    const possibleMoves = [];

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece && piece === piece.toLowerCase()) { // Black pieces
          // Find valid moves for this piece
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMove(board, { row, col }, { row: toRow, col: toCol })) {
                possibleMoves.push({
                  from: { row, col },
                  to: { row: toRow, col: toCol },
                  piece,
                  capturedPiece: board[toRow][toCol],
                });
              }
            }
          }
        }
      }
    }

    if (possibleMoves.length === 0) {
      // No moves available - checkmate or stalemate
      await ctx.db.patch(args.gameId, {
        status: "finished",
        winner: "white",
      });
      return;
    }

    let selectedMove;
    if (game.difficulty === "easy") {
      // Random move
      selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else if (game.difficulty === "medium") {
      // Prefer captures
      const captures = possibleMoves.filter(move => move.capturedPiece);
      selectedMove = captures.length > 0 
        ? captures[Math.floor(Math.random() * captures.length)]
        : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else {
      // Hard - prefer captures and center control
      const captures = possibleMoves.filter(move => move.capturedPiece);
      const centerMoves = possibleMoves.filter(move => 
        move.to.row >= 3 && move.to.row <= 4 && move.to.col >= 3 && move.to.col <= 4
      );
      
      if (captures.length > 0) {
        selectedMove = captures[Math.floor(Math.random() * captures.length)];
      } else if (centerMoves.length > 0) {
        selectedMove = centerMoves[Math.floor(Math.random() * centerMoves.length)];
      } else {
        selectedMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }
    }

    // Execute the bot move
    const newBoard = board.map(row => [...row]);
    newBoard[selectedMove.from.row][selectedMove.from.col] = null;
    newBoard[selectedMove.to.row][selectedMove.to.col] = selectedMove.piece;

    const newCapturedPieces = { ...game.capturedPieces };
    if (selectedMove.capturedPiece) {
      newCapturedPieces.black.push(selectedMove.capturedPiece);
    }

    const newMoveHistory = [...game.moveHistory, {
      ...selectedMove,
      timestamp: Date.now(),
    }];

    await ctx.db.patch(args.gameId, {
      board: newBoard,
      currentTurn: "white",
      capturedPieces: newCapturedPieces,
      moveHistory: newMoveHistory,
    });
  },
});

export const getGame = query({
  args: { gameId: v.id("games") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const game = await ctx.db.get(args.gameId);
    if (!game || game.userId !== user._id) return null;

    return game;
  },
});

export const getUserGames = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    return await ctx.db
      .query("games")
      .withIndex("by_user_id", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
  },
});

// Helper function for basic move validation
function isValidMove(board: any[][], from: {row: number, col: number}, to: {row: number, col: number}): boolean {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  
  const targetPiece = board[to.row][to.col];
  
  // Can't capture own pieces
  if (targetPiece && 
      ((piece === piece.toUpperCase() && targetPiece === targetPiece.toUpperCase()) ||
       (piece === piece.toLowerCase() && targetPiece === targetPiece.toLowerCase()))) {
    return false;
  }

  // Basic piece movement validation (simplified)
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);
  
  switch (piece.toLowerCase()) {
    case 'p': // Pawn
      const direction = piece === piece.toUpperCase() ? -1 : 1;
      const startRow = piece === piece.toUpperCase() ? 6 : 1;
      
      if (colDiff === 0) { // Forward move
        if (targetPiece) return false; // Can't capture forward
        if (rowDiff === 1 && to.row === from.row + direction) return true;
        if (rowDiff === 2 && from.row === startRow && to.row === from.row + 2 * direction) return true;
      } else if (colDiff === 1 && rowDiff === 1 && to.row === from.row + direction) {
        return !!targetPiece; // Can only move diagonally to capture
      }
      return false;
      
    case 'r': // Rook
      return (rowDiff === 0 || colDiff === 0) && !isPathBlocked(board, from, to);
      
    case 'n': // Knight
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
      
    case 'b': // Bishop
      return rowDiff === colDiff && !isPathBlocked(board, from, to);
      
    case 'q': // Queen
      return ((rowDiff === 0 || colDiff === 0) || (rowDiff === colDiff)) && !isPathBlocked(board, from, to);
      
    case 'k': // King
      return rowDiff <= 1 && colDiff <= 1;
      
    default:
      return false;
  }
}

function isPathBlocked(board: any[][], from: {row: number, col: number}, to: {row: number, col: number}): boolean {
  const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
  const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;
  
  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;
  
  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol] !== null) {
      return true;
    }
    currentRow += rowStep;
    currentCol += colStep;
  }
  
  return false;
}
