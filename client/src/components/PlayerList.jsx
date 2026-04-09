function PlayerList({ players, currentJudgeId, hostId, variant = "default" }) {
  const isScoreboard = variant === "scoreboard";

  return (
    <div className={`panel ${isScoreboard ? "scoreboard-panel" : ""}`}>
      <h3>{isScoreboard ? "🎲 Scoreboard" : "Players"}</h3>
      <ul className="player-list">
        {players.map((player, index) => {
          const isJudge = player.id === currentJudgeId;
          const isHost = player.id === hostId;
          const initials = player.name
            .split(" ")
            .map((part) => part.trim()[0])
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <li key={player.id} className={isJudge && isScoreboard ? "judge-row" : ""}>
              {isScoreboard && (
                <span className="player-avatar" aria-hidden="true">
                  {initials || index + 1}
                </span>
              )}
              <span className="player-meta">
                <span className="player-name">{player.name}</span>
                <span className="player-role-badges">
                  {isJudge ? <span className="role-badge judge-badge">Judge</span> : null}
                  {isHost ? <span className="role-badge host-badge">Host</span> : null}
                </span>
              </span>
            <strong>{player.score} pts</strong>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PlayerList;
