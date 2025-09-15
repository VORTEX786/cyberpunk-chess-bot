import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RotateCcw, Home } from "lucide-react";
import ChessBoard from "@/components/ChessBoard";
import CapturedPieces from "@/components/CapturedPieces";
import GameStatus from "@/components/GameStatus";

export default function Chess() {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  
  const game = useQuery(api.chess.getGame, 
    gameId ? { gameId: gameId as Id<"games"> } : "skip"
  );
  const makeMove = useMutation(api.chess.makeMove);
  const makeBotMove = useMutation(api.chess.makeBotMove);

  const [isProcessingMove, setIsProcessingMove] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    // Auto-trigger bot move when it's bot's turn
    if (game && game.currentTurn === "black" && game.status === "active" && !isProcessingMove) {
      const timer = setTimeout(async () => {
        setIsProcessingMove(true);
        try {
          await makeBotMove({ gameId: game._id });
        } catch (error) {
          console.error("Bot move error:", error);
          toast.error("Bot move failed");
        } finally {
          setIsProcessingMove(false);
        }
      }, 1000); // 1 second delay for bot move

      return () => clearTimeout(timer);
    }
  }, [game, makeBotMove, isProcessingMove]);

  const handleMove = async (from: { row: number; col: number }, to: { row: number; col: number }) => {
    if (!game || game.currentTurn !== "white" || isProcessingMove) return;

    setIsProcessingMove(true);
    try {
      await makeMove({
        gameId: game._id,
        from,
        to,
      });
      toast.success("Move made!");
    } catch (error) {
      console.error("Move error:", error);
      toast.error("Invalid move");
    } finally {
      setIsProcessingMove(false);
    }
  };

  const handleNewGame = () => {
    navigate("/");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono">Loading...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 font-mono text-xl mb-4">Game not found</div>
          <Button onClick={() => navigate("/")} variant="outline" className="border-cyan-500 text-cyan-400">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 0, 128, 0.1) 0%, transparent 50%),
            linear-gradient(45deg, transparent 49%, rgba(0, 255, 0, 0.03) 50%, transparent 51%)
          `,
        }} />
      </div>

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              size="sm"
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-mono"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK
            </Button>
            <h1 className="text-3xl font-mono font-bold text-cyan-400 tracking-wider">
              CYBER CHESS
            </h1>
          </div>
          
          <Button
            onClick={handleNewGame}
            variant="outline"
            size="sm"
            className="border-green-500/50 text-green-400 hover:bg-green-500/10 font-mono"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            NEW GAME
          </Button>
        </motion.div>

        {/* Game Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Game Status */}
          <motion.div 
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GameStatus
              currentTurn={game.currentTurn}
              isCheck={game.isCheck}
              winner={game.winner}
              difficulty={game.difficulty}
            />
          </motion.div>

          {/* Center - Chess Board */}
          <motion.div 
            className="lg:col-span-2 flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <ChessBoard
              board={game.board}
              onMove={handleMove}
              currentTurn={game.currentTurn}
              isPlayerTurn={game.currentTurn === "white" && !isProcessingMove}
            />
          </motion.div>

          {/* Right Sidebar - Captured Pieces */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <CapturedPieces capturedPieces={game.capturedPieces} />
          </motion.div>
        </div>

        {/* Processing Overlay */}
        {isProcessingMove && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-black/80 border border-cyan-500/50 rounded-lg p-6 text-center">
              <div className="text-cyan-400 font-mono text-lg mb-2">
                {game.currentTurn === "white" ? "PROCESSING MOVE..." : "BOT THINKING..."}
              </div>
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
