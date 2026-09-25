import CardView from "./CardView.jsx";

export default function ListColumn({ list }) {
  return (
    <section className="list">
      <div className="list-header">
        <h2 className="list-title">{list.title}</h2>
      </div>
      <div className="cards">
        {list.cards.length === 0 ? (
          <p className="empty-hint">カードはまだありません</p>
        ) : (
          list.cards.map((card) => <CardView key={card.id} card={card} />)
        )}
      </div>
    </section>
  );
}
