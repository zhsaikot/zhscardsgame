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
          <div className="connection-logo">29</div>
          <div className="loading-spinner" />
          <h2 className="gold-text" style={{ fontSize: '1.6rem', marginTop: '0.5rem' }}>
            Royal Emerald Club
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Connecting to high-stakes table...
          </p>
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
