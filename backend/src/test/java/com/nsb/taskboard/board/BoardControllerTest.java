package com.nsb.taskboard.board;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.nullValue;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BoardController.class)
class BoardControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private BoardRepository boardRepository;

	@Test
	void boardReturnsListsAndCardsInPositionOrder() throws Exception {
		when(boardRepository.findBoard()).thenReturn(Optional.of(sampleBoard()));

		mockMvc.perform(get("/api/board"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("課題管理"))
			.andExpect(jsonPath("$.lists[0].title").value("未着手"))
			.andExpect(jsonPath("$.lists[0].position").value(0))
			.andExpect(jsonPath("$.lists[1].title").value("作業中"))
			.andExpect(jsonPath("$.lists[0].cards[0].title").value("最初のカード（消してOK）"))
			.andExpect(jsonPath("$.lists[0].cards[0].priority").value("medium"))
			.andExpect(jsonPath("$.lists[0].cards[0].dueDate").value(nullValue()))
			.andExpect(jsonPath("$.lists[0].cards[1].title").value("期限のある高優先度カード"))
			.andExpect(jsonPath("$.lists[0].cards[1].priority").value("high"))
			.andExpect(jsonPath("$.lists[0].cards[1].dueDate").value("2026-10-01"));
	}

	@Test
	void boardReturnsNotFoundWhenMissing() throws Exception {
		when(boardRepository.findBoard()).thenReturn(Optional.empty());

		mockMvc.perform(get("/api/board"))
			.andExpect(status().isNotFound());
	}

	private static BoardResponse sampleBoard() {
		return new BoardResponse(
			UUID.fromString("11111111-1111-4111-8111-111111111111"),
			"課題管理",
			List.of(
				new ListResponse(
					UUID.fromString("11111111-1111-4111-8111-111111111121"),
					"未着手",
					0,
					List.of(
						new CardResponse(
							UUID.fromString("11111111-1111-4111-8111-111111111131"),
							"最初のカード（消してOK）",
							"カードをクリックすると、説明・優先度・期限を編集できます。",
							"medium",
							null,
							0
						),
						new CardResponse(
							UUID.fromString("11111111-1111-4111-8111-111111111132"),
							"期限のある高優先度カード",
							"未着手のテストデータ。期限付き。",
							"high",
							LocalDate.parse("2026-10-01"),
							1
						)
					)
				),
				new ListResponse(
					UUID.fromString("11111111-1111-4111-8111-111111111122"),
					"作業中",
					1,
					List.of(
						new CardResponse(
							UUID.fromString("11111111-1111-4111-8111-111111111133"),
							"作業中のカード",
							"作業中のテストデータ。",
							"medium",
							null,
							0
						)
					)
				)
			)
		);
	}

}
