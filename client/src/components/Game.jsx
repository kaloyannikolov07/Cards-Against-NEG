import Cards from "./Cards";
import PlayerList from "./PlayerList";

function Game({ state, onSubmitAnswer, onChooseWinner }) {
  const isJudge = state.myId === state.currentJudgeId;

  return (
    <div className="container game-table-wrap">
      <div className="game-table">
        <header className="game-topbar panel">
          <div>
            <h1>Cards Against NEG</h1>
            <p className="topbar-subtitle">Premium party table</p>
          </div>
          <div className="game-meta">
            <span className="meta-pill">Room: {state.roomCode}</span>
            <span className="meta-pill">Round {state.round}</span>
          </div>
        </header>

        <section className="game-main-grid">
          <article className="prompt-zone">
            <p className="zone-label">♠️ Round Challenge</p>
            <div className="card black-card prompt-card">
              <span className="prompt-chip">Prompt</span>
              {state.currentBlackCard}
            </div>
            <p className="game-status-line">
              Judge this round: <strong>{state.currentJudgeName}</strong>
            </p>
          </article>

          <aside className="score-zone">
            <PlayerList
              players={state.players}
              currentJudgeId={state.currentJudgeId}
              hostId={state.hostId}
              variant="scoreboard"
            />
          </aside>
        </section>

        <section className="answers-zone panel">
          {!isJudge && state.status === "answering" && !state.hasSubmitted && (
            <>
              <h3>🃏 Pick your funniest answer</h3>
              <p className="answers-subtitle">Choose one card to play this round.</p>
              <Cards cards={state.myHand} onSelect={onSubmitAnswer} disabled={false} />
            </>
          )}

          {!isJudge && state.status === "answering" && state.hasSubmitted && (
            <p className="game-status-line">You submitted an answer. Waiting for other players...</p>
          )}

          {isJudge && state.status === "answering" && (
            <p className="game-status-line">Waiting for players to submit answers...</p>
          )}

          {isJudge && state.status === "judging" && (
            <>
              <h3>🎯 Pick the funniest/best answer</h3>
              <p className="answers-subtitle">Tap a card to award the point.</p>
              <div className="cards-grid">
                {state.submittedAnswers.map((answer, index) => (
                  <button
                    key={answer.id}
                    type="button"
                    className={`card white-card selectable-card judge-select-card answer-card answer-tilt-${index % 6}`}
                    onClick={() => onChooseWinner(answer.id)}
                  >
                    {answer.cardText}
                  </button>
                ))}
              </div>
            </>
          )}

          {!isJudge && state.status === "judging" && (
            <p className="game-status-line">The judge is choosing a winner...</p>
          )}
          {state.status === "round-end" && (
            <p className="game-status-line">Round ended. Next round starts automatically.</p>
          )}
        </section>
      </div>
    </div>
  );
}

export default Game;
