package com.nsb.taskboard.health;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HealthController.class)
class HealthControllerTest {

	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private JdbcTemplate jdbcTemplate;

	@Test
	void healthReturnsOk() throws Exception {
		when(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).thenReturn(1);

		mockMvc.perform(get("/api/health"))
			.andExpect(status().isOk())
			.andExpect(content().json("{\"status\":\"ok\",\"database\":\"up\"}"));
	}

}
