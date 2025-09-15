import { motion } from "framer-motion";
import { useState, useCallback } from "react";

// Add chess rule helpers (mirrored from backend, without en passant/castling)
function getPieceColor(piece: string): "white" | "black" {
  return piece === piece.toUpperCase() ? "white" : "black";
}

function isPathBlocked(
  board: (string | null)[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
): boolean {
  const rowStep = to.row > from.row ? 1 : to.row < from.row ? -1 : 0;
  const colStep = to.col > from.col ? 1 : to.col < from.col ? -1 : 0;

  let currentRow = from.row + rowStep;
  let currentCol = from.col + colStep;

  while (currentRow !== to.row || currentCol !== to.col) {
    if (board[currentRow][currentCol] !== null) return true;
    currentRow += rowStep;
    currentCol += colStep;
  }
  return false;
}

function isValidGeometry(
  board: (string | null)[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
): boolean {
  const piece = board[from.row][from.col];
  if (!piece) return false;

  const targetPiece = board[to.row][to.col];

  // Can't capture own piece
  if (
    targetPiece &&
    ((piece === piece.toUpperCase() && targetPiece === targetPiece.toUpperCase()) ||
      (piece === piece.toLowerCase() && targetPiece === targetPiece.toLowerCase()))
  ) {
    return false;
  }

  const rowDiff = Math.abs(to.row - from.row);
  const colDiff = Math.abs(to.col - from.col);

  switch (piece.toLowerCase()) {
    case "p": {
      const isWhite = piece === piece.toUpperCase();
      const direction = isWhite ? -1 : 1;
      const startRow = isWhite ? 6 : 1;

      // Forward moves
      if (from.col === to.col) {
        if (rowDiff === 1 && to.row === from.row + direction && !targetPiece) return true;
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

      // Diagonal capture
      if (rowDiff === 1 && colDiff === 1 && to.row === from.row + direction && !!targetPiece) {
        return true;
      }

      return false;
    }

    case "r":
      return (rowDiff === 0 || colDiff === 0) && !isPathBlocked(board, from, to);

    case "n":
      return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

    case "b":
      return rowDiff === colDiff && !isPathBlocked(board, from, to);

    case "q":
      return (
        ((rowDiff === 0 || colDiff === 0) || rowDiff === colDiff) &&
        !isPathBlocked(board, from, to)
      );

    case "k":
      return rowDiff <= 1 && colDiff <= 1;

    default:
      return false;
  }
}

function findKingPosition(
  board: (string | null)[][],
  side: "white" | "black"
): { row: number; col: number } {
  const kingChar = side === "white" ? "K" : "k";
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === kingChar) return { row: r, col: c };
    }
  }
  return { row: 0, col: 0 };
}

function isSquareAttacked(
  board: (string | null)[][],
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

  // King adjacency
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = square.row + dr;
      const c = square.col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = board[r][c];
        if (p && getPieceColor(p) === bySide && p.toLowerCase() === "k") return true;
      }
    }
  }

  // Rook/Queen orthogonal
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
        break;
      }
      r += dr;
      c += dc;
    }
  }

  // Bishop/Queen diagonal
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
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return false;
}

function applyMove(
  board: (string | null)[][],
  from: { row: number; col: number },
  to: { row: number; col: number }
): (string | null)[][] {
  const newBoard = board.map((row) => [...row]);
  const piece = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;
  newBoard[to.row][to.col] = piece;

  // Auto-queen on last rank for UI highlight logic; actual server promotion handles state
  if (piece === "P" && to.row === 0) newBoard[to.row][to.col] = "Q";
  if (piece === "p" && to.row === 7) newBoard[to.row][to.col] = "q";

  return newBoard;
}

function isLegalMoveClient(
  board: (string | null)[][],
  from: { row: number; col: number },
  to: { row: number; col: number },
  side: "white" | "black"
): boolean {
  const piece = board[from.row][from.col];
  if (!piece) return false;
  if (getPieceColor(piece) !== side) return false;

  if (!isValidGeometry(board, from, to)) return false;

  const newBoard = applyMove(board, from, to);
  const kingPos = findKingPosition(newBoard, side);
  const attacked = isSquareAttacked(newBoard, kingPos, side === "white" ? "black" : "white");
  return !attacked;
}

interface ChessBoardProps {
  board: (string | null)[][];
  onMove: (from: { row: number; col: number }, to: { row: number; col: number }) => void;
  currentTurn: "white" | "black";
  isPlayerTurn: boolean;
  highlightedSquares?: { row: number; col: number }[];
}

const pieceSymbols: { [key: string]: string } = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

