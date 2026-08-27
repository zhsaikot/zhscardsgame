import React, { useEffect } from 'react';
import { useGameStore } from './game/useGameStore';
import Lobby from './pages/Lobby';
import GameTable from './pages/GameTable';

function App() {
  const { connect, connected, gameId } = useGameStore();

  useEffect(() => {
    connect();
  }, []);

  return (
    <div className="app">
      {!connected ? (
        <div className="connection-screen">
          <h1>29 Card Game</h1>
          <p>Connecting to server...</p>
        </div>
      ) : !gameId ? (
        <Lobby />
      ) : (
        <GameTable />
      )}
    </div>
  );
}

export default App;
