import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

type BlockType = 'air' | 'grass' | 'dirt' | 'stone' | 'wood' | 'leaves' | 'sand' | 'water';

interface Block {
  type: BlockType;
}

interface CraftRecipe {
  name: string;
  result: BlockType;
  ingredients: { type: BlockType; count: number }[];
  icon: string;
}

interface Player {
  x: number;
  y: number;
  health: number;
  hunger: number;
  inventory: Record<BlockType, number>;
}

const CHUNK_SIZE = 32;
const BLOCK_SIZE = 16;
const VIEW_HEIGHT = 20;

const blockColors: Record<BlockType, string> = {
  air: 'transparent',
  grass: '#7CB342',
  dirt: '#8D6E63',
  stone: '#616161',
  wood: '#795548',
  leaves: '#4CAF50',
  sand: '#FFD54F',
  water: '#2196F3',
};

const craftingRecipes: CraftRecipe[] = [
  { name: 'Доски', result: 'wood', ingredients: [{ type: 'wood', count: 1 }], icon: '🪵' },
  { name: 'Инструменты', result: 'stone', ingredients: [{ type: 'wood', count: 2 }, { type: 'stone', count: 3 }], icon: '⛏️' },
];

const Game = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [world, setWorld] = useState<Block[][]>([]);
  const [player, setPlayer] = useState<Player>({
    x: 16,
    y: 10,
    health: 100,
    hunger: 100,
    inventory: { air: 0, grass: 10, dirt: 5, stone: 3, wood: 8, leaves: 0, sand: 2, water: 0 },
  });
  const [selectedBlock, setSelectedBlock] = useState<BlockType>('grass');
  const [showMenu, setShowMenu] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [cameraX, setCameraX] = useState(0);
  const [cameraY, setCameraY] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const generateWorld = useCallback(() => {
    const newWorld: Block[][] = [];
    for (let y = 0; y < VIEW_HEIGHT; y++) {
      newWorld[y] = [];
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const height = Math.floor(10 + Math.sin(x * 0.3) * 3 + Math.cos(x * 0.5) * 2);
        
        if (y > height) {
          if (y > height + 3) {
            newWorld[y][x] = { type: 'stone' };
          } else {
            newWorld[y][x] = { type: 'dirt' };
          }
        } else if (y === height) {
          newWorld[y][x] = { type: Math.random() > 0.8 ? 'sand' : 'grass' };
        } else if (y === height - 1 && Math.random() > 0.85) {
          newWorld[y][x] = { type: 'wood' };
        } else if (y < height - 1 && y > height - 4 && Math.random() > 0.7) {
          newWorld[y][x] = { type: 'leaves' };
        } else {
          newWorld[y][x] = { type: 'air' };
        }
      }
    }
    return newWorld;
  }, []);

  useEffect(() => {
    if (gameStarted) {
      setWorld(generateWorld());
    }
  }, [gameStarted, generateWorld]);

  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      setTimeOfDay((prev) => (prev + 1) % 24000);
      setPlayer((prev) => ({
        ...prev,
        hunger: Math.max(0, prev.hunger - 0.1),
        health: prev.hunger < 20 ? Math.max(0, prev.health - 0.2) : Math.min(100, prev.health + 0.1),
      }));
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted]);

  useEffect(() => {
    if (!canvasRef.current || !gameStarted) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const dayProgress = timeOfDay / 24000;
    const skyColor = dayProgress < 0.25 || dayProgress > 0.75
      ? '#1A237E'
      : dayProgress < 0.5
      ? '#64B5F6'
      : '#FF6F00';

    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const viewWidth = Math.floor(canvas.width / BLOCK_SIZE);
    const viewHeight = Math.floor(canvas.height / BLOCK_SIZE);

    for (let y = 0; y < Math.min(VIEW_HEIGHT, viewHeight); y++) {
      for (let x = 0; x < Math.min(CHUNK_SIZE, viewWidth); x++) {
        if (world[y] && world[y][x]) {
          const block = world[y][x];
          if (block.type !== 'air') {
            ctx.fillStyle = blockColors[block.type];
            ctx.fillRect(
              x * BLOCK_SIZE - cameraX,
              y * BLOCK_SIZE - cameraY,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.strokeRect(
              x * BLOCK_SIZE - cameraX,
              y * BLOCK_SIZE - cameraY,
              BLOCK_SIZE,
              BLOCK_SIZE
            );
          }
        }
      }
    }

    ctx.fillStyle = '#FF5722';
    ctx.fillRect(
      player.x * BLOCK_SIZE - cameraX,
      player.y * BLOCK_SIZE - cameraY,
      BLOCK_SIZE,
      BLOCK_SIZE
    );
    ctx.fillStyle = '#000';
    ctx.fillRect(
      player.x * BLOCK_SIZE - cameraX + 4,
      player.y * BLOCK_SIZE - cameraY + 4,
      3,
      3
    );
    ctx.fillRect(
      player.x * BLOCK_SIZE - cameraX + 9,
      player.y * BLOCK_SIZE - cameraY + 4,
      3,
      3
    );
  }, [world, player, cameraX, cameraY, timeOfDay, gameStarted]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left + cameraX) / BLOCK_SIZE);
    const y = Math.floor((e.clientY - rect.top + cameraY) / BLOCK_SIZE);

    if (y >= 0 && y < VIEW_HEIGHT && x >= 0 && x < CHUNK_SIZE) {
      const newWorld = [...world];
      if (e.shiftKey) {
        if (newWorld[y][x].type !== 'air') {
          const blockType = newWorld[y][x].type;
          setPlayer((prev) => ({
            ...prev,
            inventory: { ...prev.inventory, [blockType]: prev.inventory[blockType] + 1 },
          }));
          newWorld[y][x] = { type: 'air' };
        }
      } else {
        if (newWorld[y][x].type === 'air' && player.inventory[selectedBlock] > 0) {
          newWorld[y][x] = { type: selectedBlock };
          setPlayer((prev) => ({
            ...prev,
            inventory: { ...prev.inventory, [selectedBlock]: prev.inventory[selectedBlock] - 1 },
          }));
        }
      }
      setWorld(newWorld);
    }
  };

  const movePlayer = (dx: number, dy: number) => {
    setPlayer((prev) => ({
      ...prev,
      x: Math.max(0, Math.min(CHUNK_SIZE - 1, prev.x + dx)),
      y: Math.max(0, Math.min(VIEW_HEIGHT - 1, prev.y + dy)),
    }));
    setCameraX((prev) => prev + dx * BLOCK_SIZE);
    setCameraY((prev) => prev + dy * BLOCK_SIZE);
  };

  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'w' || e.key === 'ArrowUp') movePlayer(0, -1);
      if (e.key === 's' || e.key === 'ArrowDown') movePlayer(0, 1);
      if (e.key === 'a' || e.key === 'ArrowLeft') movePlayer(-1, 0);
      if (e.key === 'd' || e.key === 'ArrowRight') movePlayer(1, 0);
      if (e.key === 'e') setShowInventory((prev) => !prev);
      if (e.key === 'Escape') setShowMenu(true);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameStarted]);

  const craft = (recipe: CraftRecipe) => {
    const canCraft = recipe.ingredients.every(
      (ing) => player.inventory[ing.type] >= ing.count
    );

    if (canCraft) {
      const newInventory = { ...player.inventory };
      recipe.ingredients.forEach((ing) => {
        newInventory[ing.type] -= ing.count;
      });
      newInventory[recipe.result] = (newInventory[recipe.result] || 0) + 1;
      setPlayer((prev) => ({ ...prev, inventory: newInventory }));
    }
  };

  if (!gameStarted) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-b from-[#64B5F6] to-[#7CB342]">
        <Card className="p-8 bg-[#3E2723] border-4 border-[#212121] shadow-2xl">
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-bold text-white mb-4" style={{ textShadow: '4px 4px 0 #000' }}>
              VOXEL CRAFT
            </h1>
            <div className="text-sm text-white/80 space-y-2 mb-6">
              <p>🎮 WASD / Стрелки - движение</p>
              <p>🖱️ Клик - поставить блок</p>
              <p>⇧ Shift + Клик - разрушить</p>
              <p>📦 E - инвентарь</p>
            </div>
            <Button
              onClick={() => {
                setGameStarted(true);
                setShowMenu(false);
              }}
              className="w-full bg-[#7CB342] hover:bg-[#689F38] text-white border-4 border-[#558B2F] text-xl py-6"
            >
              НАЧАТЬ ИГРУ
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen relative overflow-hidden">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 cursor-crosshair"
      />

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between pointer-events-none z-10">
        <div className="space-y-2 pointer-events-auto">
          <Card className="p-3 bg-[#3E2723]/90 border-2 border-[#212121]">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Heart" className="text-red-500" size={16} />
              <Progress value={player.health} className="w-32 h-3" />
              <span className="text-white text-xs">{Math.floor(player.health)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="Apple" className="text-orange-500" size={16} />
              <Progress value={player.hunger} className="w-32 h-3" />
              <span className="text-white text-xs">{Math.floor(player.hunger)}</span>
            </div>
          </Card>

          <Card className="p-2 bg-[#3E2723]/90 border-2 border-[#212121]">
            <div className="flex gap-1">
              {(['grass', 'dirt', 'stone', 'wood', 'sand'] as BlockType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedBlock(type)}
                  className={`w-10 h-10 border-2 ${
                    selectedBlock === type ? 'border-white' : 'border-[#212121]'
                  }`}
                  style={{ backgroundColor: blockColors[type] }}
                >
                  <span className="text-xs text-white">{player.inventory[type]}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="pointer-events-auto space-y-2">
          <Button
            onClick={() => setShowMenu(!showMenu)}
            className="bg-[#3E2723] hover:bg-[#5D4037] border-2 border-[#212121]"
            size="icon"
          >
            <Icon name="Menu" size={20} />
          </Button>
          <Button
            onClick={() => setShowInventory(!showInventory)}
            className="bg-[#3E2723] hover:bg-[#5D4037] border-2 border-[#212121]"
            size="icon"
          >
            <Icon name="Package" size={20} />
          </Button>
        </div>
      </div>

      {isMobile && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-between z-10">
          <div className="grid grid-cols-3 gap-2">
            <div></div>
            <Button onClick={() => movePlayer(0, -1)} size="icon" className="bg-[#3E2723]/80">
              <Icon name="ArrowUp" size={24} />
            </Button>
            <div></div>
            <Button onClick={() => movePlayer(-1, 0)} size="icon" className="bg-[#3E2723]/80">
              <Icon name="ArrowLeft" size={24} />
            </Button>
            <Button onClick={() => movePlayer(0, 1)} size="icon" className="bg-[#3E2723]/80">
              <Icon name="ArrowDown" size={24} />
            </Button>
            <Button onClick={() => movePlayer(1, 0)} size="icon" className="bg-[#3E2723]/80">
              <Icon name="ArrowRight" size={24} />
            </Button>
          </div>
        </div>
      )}

      {showInventory && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
          <Card className="w-full max-w-2xl mx-4 bg-[#3E2723] border-4 border-[#212121] p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">ИНВЕНТАРЬ</h2>
              <Button
                onClick={() => setShowInventory(false)}
                variant="ghost"
                size="icon"
                className="text-white"
              >
                <Icon name="X" size={24} />
              </Button>
            </div>

            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="inventory">Предметы</TabsTrigger>
                <TabsTrigger value="crafting">Крафт</TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="space-y-2">
                {Object.entries(player.inventory).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 bg-[#5D4037] rounded border-2 border-[#212121]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 border-2 border-[#212121]"
                        style={{ backgroundColor: blockColors[type as BlockType] }}
                      />
                      <span className="text-white capitalize">{type}</span>
                    </div>
                    <span className="text-white font-bold">x{count}</span>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="crafting" className="space-y-2">
                {craftingRecipes.map((recipe, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#5D4037] rounded border-2 border-[#212121]"
                  >
                    <div>
                      <div className="text-white font-bold mb-1">
                        {recipe.icon} {recipe.name}
                      </div>
                      <div className="text-xs text-white/70">
                        {recipe.ingredients.map((ing, i) => (
                          <span key={i}>
                            {ing.type} x{ing.count}
                            {i < recipe.ingredients.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => craft(recipe)}
                      className="bg-[#7CB342] hover:bg-[#689F38]"
                      size="sm"
                    >
                      Создать
                    </Button>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}

      {showMenu && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
          <Card className="p-8 bg-[#3E2723] border-4 border-[#212121]">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">МЕНЮ</h2>
            <div className="space-y-3">
              <Button
                onClick={() => setShowMenu(false)}
                className="w-full bg-[#7CB342] hover:bg-[#689F38]"
              >
                Продолжить
              </Button>
              <Button
                onClick={() => {
                  setGameStarted(false);
                  setShowMenu(false);
                }}
                className="w-full bg-[#FF5722] hover:bg-[#E64A19]"
              >
                Выход
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Game;
