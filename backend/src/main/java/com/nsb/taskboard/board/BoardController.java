package com.nsb.taskboard.board;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class BoardController {

	private final BoardRepository boardRepository;

	public BoardController(BoardRepository boardRepository) {
		this.boardRepository = boardRepository;
	}

	@GetMapping("/board")
	public BoardResponse board() {
		return boardRepository.findBoard()
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
	}

}
