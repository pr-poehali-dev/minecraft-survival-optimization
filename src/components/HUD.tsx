import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGameStore } from '@/store/gameStore';
import { getBlockTexture } from '@/utils/worldGen';
import Icon from '@/components/ui/icon';

const HUD = () => {
  const { currentPlayer, inventory, setSelectedSlot } = useGameStore();
  const selectedSlot = currentPlayer?.selectedSlot || 0;

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        setSelectedSlot(num - 1);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newSlot = e.deltaY > 0 
        ? (selectedSlot + 1) % 9 
        : (selectedSlot - 1 + 9) % 9;
      setSelectedSlot(newSlot);
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedSlot]);

  if (!currentPlayer) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute top-4 left-4 pointer-events-auto">
        <Card className="p-3 bg-[#3E2723]/80 border-2 border-[#212121]">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Heart" className="text-red-500" size={16} />
            <Progress value={currentPlayer.health} className="w-32 h-3" />
            <span className="text-white text-xs">{Math.floor(currentPlayer.health)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Icon name="Apple" className="text-orange-500" size={16} />
            <Progress value={currentPlayer.hunger} className="w-32 h-3" />
            <span className="text-white text-xs">{Math.floor(currentPlayer.hunger)}</span>
          </div>
        </Card>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
        <div className="w-6 h-6 relative">
          <div className="absolute left-1/2 top-1/2 w-0.5 h-4 bg-white -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-4 h-0.5 bg-white -translate-x-1/2 -translate-y-1/2"></div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <Card className="p-2 bg-[#3E2723]/90 border-2 border-[#212121]">
          <div className="flex gap-1">
            {inventory.slice(0, 9).map((blockType, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSlot(idx)}
                className={`w-12 h-12 border-2 relative ${
                  selectedSlot === idx ? 'border-white' : 'border-[#424242]'
                }`}
                style={{ backgroundColor: blockType !== 'air' ? getBlockTexture(blockType) : '#1A1A1A' }}
              >
                <span className="absolute bottom-0 right-1 text-white text-xs font-bold" 
                      style={{ textShadow: '1px 1px 0 #000' }}>
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="absolute top-1/2 left-4 -translate-y-1/2 text-white text-xs" 
           style={{ textShadow: '1px 1px 2px #000' }}>
        <p>W/A/S/D - движение</p>
        <p>Пробел - прыжок</p>
        <p>Shift - красться</p>
        <p>ЛКМ - разрушить</p>
        <p>ПКМ - поставить</p>
        <p>1-9 - выбор блока</p>
        <p>Колесо - переключение</p>
      </div>
    </div>
  );
};

export default HUD;
