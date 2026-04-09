function Cards({ cards, onSelect, disabled }) {
  return (
    <div className="cards-grid">
      {cards.map((card, index) => (
        <button
          key={`${card}-${index}`}
          type="button"
          className={`card white-card selectable-card answer-card answer-tilt-${index % 6}`}
          onClick={() => onSelect(card)}
          disabled={disabled}
        >
          {card}
        </button>
      ))}
    </div>
  );
}

export default Cards;
