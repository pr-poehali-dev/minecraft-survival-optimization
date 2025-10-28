import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';

const Player = () => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const { currentPlayer, updatePlayerPosition, getBlock, setBlock, removeBlock, inventory } = useGameStore();
  
  const moveState = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sneak: false,
  });

  const raycaster = new THREE.Raycaster();
  const selectedSlot = currentPlayer?.selectedSlot || 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': moveState.current.forward = true; break;
        case 'KeyS': moveState.current.backward = true; break;
        case 'KeyA': moveState.current.left = true; break;
        case 'KeyD': moveState.current.right = true; break;
        case 'Space': moveState.current.jump = true; break;
        case 'ShiftLeft': moveState.current.sneak = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': moveState.current.forward = false; break;
        case 'KeyS': moveState.current.backward = false; break;
        case 'KeyA': moveState.current.left = false; break;
        case 'KeyD': moveState.current.right = false; break;
        case 'Space': moveState.current.jump = false; break;
        case 'ShiftLeft': moveState.current.sneak = false; break;
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!controlsRef.current?.isLocked) return;
      
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects: any[] = [];
      
      if (e.button === 0) {
        const blockToRemove = findTargetBlock(5);
        if (blockToRemove) {
          const [x, y, z] = blockToRemove;
          const blockType = getBlock(x, y, z);
          removeBlock(x, y, z);
          if (blockType !== 'air' && blockType !== 'bedrock') {
            useGameStore.getState().addToInventory(blockType);
          }
        }
      } else if (e.button === 2) {
        const placePos = findPlacePosition(5);
        if (placePos && inventory[selectedSlot] !== 'air') {
          const [x, y, z] = placePos;
          setBlock(x, y, z, inventory[selectedSlot]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleClick);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleClick);
    };
  }, [camera, inventory, selectedSlot]);

  const findTargetBlock = (maxDistance: number): [number, number, number] | null => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const position = camera.position.clone();
    
    for (let i = 0; i < maxDistance * 10; i++) {
      position.add(direction.clone().multiplyScalar(0.1));
      const x = Math.floor(position.x);
      const y = Math.floor(position.y);
      const z = Math.floor(position.z);
      
      if (getBlock(x, y, z) !== 'air') {
        return [x, y, z];
      }
    }
    return null;
  };

  const findPlacePosition = (maxDistance: number): [number, number, number] | null => {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const position = camera.position.clone();
    let lastAir: [number, number, number] | null = null;
    
    for (let i = 0; i < maxDistance * 10; i++) {
      position.add(direction.clone().multiplyScalar(0.1));
      const x = Math.floor(position.x);
      const y = Math.floor(position.y);
      const z = Math.floor(position.z);
      
      if (getBlock(x, y, z) === 'air') {
        lastAir = [x, y, z];
      } else if (lastAir) {
        return lastAir;
      }
    }
    return null;
  };

  useFrame((state, delta) => {
    if (!controlsRef.current?.isLocked || !currentPlayer) return;

    const speed = moveState.current.sneak ? 2 : 4.3;
    const direction = directionRef.current;
    
    direction.set(0, 0, 0);
    
    if (moveState.current.forward) direction.z -= 1;
    if (moveState.current.backward) direction.z += 1;
    if (moveState.current.left) direction.x -= 1;
    if (moveState.current.right) direction.x += 1;
    
    direction.normalize();
    direction.applyQuaternion(camera.quaternion);
    direction.y = 0;
    
    const velocity = velocityRef.current;
    velocity.x = direction.x * speed * delta;
    velocity.z = direction.z * speed * delta;
    
    velocity.y -= 20 * delta;
    
    if (moveState.current.jump && Math.abs(velocity.y) < 0.1) {
      velocity.y = 8;
    }
    
    const newPos = camera.position.clone().add(velocity);
    
    const groundY = getGroundHeight(newPos.x, newPos.z);
    if (newPos.y < groundY + 1.6) {
      newPos.y = groundY + 1.6;
      velocity.y = 0;
    }
    
    camera.position.copy(newPos);
    updatePlayerPosition('local', [newPos.x, newPos.y, newPos.z]);
  });

  const getGroundHeight = (x: number, z: number): number => {
    for (let y = 50; y >= 0; y--) {
      if (getBlock(Math.floor(x), y, Math.floor(z)) !== 'air') {
        return y + 1;
      }
    }
    return 0;
  };

  useEffect(() => {
    if (currentPlayer) {
      camera.position.set(...currentPlayer.position);
    }
  }, []);

  return <PointerLockControls ref={controlsRef} />;
};

export default Player;
