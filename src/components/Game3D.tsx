import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import Player from './Player';
import World from './World';
import PlayerHand from './PlayerHand';
import HUD from './HUD';
import { useMultiplayer } from '@/hooks/useMultiplayer';

const Game3D = () => {
  useMultiplayer();
  
  return (
    <div className="w-screen h-screen bg-black">
      <Canvas
        camera={{ 
          fov: 75, 
          near: 0.1, 
          far: 1000,
          position: [0, 32, 0]
        }}
        onCreated={({ gl }) => {
          gl.setClearColor('#87CEEB');
        }}
      >
        <Sky sunPosition={[100, 100, 100]} />
        
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[50, 50, 50]} 
          intensity={0.8}
          castShadow
        />
        
        <Player />
        <World />
        
        <group position={[0, 0, 0]}>
          <PlayerHand />
        </group>
        
        <fog attach="fog" args={['#87CEEB', 50, 150]} />
      </Canvas>
      
      <HUD />
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-white text-center bg-black/50 p-4 rounded pointer-events-auto" id="click-to-play">
          <p className="text-xl mb-2">Нажмите чтобы начать</p>
          <p className="text-sm">ESC - выйти из управления</p>
        </div>
      </div>
    </div>
  );
};

export default Game3D;