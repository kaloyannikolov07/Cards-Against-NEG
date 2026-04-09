import PlayerList from "./PlayerList";

function Lobby({ state, onStartGame }) {
  const canStart = state.myId === state.hostId;

  return (
    <div className="container board-container">
      <section className="board-shell lobby-shell" aria-labelledby="lobby-title">
        <header className="board-banner">
          <h1 id="lobby-title">Cards Against NEG</h1>
          <p className="board-subtitle">Gather your friends and start the game</p>
        </header>

        <div className="panel lobby-room-panel">
          <p className="lobby-room-line">
            Room code: <strong>{state.roomCode}</strong>
          </p>
          <p className="lobby-room-hint">Need at least {state.minPlayers} players to start.</p>
        </div>

        <PlayerList
          players={state.players}
          currentJudgeId={state.currentJudgeId}
          hostId={state.hostId}
          variant="scoreboard"
        />

        {canStart ? (
          <button type="button" onClick={onStartGame} disabled={state.players.length < state.minPlayers}>
            Start Game
          </button>
        ) : (
          <p className="lobby-waiting">Waiting for host to start the game...</p>
        )}
      </section>
    </div>
  );
}

export default Lobby;
