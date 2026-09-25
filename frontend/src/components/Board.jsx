import ListColumn from "./ListColumn.jsx";

export default function Board({ board }) {
  return (
    <>
      <header className="topbar">
        <h1 className="board-title">{board.title}</h1>
        <p className="topbar-note">サーバから読み込んだ内容です</p>
      </header>
      <main className="board" aria-label="タスクボード">
        {board.lists.map((list) => (
          <ListColumn key={list.id} list={list} />
        ))}
      </main>
    </>
  );
}
