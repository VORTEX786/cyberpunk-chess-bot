import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Play, Bot, Zap, Crown } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // Add centralized logo URL
  const LOGO_URL = "https://harmless-tapir-303.convex.cloud/api/storage/da2ed97a-9fa4-4aa1-84b2-9d3d6d27cd33";

  const handleGetStarted = () => {
    navigate("/menu");
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Cyberpunk background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 0, 128, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(0, 255, 0, 0.1) 0%, transparent 50%)
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

      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img
              src={LOGO_URL}
              alt="Cyber Chess"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-mono font-bold text-cyan-400 tracking-wider">
              CYBER CHESS
            </span>
          </motion.div>

          {/* Removed login/auth CTA from navbar */}
          <div />
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-7xl md:text-8xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-green-400 mb-6 tracking-wider">
              CYBER CHESS
            </h1>
            
            {/* Glitch effect subtitle */}
            <div className="relative inline-block">
              <div className="text-pink-400 font-mono text-2xl opacity-60 absolute top-0 left-0 animate-pulse"
                   style={{
                     textShadow: '2px 0 0 rgba(255,0,0,0.7), -2px 0 0 rgba(0,255,255,0.7)',
                     animation: 'glitch 3s infinite'
                   }}>
                BATTLE THE AI IN THE DIGITAL REALM
              </div>
              <div className="text-cyan-400 font-mono text-2xl">
                BATTLE THE AI IN THE DIGITAL REALM
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl text-gray-300 font-mono mb-12 leading-relaxed max-w-2xl mx-auto"
          >
            Experience chess like never before in a cyberpunk universe. 
            Challenge our advanced AI across multiple difficulty levels 
            with stunning neon visuals and immersive effects.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-pink-500 text-black font-mono font-bold tracking-wider text-lg px-8 py-4 hover:from-cyan-400 hover:to-pink-400 transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.5)]"
            >
              <Play className="w-5 h-5 mr-2" />
              START PLAYING
            </Button>
            
            <Button
              onClick={() => navigate("/menu")}
              variant="outline"
              size="lg"
              className="border-2 border-cyan-500 text-cyan-400 font-mono font-bold tracking-wider text-lg px-8 py-4 hover:bg-cyan-500/10 transition-all duration-300"
            >
              <Bot className="w-5 h-5 mr-2" />
              VIEW MODES
            </Button>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {[
            {
              icon: Bot,
              title: "AI OPPONENTS",
              description: "Battle against 3 difficulty levels of advanced chess AI",
              color: "text-cyan-400",
              borderColor: "border-cyan-500/50"
            },
            {
              icon: Zap,
              title: "REAL-TIME PLAY",
              description: "Smooth piece movement with instant move validation",
              color: "text-pink-400",
              borderColor: "border-pink-500/50"
            },
            {
              icon: Crown,
              title: "FULL CHESS RULES",
              description: "Complete implementation with check, checkmate & stalemate",
              color: "text-green-400",
              borderColor: "border-green-500/50"
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className={`bg-black/60 border-2 ${feature.borderColor} rounded-lg p-6 backdrop-blur-sm hover:shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all duration-300`}
              >
                <Icon className={`w-12 h-12 ${feature.color} mb-4`} />
                <h3 className={`text-xl font-mono font-bold ${feature.color} mb-3 tracking-wider`}>
                  {feature.title}
                </h3>
                <p className="text-gray-400 font-mono text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </motion.div>

        {/* Chess Board Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 flex justify-center"
        >
          <div className="relative">
            <div className="grid grid-cols-8 gap-0 border-2 border-cyan-400 shadow-[0_0_30px_rgba(0,255,255,0.5)] bg-black/80 backdrop-blur-sm">
              {Array.from({ length: 64 }).map((_, index) => {
                const row = Math.floor(index / 8);
                const col = index % 8;
                const isLight = (row + col) % 2 === 0;
                
                return (
                  <div
                    key={index}
                    className={`w-8 h-8 ${isLight ? 'bg-gray-800/60' : 'bg-gray-900/60'} border border-gray-700/50`}
                  />
                );
              })}
            </div>
            
            {/* Floating pieces animation */}
            <div className="absolute inset-0 pointer-events-none">
              {['♔', '♛', '♜', '♝', '♞', '♟'].map((piece, index) => (
                <motion.div
                  key={index}
                  className="absolute text-2xl text-cyan-400 drop-shadow-[0_0_8px_rgba(0,255,255,0.8)]"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: index * 0.3,
                  }}
                >
                  {piece}
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800 bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <img
                src={LOGO_URL}
                alt="Cyber Chess"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-mono font-bold text-cyan-400 tracking-wider">
                CYBER CHESS
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-400 font-mono text-sm">
                Made By Ziaul
              </span>
            </div>
          </div>
        </div>
      </footer>

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