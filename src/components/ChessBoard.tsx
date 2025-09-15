import { motion } from "framer-motion";
import { useState, useCallback } from "react";

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

  const getPossibleMoves = useCallback((from: { row: number; col: number }) => {
    const moves: { row: number; col: number }[] = [];
    const piece = board[from.row][from.col];
    
    if (!piece) return moves;

    // Simplified move generation - check all squares
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (isValidMove(from, { row, col })) {
          moves.push({ row, col });
        }
      }
    }

    return moves;
  }, [board, isValidMove]);

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
