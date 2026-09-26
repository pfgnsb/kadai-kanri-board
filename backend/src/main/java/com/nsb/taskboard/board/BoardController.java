package com.nsb.taskboard.board;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class BoardController {

	private static final int LIST_TITLE_MAX = 30;
	private static final int CARD_TITLE_MAX = 80;
	private static final int CARD_DESCRIPTION_MAX = 500;
	private static final Set<String> PRIORITIES = Set.of("high", "medium", "low");

	private final BoardRepository boardRepository;

	public BoardController(BoardRepository boardRepository) {
		this.boardRepository = boardRepository;
	}

	@GetMapping("/board")
	public BoardResponse board() {
		return boardRepository.findBoard()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

	@PostMapping("/lists")
	@ResponseStatus(HttpStatus.CREATED)
	public ListResponse createList(@RequestBody CreateTitleRequest request) {
		String title = requiredTitle(request, LIST_TITLE_MAX, "列の名前を入力してください。", "リスト名は30文字以内にしてください。");
		return boardRepository.insertList(title)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "ボードが見つかりません。"));
	}

	@PostMapping("/lists/{listId}/cards")
	@ResponseStatus(HttpStatus.CREATED)
	public CardResponse createCard(@PathVariable UUID listId, @RequestBody CreateTitleRequest request) {
		String title = requiredTitle(request, CARD_TITLE_MAX, "タイトルを入力してください。", "タイトルは80文字以内にしてください。");
		return boardRepository.insertCard(listId, title)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "リストが見つかりません。"));
	}

	@PutMapping("/cards/{cardId}")
	public CardResponse updateCard(@PathVariable UUID cardId, @RequestBody UpdateCardRequest request) {
		String title = requiredText(request.title(), CARD_TITLE_MAX, "タイトルを入力してください。", "タイトルは80文字以内にしてください。");
		String description = optionalText(request.description(), CARD_DESCRIPTION_MAX, "説明文は500文字以内にしてください。");
		String priority = request.priority() == null ? "" : request.priority().strip();
		if (!PRIORITIES.contains(priority)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "優先度は高・中・低から選んでください。");
		}
		LocalDate dueDate = parseDueDate(request.dueDate());
		return boardRepository.updateCard(cardId, title, description, priority, dueDate)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません。"));
	}

	@PostMapping("/cards/{cardId}/move")
	public MoveCardResponse moveCard(@PathVariable UUID cardId, @RequestBody MoveCardRequest request) {
		if (request.listId() == null || request.index() == null || request.index() < 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "移動先を指定してください。");
		}
		return boardRepository.placeCard(cardId, request.listId(), request.index()).orElseThrow(() -> {
			if (!boardRepository.cardExists(cardId)) {
				return new ResponseStatusException(HttpStatus.NOT_FOUND, "カードが見つかりません。");
			}
			return new ResponseStatusException(HttpStatus.NOT_FOUND, "リストが見つかりません。");
		});
	}

	private static String requiredTitle(CreateTitleRequest request, int maxLength, String blankMessage, String tooLongMessage) {
		return requiredText(request.title(), maxLength, blankMessage, tooLongMessage);
	}

	private static String requiredText(String value, int maxLength, String blankMessage, String tooLongMessage) {
		String text = value == null ? "" : value.strip();
		if (text.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, blankMessage);
		}
		if (text.codePointCount(0, text.length()) > maxLength) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, tooLongMessage);
		}
		return text;
	}

	private static String optionalText(String value, int maxLength, String tooLongMessage) {
		String text = value == null ? "" : value.strip();
		if (text.codePointCount(0, text.length()) > maxLength) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, tooLongMessage);
		}
		return text;
	}

	private static LocalDate parseDueDate(String value) {
		if (value == null || value.isBlank()) {
			return null;
		}
		try {
			return LocalDate.parse(value.strip());
		} catch (DateTimeParseException exception) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "期限の日付が正しくありません。");
		}
	}

}
