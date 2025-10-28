import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { generateChunk, getBlockTexture } from '@/utils/worldGen';

const World = () => {
  const { world, setBlock } = useGameStore();

  useEffect(() => {
    const newWorld = new Map(world);
    
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        generateChunk(cx, cz, newWorld);
      }
    }
    
    newWorld.forEach((type, key) => {
      const [x, y, z] = key.split(',').map(Number);
      setBlock(x, y, z, type);
    });
  }, []);

  const blocks = useMemo(() => {
    const blockArray: Array<{ position: [number, number, number]; type: string }> = [];
    
    world.forEach((type, key) => {
      if (type !== 'air') {
        const [x, y, z] = key.split(',').map(Number);
        blockArray.push({ position: [x, y, z], type });
      }
    });
    
    return blockArray;
  }, [world]);

  const instancedMeshes = useMemo(() => {
    const meshes: Record<string, THREE.InstancedMesh> = {};
    const blocksByType: Record<string, Array<[number, number, number]>> = {};
    
    blocks.forEach(({ position, type }) => {
      if (!blocksByType[type]) blocksByType[type] = [];
      blocksByType[type].push(position);
    });
    
    Object.entries(blocksByType).forEach(([type, positions]) => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshLambertMaterial({ 
        color: getBlockTexture(type as any),
        flatShading: true 
      });
      const mesh = new THREE.InstancedMesh(geometry, material, positions.length);
      
      positions.forEach((pos, i) => {
        const matrix = new THREE.Matrix4();
        matrix.setPosition(...pos);
        mesh.setMatrixAt(i, matrix);
      });
      
      mesh.instanceMatrix.needsUpdate = true;
      meshes[type] = mesh;
    });
    
    return meshes;
  }, [blocks]);

  return (
    <>
      {Object.values(instancedMeshes).map((mesh, i) => (
        <primitive key={i} object={mesh} />
      ))}
    </>
  );
};

export default World;
