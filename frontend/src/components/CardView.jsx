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

function isOverdue(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${dueDate}T00:00:00`) < today;
}

export default function CardView({ card }) {
  return (
    <article className="card">
      <p className="card-title">{card.title}</p>
      <div className="card-meta">
        <span className={`badge badge-${card.priority}`}>
          優先度 {PRIORITY_LABEL[card.priority] ?? card.priority}
        </span>
        {card.dueDate ? (
          <span className={`due${isOverdue(card.dueDate) ? " overdue" : ""}`}>
            期限 {formatDueDate(card.dueDate)}
          </span>
        ) : null}
      </div>
      {card.description ? <p className="card-preview">{card.description}</p> : null}
    </article>
  );
}
