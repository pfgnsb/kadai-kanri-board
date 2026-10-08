const PRIORITY_LABEL = {
  high: "高",
  medium: "中",
  low: "低",
};

function formatDueDate(dueDate) {
  const [year, month, day] = dueDate.split("-");
  if (!year || !month || !day) {
    return dueDate;
  }
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

function dueDay(dueDate) {
  return new Date(`${dueDate}T00:00:00`);
}

function isOverdue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDay(dueDate) < today;
}

function isDueSoon(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = dueDay(dueDate);
  const lastSoonDay = new Date(today);
  lastSoonDay.setDate(lastSoonDay.getDate() + 2);
  return due >= today && due <= lastSoonDay;
}

export default function CardView({ card, listId, onOpen }) {
  return (
    <article className="card" data-list-id={listId} data-card-id={card.id} onClick={onOpen}>
      <p className="card-title">{card.title}</p>
      <div className="card-meta">
        <span className={`badge badge-${card.priority}`}>
          優先度 {PRIORITY_LABEL[card.priority] ?? card.priority}
        </span>
        {card.dueDate ? (
          <span className={`due${isOverdue(card.dueDate) ? " overdue" : ""}`}>
            {isDueSoon(card.dueDate) ? (
              <span className="due-soon" aria-label="期限が近づいています">
                ⚠
              </span>
            ) : null}
            期限 {formatDueDate(card.dueDate)}
          </span>
        ) : null}
      </div>
      {card.description ? <p className="card-preview">{card.description}</p> : null}
    </article>
  );
}
