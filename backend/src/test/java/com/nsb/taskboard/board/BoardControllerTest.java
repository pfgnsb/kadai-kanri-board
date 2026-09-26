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

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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

	@Test
	void createListAppendsTrimmedTitle() throws Exception {
		UUID listId = UUID.fromString("22222222-2222-4222-8222-222222222221");
		when(boardRepository.insertList("レビュー")).thenReturn(Optional.of(
			new ListResponse(listId, "レビュー", 3, List.of())
		));

		mockMvc.perform(post("/api/lists")
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"  レビュー  \"}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.id").value(listId.toString()))
			.andExpect(jsonPath("$.title").value("レビュー"))
			.andExpect(jsonPath("$.position").value(3))
			.andExpect(jsonPath("$.cards", hasSize(0)));
	}

	@Test
	void createListRejectsBlankTitle() throws Exception {
		mockMvc.perform(post("/api/lists")
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"   \"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("列の名前を入力してください。"));

		verify(boardRepository, never()).insertList(anyString());
	}

	@Test
	void createListRejectsTitleLongerThan30() throws Exception {
		mockMvc.perform(post("/api/lists")
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"" + "あ".repeat(31) + "\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("リスト名は30文字以内にしてください。"));

		verify(boardRepository, never()).insertList(anyString());
	}

	@Test
	void createListReturnsNotFoundWhenBoardMissing() throws Exception {
		when(boardRepository.insertList("レビュー")).thenReturn(Optional.empty());

		mockMvc.perform(post("/api/lists")
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"レビュー\"}"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.detail").value("ボードが見つかりません。"));
	}

	@Test
	void createCardAppendsWithMediumPriority() throws Exception {
		UUID listId = UUID.fromString("11111111-1111-4111-8111-111111111121");
		UUID cardId = UUID.fromString("33333333-3333-4333-8333-333333333331");
		when(boardRepository.insertCard(listId, "資料を書く")).thenReturn(Optional.of(
			new CardResponse(cardId, "資料を書く", "", "medium", null, 2)
		));

		mockMvc.perform(post("/api/lists/" + listId + "/cards")
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"資料を書く\"}"))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.id").value(cardId.toString()))
			.andExpect(jsonPath("$.title").value("資料を書く"))
			.andExpect(jsonPath("$.description").value(""))
			.andExpect(jsonPath("$.priority").value("medium"))
			.andExpect(jsonPath("$.dueDate").value(nullValue()))
			.andExpect(jsonPath("$.position").value(2));
	}

	@Test
	void createCardRejectsBlankTitle() throws Exception {
		UUID listId = UUID.fromString("11111111-1111-4111-8111-111111111121");

		mockMvc.perform(post("/api/lists/" + listId + "/cards")
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("タイトルを入力してください。"));

		verify(boardRepository, never()).insertCard(any(), anyString());
	}

	@Test
	void createCardRejectsTitleLongerThan80() throws Exception {
		UUID listId = UUID.fromString("11111111-1111-4111-8111-111111111121");

		mockMvc.perform(post("/api/lists/" + listId + "/cards")
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"" + "あ".repeat(81) + "\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("タイトルは80文字以内にしてください。"));

		verify(boardRepository, never()).insertCard(any(), anyString());
	}

	@Test
	void createCardReturnsNotFoundWhenListMissing() throws Exception {
		UUID listId = UUID.fromString("99999999-9999-4999-8999-999999999999");
		when(boardRepository.insertCard(listId, "資料を書く")).thenReturn(Optional.empty());

		mockMvc.perform(post("/api/lists/" + listId + "/cards")
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"資料を書く\"}"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.detail").value("リストが見つかりません。"));
	}

	@Test
	void updateCardSavesFields() throws Exception {
		UUID cardId = UUID.fromString("11111111-1111-4111-8111-111111111131");
		when(boardRepository.updateCard(cardId, "資料を直す", "メモ", "high", LocalDate.parse("2026-10-02")))
			.thenReturn(Optional.of(new CardResponse(cardId, "資料を直す", "メモ", "high", LocalDate.parse("2026-10-02"), 0)));

		mockMvc.perform(put("/api/cards/" + cardId)
				.contentType(APPLICATION_JSON)
				.content("""
					{"title":"  資料を直す  ","description":" メモ ","priority":"high","dueDate":"2026-10-02"}
					"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("資料を直す"))
			.andExpect(jsonPath("$.description").value("メモ"))
			.andExpect(jsonPath("$.priority").value("high"))
			.andExpect(jsonPath("$.dueDate").value("2026-10-02"));
	}

	@Test
	void updateCardClearsBlankDueDate() throws Exception {
		UUID cardId = UUID.fromString("11111111-1111-4111-8111-111111111131");
		when(boardRepository.updateCard(eq(cardId), eq("資料を直す"), eq(""), eq("medium"), isNull()))
			.thenReturn(Optional.of(new CardResponse(cardId, "資料を直す", "", "medium", null, 0)));

		mockMvc.perform(put("/api/cards/" + cardId)
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"資料を直す\",\"description\":\"\",\"priority\":\"medium\",\"dueDate\":\"\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.dueDate").value(nullValue()));
	}

	@Test
	void updateCardRejectsBlankTitle() throws Exception {
		UUID cardId = UUID.fromString("11111111-1111-4111-8111-111111111131");

		mockMvc.perform(put("/api/cards/" + cardId)
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"  \",\"description\":\"\",\"priority\":\"medium\",\"dueDate\":\"\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("タイトルを入力してください。"));

		verify(boardRepository, never()).updateCard(any(), anyString(), anyString(), anyString(), any());
	}

	@Test
	void updateCardRejectsUnknownPriority() throws Exception {
		UUID cardId = UUID.fromString("11111111-1111-4111-8111-111111111131");

		mockMvc.perform(put("/api/cards/" + cardId)
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"資料\",\"description\":\"\",\"priority\":\"urgent\",\"dueDate\":\"\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("優先度は高・中・低から選んでください。"));

		verify(boardRepository, never()).updateCard(any(), anyString(), anyString(), anyString(), any());
	}

	@Test
	void updateCardReturnsNotFoundWhenMissing() throws Exception {
		UUID cardId = UUID.fromString("99999999-9999-4999-8999-999999999999");
		when(boardRepository.updateCard(cardId, "資料", "", "low", null)).thenReturn(Optional.empty());

		mockMvc.perform(put("/api/cards/" + cardId)
				.contentType(APPLICATION_JSON)
				.content("{\"title\":\"資料\",\"description\":\"\",\"priority\":\"low\"}"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.detail").value("カードが見つかりません。"));
	}

	@Test
	void moveCardToTheRight() throws Exception {
		UUID cardId = UUID.fromString("11111111-1111-4111-8111-111111111131");
		UUID listId = UUID.fromString("11111111-1111-4111-8111-111111111122");
		when(boardRepository.moveCard(cardId, 1)).thenReturn(Optional.of(new MoveCardResponse(cardId, listId, 1)));

		mockMvc.perform(post("/api/cards/" + cardId + "/move")
				.contentType(APPLICATION_JSON)
				.content("{\"direction\":\"right\"}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.listId").value(listId.toString()))
			.andExpect(jsonPath("$.position").value(1));
	}

	@Test
	void moveCardRejectsUnknownDirection() throws Exception {
		UUID cardId = UUID.fromString("11111111-1111-4111-8111-111111111131");

		mockMvc.perform(post("/api/cards/" + cardId + "/move")
				.contentType(APPLICATION_JSON)
				.content("{\"direction\":\"up\"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("移動方向は左か右です。"));

		verify(boardRepository, never()).moveCard(any(), anyInt());
	}

	@Test
	void moveCardReturnsNotFoundWhenCardMissing() throws Exception {
		UUID cardId = UUID.fromString("99999999-9999-4999-8999-999999999999");
		when(boardRepository.moveCard(cardId, 1)).thenReturn(Optional.empty());
		when(boardRepository.cardExists(cardId)).thenReturn(false);

		mockMvc.perform(post("/api/cards/" + cardId + "/move")
				.contentType(APPLICATION_JSON)
				.content("{\"direction\":\"right\"}"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.detail").value("カードが見つかりません。"));
	}

	@Test
	void moveCardRejectsWhenNeighborMissing() throws Exception {
		UUID cardId = UUID.fromString("11111111-1111-4111-8111-111111111131");
		when(boardRepository.moveCard(cardId, 1)).thenReturn(Optional.empty());
		when(boardRepository.cardExists(cardId)).thenReturn(true);

		mockMvc.perform(post("/api/cards/" + cardId + "/move")
				.contentType(APPLICATION_JSON)
				.content("{\"direction\":\" right \"}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.detail").value("その方向にはリストがありません。"));
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
