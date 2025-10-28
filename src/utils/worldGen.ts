import { BlockType } from '@/store/gameStore';

export const generateChunk = (chunkX: number, chunkZ: number, worldMap: Map<string, BlockType>) => {
  const CHUNK_SIZE = 16;
  
  for (let x = 0; x < CHUNK_SIZE; x++) {
    for (let z = 0; z < CHUNK_SIZE; z++) {
      const worldX = chunkX * CHUNK_SIZE + x;
      const worldZ = chunkZ * CHUNK_SIZE + z;
      
      const height = Math.floor(
        20 + 
        Math.sin(worldX * 0.1) * 5 + 
        Math.cos(worldZ * 0.1) * 5 +
        Math.sin(worldX * 0.05) * Math.cos(worldZ * 0.05) * 8
      );
      
      for (let y = 0; y <= height; y++) {
        const key = `${worldX},${y},${worldZ}`;
        
        if (y === 0) {
          worldMap.set(key, 'bedrock');
        } else if (y === height && height > 18) {
          worldMap.set(key, 'grass');
        } else if (y > height - 4 && height > 18) {
          worldMap.set(key, 'dirt');
        } else if (y <= height - 4 || height <= 18) {
          worldMap.set(key, 'stone');
        }
      }
      
      if (Math.random() > 0.97 && height > 18) {
        const treeHeight = 4 + Math.floor(Math.random() * 3);
        for (let ty = 1; ty <= treeHeight; ty++) {
          worldMap.set(`${worldX},${height + ty},${worldZ}`, 'wood');
        }
        
        for (let lx = -2; lx <= 2; lx++) {
          for (let lz = -2; lz <= 2; lz++) {
            for (let ly = 0; ly < 3; ly++) {
              if (Math.abs(lx) === 2 && Math.abs(lz) === 2 && ly === 0) continue;
              const leafY = height + treeHeight + ly - 1;
              worldMap.set(`${worldX + lx},${leafY},${worldZ + lz}`, 'leaves');
            }
          }
        }
      }
    }
  }
};

export const getBlockTexture = (type: BlockType): string => {
  const colors: Record<BlockType, string> = {
    air: '#000000',
    grass: '#7CB342',
    dirt: '#8D6E63',
    stone: '#757575',
    wood: '#6D4C41',
    planks: '#A1887F',
    leaves: '#4CAF50',
    sand: '#FDD835',
    cobblestone: '#616161',
    bedrock: '#212121',
  };
  return colors[type] || '#FFFFFF';
};
