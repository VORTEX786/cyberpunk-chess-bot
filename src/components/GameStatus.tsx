import { motion } from "framer-motion";
import { Bot, User, Crown, AlertTriangle } from "lucide-react";

interface GameStatusProps {
  currentTurn: "white" | "black";
  isCheck: boolean;
  winner: "white" | "black" | "draw" | null;
  difficulty: "easy" | "medium" | "hard";
}

export default function GameStatus({ currentTurn, isCheck, winner, difficulty }: GameStatusProps) {
  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case "easy": return "text-green-400";
      case "medium": return "text-yellow-400";
      case "hard": return "text-red-400";
      default: return "text-cyan-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Difficulty Display */}
      <div className="bg-black/60 border border-gray-600/30 rounded-lg p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" />
          <span className="text-cyan-400 font-mono text-sm tracking-wider">BOT DIFFICULTY:</span>
          <span className={`font-mono font-bold ${getDifficultyColor(difficulty)} tracking-wider`}>
            {difficulty.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Current Turn */}
      <motion.div 
        className={`
          bg-black/60 border rounded-lg p-4 backdrop-blur-sm
          ${currentTurn === "white" 
            ? "border-cyan-500/50 shadow-[0_0_15px_rgba(0,255,255,0.3)]" 
            : "border-pink-500/50 shadow-[0_0_15px_rgba(255,0,128,0.3)]"
          }
        `}
        animate={{ 
          boxShadow: currentTurn === "white" 
            ? "0 0 20px rgba(0,255,255,0.4)" 
            : "0 0 20px rgba(255,0,128,0.4)" 
        }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3">
          {currentTurn === "white" ? (
            <User className="w-6 h-6 text-cyan-400" />
          ) : (
            <Bot className="w-6 h-6 text-pink-400" />
          )}
          <div>
            <div className={`font-mono text-lg font-bold tracking-wider ${
              currentTurn === "white" ? "text-cyan-400" : "text-pink-400"
            }`}>
              {currentTurn === "white" ? "YOUR TURN" : "BOT THINKING..."}
            </div>
            <div className="text-gray-400 font-mono text-sm">
              {currentTurn === "white" ? "White pieces" : "Black pieces"}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Check Warning */}
      {isCheck && (
        <motion.div 
          className="bg-red-900/60 border border-red-500/50 rounded-lg p-4 backdrop-blur-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
            <div>
              <div className="text-red-400 font-mono font-bold tracking-wider">
                CHECK!
              </div>
              <div className="text-red-300 font-mono text-sm">
                King is under attack
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Winner Display */}
      {winner && (
        <motion.div 
          className={`
            bg-black/80 border-2 rounded-lg p-6 backdrop-blur-sm text-center
            ${winner === "white" 
              ? "border-cyan-500 shadow-[0_0_25px_rgba(0,255,255,0.5)]" 
              : winner === "black"
              ? "border-pink-500 shadow-[0_0_25px_rgba(255,0,128,0.5)]"
              : "border-yellow-500 shadow-[0_0_25px_rgba(255,255,0,0.5)]"
            }
          `}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <Crown className={`w-12 h-12 mx-auto mb-4 ${
            winner === "white" ? "text-cyan-400" : 
            winner === "black" ? "text-pink-400" : "text-yellow-400"
          }`} />
          <div className={`font-mono text-2xl font-bold tracking-wider mb-2 ${
            winner === "white" ? "text-cyan-400" : 
            winner === "black" ? "text-pink-400" : "text-yellow-400"
          }`}>
            {winner === "draw" ? "DRAW!" : 
             winner === "white" ? "YOU WIN!" : "BOT WINS!"}
          </div>
          <div className="text-gray-400 font-mono text-sm">
            {winner === "draw" ? "Game ended in a draw" :
             winner === "white" ? "Congratulations!" : "Better luck next time!"}
          </div>
        </motion.div>
      )}
    </div>
  );
}
