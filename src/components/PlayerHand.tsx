import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { getBlockTexture } from '@/utils/worldGen';

const PlayerHand = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { currentPlayer, inventory } = useGameStore();
  const selectedSlot = currentPlayer?.selectedSlot || 0;
  const selectedBlock = inventory[selectedSlot];
  
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.elapsedTime;
      meshRef.current.position.y = -0.5 + Math.sin(time * 8) * 0.02;
      meshRef.current.rotation.y = Math.sin(time * 4) * 0.01;
    }
  });

  if (selectedBlock === 'air') return null;

  return (
    <mesh
      ref={meshRef}
      position={[0.3, -0.5, -0.5]}
      rotation={[0, Math.PI / 6, 0]}
    >
      <boxGeometry args={[0.15, 0.15, 0.15]} />
      <meshLambertMaterial color={getBlockTexture(selectedBlock)} />
    </mesh>
  );
};

export default PlayerHand;