export default function ChessBoard({ 
  board, 
  onMove, 
  currentTurn, 
  isPlayerTurn,
  highlightedSquares = []
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<{ row: number; col: number } | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<{ row: number; col: number }[]>([]);

  // Replace previous basic validator with full legality check
  const isLegalMoveForCurrent = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    return isLegalMoveClient(board, from, to, currentTurn);
  }, [board, currentTurn]);

  // Generate only legal moves for the selected piece, respecting king safety
  const getPossibleMoves = useCallback((from: { row: number; col: number }) => {
    const moves: { row: number; col: number }[] = [];
    const piece = board[from.row][from.col];
    if (!piece) return moves;

    // Only allow generating for the current side
    const isWhitePiece = piece === piece.toUpperCase();
    if ((currentTurn === "white" && !isWhitePiece) || (currentTurn === "black" && isWhitePiece)) {
      return moves;
    }

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (row === from.row && col === from.col) continue;
        if (isLegalMoveClient(board, from, { row, col }, currentTurn)) {
          moves.push({ row, col });
        }
      }
    }
    return moves;
  }, [board, currentTurn]);

  const isValidMove = useCallback((from: { row: number; col: number }, to: { row: number; col: number }) => {
    const piece = board[from.row][from.col];
    if (!piece) return false;
    
    // Basic validation - piece belongs to current player
    const isWhitePiece = piece === piece.toUpperCase();
    if ((currentTurn === "white" && !isWhitePiece) || (currentTurn === "black" && isWhitePiece)) {
      return false;
    }

    // Add more sophisticated move validation here
    return true;
  }, [board, currentTurn]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (!isPlayerTurn) return;

    const clickedPiece = board[row][col];
    
    if (selectedSquare) {
      // If clicking on a possible move, make the move
      if (possibleMoves.some(move => move.row === row && move.col === col)) {
        onMove(selectedSquare, { row, col });
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else if (clickedPiece && 
                 ((currentTurn === "white" && clickedPiece === clickedPiece.toUpperCase()) ||
                  (currentTurn === "black" && clickedPiece === clickedPiece.toLowerCase()))) {
        // Select a new piece
        setSelectedSquare({ row, col });
        setPossibleMoves(getPossibleMoves({ row, col }));
      } else {
        // Deselect
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    } else if (clickedPiece && 
               ((currentTurn === "white" && clickedPiece === clickedPiece.toUpperCase()) ||
                (currentTurn === "black" && clickedPiece === clickedPiece.toLowerCase()))) {
      // Select piece
      setSelectedSquare({ row, col });
      setPossibleMoves(getPossibleMoves({ row, col }));
    }
  }, [selectedSquare, possibleMoves, board, currentTurn, isPlayerTurn, onMove, getPossibleMoves]);

  const isSquareHighlighted = (row: number, col: number) => {
    return highlightedSquares.some(square => square.row === row && square.col === col);
  };

  const isSquareSelected = (row: number, col: number) => {
    return selectedSquare?.row === row && selectedSquare?.col === col;
  };

  const isPossibleMove = (row: number, col: number) => {
    return possibleMoves.some(move => move.row === row && move.col === col);
  };

  return (
    <div className="relative">
      {/* Grid background effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }} />
      </div>

      <div className="grid grid-cols-8 gap-0 border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.5)] bg-black/80 backdrop-blur-sm">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected = isSquareSelected(rowIndex, colIndex);
            const isPossible = isPossibleMove(rowIndex, colIndex);
            const isHighlighted = isSquareHighlighted(rowIndex, colIndex);

            return (
              <motion.div
                key={`${rowIndex}-${colIndex}`}
                className={`
                  w-16 h-16 flex items-center justify-center cursor-pointer relative
                  transition-all duration-200 font-mono text-3xl
                  ${isLight ? 'bg-gray-800/60' : 'bg-gray-900/60'}
                  ${isSelected ? 'bg-cyan-500/40 shadow-[inset_0_0_10px_rgba(0,255,255,0.8)]' : ''}
                  ${isPossible ? 'bg-green-500/30 shadow-[inset_0_0_8px_rgba(0,255,0,0.6)]' : ''}
                  ${isHighlighted ? 'bg-red-500/30 shadow-[inset_0_0_8px_rgba(255,0,128,0.6)]' : ''}
                  hover:bg-cyan-400/20 hover:shadow-[inset_0_0_15px_rgba(0,255,255,0.4)]
                  border border-gray-700/50
                `}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* Scan line effect */}
                <div className="absolute inset-0 opacity-30 pointer-events-none">
                  <div 
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"
                    style={{ 
                      animation: 'scan 2s linear infinite',
                      top: `${Math.random() * 100}%`
                    }}
                  />
                </div>

                {piece && (
                  <motion.span
                    className={`
                      text-4xl drop-shadow-[0_0_8px_currentColor] relative z-10
                      ${piece === piece.toUpperCase() 
                        ? 'text-cyan-300 filter drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' 
                        : 'text-pink-300 filter drop-shadow-[0_0_10px_rgba(255,0,128,0.8)]'
                      }
                    `}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    style={{
                      textShadow: `
                        0 0 5px currentColor,
                        2px 0 0 rgba(255,0,0,0.3),
                        -2px 0 0 rgba(0,255,255,0.3)
                      `
                    }}
                  >
                    {pieceSymbols[piece]}
                  </motion.span>
                )}

                {isPossible && !piece && (
                  <div className="w-4 h-4 rounded-full bg-green-400/60 shadow-[0_0_8px_rgba(0,255,0,0.8)]" />
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Coordinate labels */}
      <div className="absolute -left-6 top-0 h-full flex flex-col justify-around text-cyan-400 font-mono text-sm">
        {['8', '7', '6', '5', '4', '3', '2', '1'].map(num => (
          <div key={num} className="h-16 flex items-center">{num}</div>
        ))}
      </div>
      <div className="absolute -bottom-6 left-0 w-full flex justify-around text-cyan-400 font-mono text-sm">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(letter => (
          <div key={letter} className="w-16 flex justify-center">{letter}</div>
        ))}
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}