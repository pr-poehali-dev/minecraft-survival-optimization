import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';

const MULTIPLAYER_URL = 'https://functions.poehali.dev/ed6912fe-b764-44da-bc83-a41770c62099';

export const useMultiplayer = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { currentPlayer, updatePlayerPosition } = useGameStore();

  useEffect(() => {
    const syncPlayers = async () => {
      try {
        const response = await fetch(MULTIPLAYER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'getPlayers' }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.players && Array.isArray(data.players)) {
            data.players.forEach((player: any) => {
              if (player.id !== 'local') {
                updatePlayerPosition(player.id, player.position);
              }
            });
          }
        }
      } catch (error) {
        console.error('Failed to sync players:', error);
      }
    };

    const updatePosition = async () => {
      if (!currentPlayer) return;

      try {
        await fetch(MULTIPLAYER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updatePosition',
            position: currentPlayer.position,
            rotation: currentPlayer.rotation,
          }),
        });
      } catch (error) {
        console.error('Failed to update position:', error);
      }
    };

    intervalRef.current = setInterval(() => {
      updatePosition();
      syncPlayers();
    }, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentPlayer]);

  return null;
};
