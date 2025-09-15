import { motion } from "framer-motion";

interface CapturedPiecesProps {
  capturedPieces: {
    white: string[];
    black: string[];
  };
}

const pieceSymbols: { [key: string]: string } = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟',
};

export default function CapturedPieces({ capturedPieces }: CapturedPiecesProps) {
  return (
    <div className="space-y-6">
      {/* White captured pieces (captured by black) */}
      <div className="bg-black/60 border border-pink-500/30 rounded-lg p-4 backdrop-blur-sm">
        <h3 className="text-pink-400 font-mono text-sm mb-3 tracking-wider">
          CAPTURED BY BLACK
        </h3>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {capturedPieces.black.map((piece, index) => (
            <motion.span
              key={`black-${index}`}
              className="text-2xl text-cyan-300 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                delay: index * 0.1 
              }}
              style={{
                textShadow: `
                  0 0 5px currentColor,
                  1px 0 0 rgba(255,0,0,0.3),
                  -1px 0 0 rgba(0,255,255,0.3)
                `
              }}
            >
              {pieceSymbols[piece]}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Black captured pieces (captured by white) */}
      <div className="bg-black/60 border border-cyan-500/30 rounded-lg p-4 backdrop-blur-sm">
        <h3 className="text-cyan-400 font-mono text-sm mb-3 tracking-wider">
          CAPTURED BY WHITE
        </h3>
        <div className="flex flex-wrap gap-2 min-h-[40px]">
          {capturedPieces.white.map((piece, index) => (
            <motion.span
              key={`white-${index}`}
              className="text-2xl text-pink-300 drop-shadow-[0_0_8px_rgba(255,0,128,0.8)]"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 20,
                delay: index * 0.1 
              }}
              style={{
                textShadow: `
                  0 0 5px currentColor,
                  1px 0 0 rgba(255,0,0,0.3),
                  -1px 0 0 rgba(0,255,255,0.3)
                `
              }}
            >
              {pieceSymbols[piece]}
            </motion.span>
          ))}
        </div>
      </div>
    </div>
  );
}
