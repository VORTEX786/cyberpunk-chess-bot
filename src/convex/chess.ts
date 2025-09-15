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

    const board = game.board;
    const piece = board[args.from.row][args.from.col];
    if (!piece || piece !== piece.toUpperCase()) {
      throw new Error("No white piece at source");
    }

    // Validate move with full rules + king safety
    if (!isLegalMove(board, args.from, args.to, "white")) {
      throw new Error("Illegal move");
    }

    const { newBoard, capturedPiece } = applyMove(board, args.from, args.to);

    // Auto-promotion to Queen if pawn reaches last rank
    const movedPiece = newBoard[args.to.row][args.to.col];
    if (movedPiece === "P" && args.to.row === 0) {
      newBoard[args.to.row][args.to.col] = "Q";
    }

    // Update captured pieces (captured by white are black pieces)
    const newCapturedPieces = { ...game.capturedPieces };
    if (capturedPiece) {
      newCapturedPieces.white = [...newCapturedPieces.white, capturedPiece];
    }

    const newMoveHistory = [
      ...game.moveHistory,
      {
        from: args.from,
        to: args.to,
        piece: piece!,
        capturedPiece,
        timestamp: Date.now(),
      },
    ];

    // After player's move, it's black's turn. Compute black check/checkmate/stalemate.
    const blackInCheck = isSquareAttacked(
      newBoard,
      findKingPosition(newBoard, "black"),
      "white"
    );
    const blackLegalMoves = generateAllLegalMoves(newBoard, "black");
    let patch: any = {
      board: newBoard,
      currentTurn: "black",
      capturedPieces: newCapturedPieces,
      moveHistory: newMoveHistory,
      isCheck: blackInCheck,
    };

    if (blackLegalMoves.length === 0) {
      // No legal moves: checkmate or stalemate
      patch.status = "finished";
      patch.winner = blackInCheck ? "white" : "draw";
    }

    await ctx.db.patch(args.gameId, patch);
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

    const board = game.board;

    // Generate all legal black moves (with king safety)
    const possibleMoves = generateAllLegalMoves(board, "black");

    if (possibleMoves.length === 0) {
      // No moves available - checkmate or stalemate
      const blackInCheck = isSquareAttacked(
        board,
        findKingPosition(board, "black"),
        "white"
      );
      await ctx.db.patch(args.gameId, {
        status: "finished",
        winner: blackInCheck ? "white" : "draw",
      });
      return;
    }

    // Pick a move based on difficulty
    let selected;
    if (game.difficulty === "easy") {
      selected = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else if (game.difficulty === "medium") {
      const captures = possibleMoves.filter((m) => m.capturedPiece);
      selected =
        captures.length > 0
          ? captures[Math.floor(Math.random() * captures.length)]
          : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    } else {
      const captures = possibleMoves.filter((m) => m.capturedPiece);
      const centerMoves = possibleMoves.filter(
        (m) => m.to.row >= 3 && m.to.row <= 4 && m.to.col >= 3 && m.to.col <= 4
      );
      if (captures.length > 0) {
        selected = captures[Math.floor(Math.random() * captures.length)];
      } else if (centerMoves.length > 0) {
        selected = centerMoves[Math.floor(Math.random() * centerMoves.length)];
      } else {
        selected =
          possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }
    }

    // Execute the bot move
    const { newBoard, capturedPiece } = applyMove(
      board,
      selected.from,
      selected.to
    );

    // Auto-promotion to Queen if pawn reaches last rank for black
    const movedPiece = newBoard[selected.to.row][selected.to.col];
    if (movedPiece === "p" && selected.to.row === 7) {
      newBoard[selected.to.row][selected.to.col] = "q";
    }

    const newCapturedPieces = { ...game.capturedPieces };
    if (capturedPiece) {
      newCapturedPieces.black = [...newCapturedPieces.black, capturedPiece];
    }

    const newMoveHistory = [
      ...game.moveHistory,
      {
        from: selected.from,
        to: selected.to,
        piece: selected.piece,
        capturedPiece,
        timestamp: Date.now(),
      },
    ];

    // After bot move, it's white's turn. Compute white check/checkmate/stalemate.
    const whiteInCheck = isSquareAttacked(
      newBoard,
      findKingPosition(newBoard, "white"),
      "black"
    );
    const whiteLegalMoves = generateAllLegalMoves(newBoard, "white");

    let patch: any = {
      board: newBoard,
      currentTurn: "white",
      capturedPieces: newCapturedPieces,
      moveHistory: newMoveHistory,
      isCheck: whiteInCheck,
    };

    if (whiteLegalMoves.length === 0) {
      patch.status = "finished";
      patch.winner = whiteInCheck ? "black" : "draw";
    }

    await ctx.db.patch(args.gameId, patch);
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

function isValidMove(
  board: any[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
): boolean {
  const piece = board[from.row][from.col];
  if (!piece) return false;

  const targetPiece = board[to.row][to.col];

  // Can't capture own pieces
  if (
    targetPiece &&
    ((piece === piece.toUpperCase() && targetPiece === targetPiece.toUpperCase()) ||
      (piece === piece.toLowerCase() && targetPiece === targetPiece.toLowerCase()))
  ) {
    return false;
  }

  // Basic piece movement validation
  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);

  switch (piece.toLowerCase()) {
    case "p": {
      const isWhite = piece === piece.toUpperCase();
      const direction = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // forward move
      if (from.col === to.col) {
        // one step must be empty
        if (rowDiff === 1 && to.row === from.row + direction && !targetPiece) {
          return true;
        }
        // two steps: must be from start, both squares empty
        if (
          rowDiff === 2 &&
          from.row === startRow &&
          to.row === from.row + 2 * direction &&
          !targetPiece &&
          board[from.row + direction][from.col] === null
        ) {
          return true;
        }
        return false;
      }

      // capture diagonally
      if (
        rowDiff === 1 &&
        colDiff === 1 &&
        to.row === from.row + direction &&
        !!targetPiece
      ) {
        return true;
      }

      return false;
    }

    case "r": // Rook
      return (rowDiff === 0 || colDiff === 0) && !isPathBlocked(board, from, to);

    case "n": // Knight
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

    case "b": // Bishop
      return rowDiff === colDiff && !isPathBlocked(board, from, to);

    case "q": // Queen
      return (
        ((rowDiff === 0 || colDiff === 0) || rowDiff === colDiff) &&
        !isPathBlocked(board, from, to)
      );

    case "k": // King
      // Geometry only; king safety is checked in isLegalMove
      return rowDiff <= 1 && colDiff <= 1;

    default:
      return false;
  }
}

function isPathBlocked(
  board: any[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
): boolean {
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

function getPieceColor(piece: string): "white" | "black" {
  return piece === piece.toUpperCase() ? "white" : "black";
}

function findKingPosition(
  board: any[][],
  side: "white" | "black"
): { row: number; col: number } {
  const kingChar = side === "white" ? "K" : "k";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kingChar) return { row: r, col: c };
    }
  }
  // In a valid game the king always exists; fallback to (0,0) to avoid crashes
  return { row: 0, col: 0 };
}

