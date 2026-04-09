import PlayerList from "./PlayerList";

function EndScreen({ state, onStartGame }) {
  const canRestart = state.myId === state.hostId;
  const winnerNames = state.winners.map((winner) => winner.name).join(", ");

  return (
    <div className="container board-container">
      <section className="board-shell end-shell" aria-labelledby="end-title">
        <header className="board-banner end-banner">
          <p className="end-flags" aria-hidden="true">
            🏁 🏆 🏁
          </p>
          <h1 id="end-title">Game Over</h1>
          <p className="board-subtitle">Final table results after {state.maxRounds} rounds</p>
        </header>

        <div className="panel end-winner-panel">
          <h2>🏆 Winners</h2>
          <p>{winnerNames || "No winners this time."}</p>
        </div>

        <PlayerList
          players={state.players}
          currentJudgeId={state.currentJudgeId}
          hostId={state.hostId}
          variant="scoreboard"
        />

        {canRestart ? (
          <button type="button" onClick={onStartGame} disabled={state.players.length < state.minPlayers}>
            Start New Game
          </button>
        ) : (
          <p className="lobby-waiting">Waiting for host to start a new game...</p>
        )}
      </section>
    </div>
  );
}

export default EndScreen;
