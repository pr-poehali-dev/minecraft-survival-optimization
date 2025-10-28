import { create } from 'zustand';

export type BlockType = 'air' | 'grass' | 'dirt' | 'stone' | 'wood' | 'planks' | 'leaves' | 'sand' | 'cobblestone' | 'bedrock';

export interface Block {
  type: BlockType;
}

export interface Player {
  id: string;
  position: [number, number, number];
  rotation: [number, number];
  username: string;
  health: number;
  hunger: number;
  selectedSlot: number;
}

export interface GameState {
  world: Map<string, BlockType>;
  players: Map<string, Player>;
  currentPlayer: Player | null;
  inventory: BlockType[];
  
  setBlock: (x: number, y: number, z: number, type: BlockType) => void;
  getBlock: (x: number, y: number, z: number) => BlockType;
  removeBlock: (x: number, y: number, z: number) => void;
  
  setCurrentPlayer: (player: Player) => void;
  updatePlayerPosition: (id: string, position: [number, number, number]) => void;
  updatePlayerRotation: (id: string, rotation: [number, number]) => void;
  
  setSelectedSlot: (slot: number) => void;
  addToInventory: (type: BlockType) => void;
  removeFromInventory: (slot: number) => void;
}

const blockKey = (x: number, y: number, z: number) => `${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`;

export const useGameStore = create<GameState>((set, get) => ({
  world: new Map(),
  players: new Map(),
  currentPlayer: {
    id: 'local',
    position: [0, 32, 0],
    rotation: [0, 0],
    username: 'Player',
    health: 100,
    hunger: 100,
    selectedSlot: 0,
  },
  inventory: ['grass', 'dirt', 'stone', 'wood', 'planks', 'cobblestone', 'sand', 'leaves', 'air'],
  
  setBlock: (x, y, z, type) => {
    set((state) => {
      const newWorld = new Map(state.world);
      newWorld.set(blockKey(x, y, z), type);
      return { world: newWorld };
    });
  },
  
  getBlock: (x, y, z) => {
    return get().world.get(blockKey(x, y, z)) || 'air';
  },
  
  removeBlock: (x, y, z) => {
    set((state) => {
      const newWorld = new Map(state.world);
      newWorld.delete(blockKey(x, y, z));
      return { world: newWorld };
    });
  },
  
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
  
  updatePlayerPosition: (id, position) => {
    set((state) => {
      const newPlayers = new Map(state.players);
      const player = newPlayers.get(id);
      if (player) {
        newPlayers.set(id, { ...player, position });
      }
      return { 
        players: newPlayers,
        currentPlayer: id === 'local' ? { ...state.currentPlayer!, position } : state.currentPlayer
      };
    });
  },
  
  updatePlayerRotation: (id, rotation) => {
    set((state) => {
      const newPlayers = new Map(state.players);
      const player = newPlayers.get(id);
      if (player) {
        newPlayers.set(id, { ...player, rotation });
      }
      return { 
        players: newPlayers,
        currentPlayer: id === 'local' ? { ...state.currentPlayer!, rotation } : state.currentPlayer
      };
    });
  },
  
  setSelectedSlot: (slot) => {
    set((state) => ({
      currentPlayer: state.currentPlayer ? { ...state.currentPlayer, selectedSlot: slot } : null
    }));
  },
  
  addToInventory: (type) => {
    set((state) => {
      const emptySlot = state.inventory.findIndex(item => item === 'air');
      if (emptySlot !== -1) {
        const newInventory = [...state.inventory];
        newInventory[emptySlot] = type;
        return { inventory: newInventory };
      }
      return state;
    });
  },
  
  removeFromInventory: (slot) => {
    set((state) => {
      const newInventory = [...state.inventory];
      newInventory[slot] = 'air';
      return { inventory: newInventory };
    });
  },
}));
