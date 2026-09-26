package com.nsb.taskboard.board;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

	private static String requiredTitle(CreateTitleRequest request, int maxLength, String blankMessage, String tooLongMessage) {
		String title = request.title() == null ? "" : request.title().strip();
		if (title.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, blankMessage);
		}
		if (title.codePointCount(0, title.length()) > maxLength) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, tooLongMessage);
		}
		return title;
	}

}
