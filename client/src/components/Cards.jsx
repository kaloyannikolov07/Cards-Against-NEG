function Cards({ cards, onSelect, disabled }) {
  const suits = ["♠️", "♥️", "♣️", "♦️"];
  
  return (
    <div className="cards-grid">
      {cards.map((card, index) => {
        const suit = suits[index % 4];
        return (
          <button
            key={`${card}-${index}`}
            type="button"
            className={`card white-card selectable-card answer-card answer-tilt-${index % 6}`}
            onClick={() => onSelect(card)}
            disabled={disabled}
          >
            <span className="card-suit-top-left">{suit}</span>
            {card}
            <span className="card-suit-bottom-right">{suit}</span>
          </button>
        );
      })}
    </div>
  );
}

export default Cards;
