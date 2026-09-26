package com.nsb.taskboard.board;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlParameterValue;
import org.springframework.stereotype.Repository;

@Repository
public class BoardRepository {

	private final JdbcTemplate jdbcTemplate;

	public BoardRepository(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	public Optional<BoardResponse> findBoard() {
		List<BoardRow> boards = jdbcTemplate.query(
			"SELECT id, title FROM boards ORDER BY created_at LIMIT 1",
			(rs, rowNum) -> new BoardRow(rs.getObject("id", UUID.class), rs.getString("title"))
		);
		if (boards.isEmpty()) {
			return Optional.empty();
		}

		BoardRow board = boards.get(0);
		List<ListRow> lists = jdbcTemplate.query(
			"SELECT id, title, position FROM lists WHERE board_id = ? ORDER BY position",
			(rs, rowNum) -> new ListRow(
				rs.getObject("id", UUID.class),
				rs.getString("title"),
				rs.getInt("position")
			),
			board.id()
		);
		List<CardRow> cards = jdbcTemplate.query(
			"""
			SELECT id, list_id, title, description, priority, due_date, position
			FROM cards
			WHERE list_id IN (SELECT id FROM lists WHERE board_id = ?)
			ORDER BY position
			""",
			this::mapCard,
			board.id()
		);

		Map<UUID, List<CardResponse>> cardsByList = new LinkedHashMap<>();
		for (CardRow card : cards) {
			cardsByList
				.computeIfAbsent(card.listId(), id -> new ArrayList<>())
				.add(new CardResponse(
					card.id(),
					card.title(),
					card.description(),
					card.priority(),
					card.dueDate(),
					card.position()
				));
		}

		List<ListResponse> listResponses = lists.stream()
			.map(list -> new ListResponse(
				list.id(),
				list.title(),
				list.position(),
				cardsByList.getOrDefault(list.id(), List.of())
			))
			.toList();

		return Optional.of(new BoardResponse(board.id(), board.title(), listResponses));
	}

	public Optional<ListResponse> insertList(String title) {
		UUID id = UUID.randomUUID();
		List<ListResponse> created = jdbcTemplate.query(
			"""
			INSERT INTO lists (id, board_id, title, position)
			SELECT ?, board.id, ?, COALESCE((
				SELECT MAX(existing.position) FROM lists existing WHERE existing.board_id = board.id
			), -1) + 1
			FROM (
				SELECT id FROM boards ORDER BY created_at LIMIT 1
			) board
			RETURNING id, title, position
			""",
			(rs, rowNum) -> new ListResponse(
				rs.getObject("id", UUID.class),
				rs.getString("title"),
				rs.getInt("position"),
				List.of()
			),
			id,
			title
		);
		if (created.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(created.get(0));
	}

	public Optional<CardResponse> insertCard(UUID listId, String title) {
		UUID id = UUID.randomUUID();
		List<CardResponse> created = jdbcTemplate.query(
			"""
			INSERT INTO cards (id, list_id, title, description, priority, due_date, position)
			SELECT ?, list.id, ?, '', 'medium', NULL, COALESCE((
				SELECT MAX(existing.position) FROM cards existing WHERE existing.list_id = list.id
			), -1) + 1
			FROM lists list
			WHERE list.id = ?
			RETURNING id, title, description, priority, due_date, position
			""",
			(rs, rowNum) -> new CardResponse(
				rs.getObject("id", UUID.class),
				rs.getString("title"),
				rs.getString("description"),
				rs.getString("priority"),
				rs.getObject("due_date", LocalDate.class),
				rs.getInt("position")
			),
			id,
			title,
			listId
		);
		if (created.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(created.get(0));
	}

	public Optional<CardResponse> updateCard(UUID cardId, String title, String description, String priority, LocalDate dueDate) {
		List<CardResponse> updated = jdbcTemplate.query(
			"""
			UPDATE cards
			SET title = ?, description = ?, priority = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
			WHERE id = ?
			RETURNING id, title, description, priority, due_date, position
			""",
			(rs, rowNum) -> new CardResponse(
				rs.getObject("id", UUID.class),
				rs.getString("title"),
				rs.getString("description"),
				rs.getString("priority"),
				rs.getObject("due_date", LocalDate.class),
				rs.getInt("position")
			),
			title,
			description,
			priority,
			new SqlParameterValue(Types.DATE, dueDate),
			cardId
		);
		if (updated.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(updated.get(0));
	}

	public Optional<MoveCardResponse> moveCard(UUID cardId, int direction) {
		List<MoveCardResponse> moved = jdbcTemplate.query(
			"""
			UPDATE cards AS card
			SET list_id = neighbor.id,
				position = COALESCE((
					SELECT MAX(existing.position) FROM cards existing WHERE existing.list_id = neighbor.id
				), -1) + 1,
				updated_at = CURRENT_TIMESTAMP
			FROM (
				SELECT next_list.id
				FROM cards current_card
				JOIN lists current_list ON current_list.id = current_card.list_id
				JOIN lists next_list ON next_list.board_id = current_list.board_id
					AND next_list.position = current_list.position + ?
				WHERE current_card.id = ?
			) AS neighbor
			WHERE card.id = ?
			RETURNING card.id, card.list_id, card.position
			""",
			(rs, rowNum) -> new MoveCardResponse(
				rs.getObject("id", UUID.class),
				rs.getObject("list_id", UUID.class),
				rs.getInt("position")
			),
			direction,
			cardId,
			cardId
		);
		if (moved.isEmpty()) {
			return Optional.empty();
		}
		return Optional.of(moved.get(0));
	}

	public boolean cardExists(UUID cardId) {
		Integer count = jdbcTemplate.queryForObject(
			"SELECT COUNT(*) FROM cards WHERE id = ?",
			Integer.class,
			cardId
		);
		return count != null && count > 0;
	}

	private CardRow mapCard(ResultSet rs, int rowNum) throws SQLException {
		return new CardRow(
			rs.getObject("id", UUID.class),
			rs.getObject("list_id", UUID.class),
			rs.getString("title"),
			rs.getString("description"),
			rs.getString("priority"),
			rs.getObject("due_date", LocalDate.class),
			rs.getInt("position")
		);
	}

	private record BoardRow(UUID id, String title) {
	}

	private record ListRow(UUID id, String title, int position) {
	}

	private record CardRow(
		UUID id,
		UUID listId,
		String title,
		String description,
		String priority,
		LocalDate dueDate,
		int position
	) {
	}

}