function isSquareAttacked(
  board: any[][],
  square: { row: number; col: number },
  bySide: "white" | "black"
): boolean {
  // Knights
  const knightDeltas = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ];
  for (const [dr, dc] of knightDeltas) {
    const r = square.row + dr;
    const c = square.col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p && getPieceColor(p) === bySide && p.toLowerCase() === "n") return true;
    }
  }

  // Pawns
  const pawnDir = bySide === "white" ? -1 : 1;
  for (const dc of [-1, 1]) {
    const r = square.row + pawnDir;
    const c = square.col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p && getPieceColor(p) === bySide && p.toLowerCase() === "p") return true;
    }
  }

  // King (adjacent)
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = square.row + dr;
      const c = square.col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = board[r][c];
        if (p && getPieceColor(p) === bySide && p.toLowerCase() === "k") {
          return true;
        }
      }
    }
  }

  // Sliding: Rook/Queen (orthogonal)
  const orthDirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const [dr, dc] of orthDirs) {
    let r = square.row + dr;
    let c = square.col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (getPieceColor(p) === bySide) {
          const t = p.toLowerCase();
          if (t === "r" || t === "q") return true;
        }
        break; // blocked
      }
      r += dr;
      c += dc;
    }
  }

  // Sliding: Bishop/Queen (diagonal)
  const diagDirs = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  for (const [dr, dc] of diagDirs) {
    let r = square.row + dr;
    let c = square.col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (getPieceColor(p) === bySide) {
          const t = p.toLowerCase();
          if (t === "b" || t === "q") return true;
        }
        break; // blocked
      }
      r += dr;
      c += dc;
    }
  }

  return false;
}

function applyMove(
  board: any[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
): { newBoard: any[][]; capturedPiece: string | null } {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[from.row][from.col];
  const capturedPiece = newBoard[to.row][to.col];

  newBoard[from.row][from.col] = null;
  newBoard[to.row][to.col] = piece;

  return { newBoard, capturedPiece: capturedPiece ?? null };
}

function isLegalMove(
  board: any[][],
  from: { row: number; col: number },
  to: { row: number; col: number },
  side: "white" | "black"
): boolean {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  if (getPieceColor(piece) !== side) return false;

  // First, basic geometry/path rules
  if (!isValidMove(board, from, to)) return false;

  // Then, ensure own king is not in check after making the move
  const { newBoard } = applyMove(board, from, to);
  const kingPos = findKingPosition(newBoard, side);
  const attacked = isSquareAttacked(newBoard, kingPos, side === "white" ? "black" : "white");
  return !attacked;
}

function generateAllLegalMoves(board: any[][], side: "white" | "black") {
  const moves: Array<{
    from: { row: number; col: number };
    to: { row: number; col: number };
    piece: string;
    capturedPiece: string | null;
  }> = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece || getPieceColor(piece) !== side) continue;

      for (let tr = 0; tr < 8; tr++) {
        for (let tc = 0; tc < 8; tc++) {
          if (r === tr && c === tc) continue;
          if (isLegalMove(board, { row: r, col: c }, { row: tr, col: tc }, side)) {
            moves.push({
              from: { row: r, col: c },
              to: { row: tr, col: tc },
              piece,
              capturedPiece: board[tr][tc],
            });
          }
        }
      }
    }
  }
  return moves;
}