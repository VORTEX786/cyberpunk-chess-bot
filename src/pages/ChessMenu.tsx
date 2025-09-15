import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Zap, Target, Skull, Play, ArrowLeft } from "lucide-react";

export default function ChessMenu() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const createGame = useMutation(api.chess.createGame);
  const [isCreating, setIsCreating] = useState(false);

  const difficulties = [
    {
      id: "easy" as const,
      name: "EASY",
      description: "Random moves, perfect for beginners",
      icon: Zap,
      color: "text-green-400",
      borderColor: "border-green-500/50",
      shadowColor: "shadow-[0_0_15px_rgba(0,255,0,0.3)]",
    },
    {
      id: "medium" as const,
      name: "MEDIUM",
      description: "Basic strategy, good for practice",
      icon: Target,
      color: "text-yellow-400",
      borderColor: "border-yellow-500/50",
      shadowColor: "shadow-[0_0_15px_rgba(255,255,0,0.3)]",
    },
    {
      id: "hard" as const,
      name: "HARD",
      description: "Advanced AI, prepare for battle",
      icon: Skull,
      color: "text-red-400",
      borderColor: "border-red-500/50",
      shadowColor: "shadow-[0_0_15px_rgba(255,0,0,0.3)]",
    },
  ];

  const handleStartGame = async (difficulty: "easy" | "medium" | "hard") => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    setIsCreating(true);
    try {
      const gameId = await createGame({ difficulty });
      toast.success(`Game created! Difficulty: ${difficulty.toUpperCase()}`);
      navigate(`/chess/${gameId}`);
    } catch (error) {
      console.error("Failed to create game:", error);
      toast.error("Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(0, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 0, 128, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(0, 255, 0, 0.1) 0%, transparent 50%)
          `,
        }} />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Scan lines */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)',
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            size="sm"
            className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 font-mono mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO HOME
          </Button>

          <h1 className="text-6xl font-mono font-bold text-cyan-400 mb-4 tracking-wider">
            CYBER CHESS
          </h1>
          <div className="text-xl text-gray-400 font-mono tracking-wide">
            SELECT YOUR OPPONENT
          </div>
          
          {/* Glitch effect on title */}
          <div className="relative inline-block mt-4">
            <div className="text-pink-400 font-mono text-lg opacity-60 absolute top-0 left-0 animate-pulse"
                 style={{
                   textShadow: '2px 0 0 rgba(255,0,0,0.7), -2px 0 0 rgba(0,255,255,0.7)',
                   animation: 'glitch 2s infinite'
                 }}>
              CHOOSE WISELY...
            </div>
            <div className="text-cyan-400 font-mono text-lg">
              CHOOSE WISELY...
            </div>
          </div>
        </motion.div>

        {/* Difficulty Selection */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {difficulties.map((difficulty, index) => {
              const Icon = difficulty.icon;
              return (
                <motion.div
                  key={difficulty.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card className={`
                    bg-black/60 backdrop-blur-sm border-2 ${difficulty.borderColor} 
                    hover:${difficulty.shadowColor} transition-all duration-300 
                    cursor-pointer group h-full
                  `}>
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-4">
                        <div className={`
                          p-4 rounded-full border-2 ${difficulty.borderColor} 
                          ${difficulty.color} group-hover:scale-110 transition-transform duration-300
                        `}>
                          <Icon className="w-8 h-8" />
                        </div>
                      </div>
                      <CardTitle className={`text-2xl font-mono font-bold ${difficulty.color} tracking-wider`}>
                        {difficulty.name}
                      </CardTitle>
                      <CardDescription className="text-gray-400 font-mono">
                        {difficulty.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      <Button
                        onClick={() => handleStartGame(difficulty.id)}
                        disabled={isCreating}
                        className={`
                          w-full font-mono font-bold tracking-wider
                          bg-transparent border-2 ${difficulty.borderColor} ${difficulty.color}
                          hover:bg-gradient-to-r hover:from-black/50 hover:to-transparent
                          disabled:opacity-50 disabled:cursor-not-allowed
                          transition-all duration-300
                        `}
                        variant="outline"
                      >
                        {isCreating ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            CREATING...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            START BATTLE
                          </div>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bot Info */}
        <motion.div 
          className="max-w-2xl mx-auto mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <div className="bg-black/60 border border-gray-600/30 rounded-lg p-6 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Bot className="w-6 h-6 text-cyan-400" />
              <h3 className="text-xl font-mono font-bold text-cyan-400 tracking-wider">
                AI OPPONENT
              </h3>
            </div>
            <p className="text-gray-400 font-mono text-sm leading-relaxed">
              Face off against our advanced chess AI. Each difficulty level uses different 
              strategies and thinking patterns. Will you outsmart the machine?
            </p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  );
}
