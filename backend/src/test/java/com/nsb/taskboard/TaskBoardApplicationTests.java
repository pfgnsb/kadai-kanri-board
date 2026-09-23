package com.nsb.taskboard;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(properties = {
	"spring.docker.compose.enabled=false",
	"spring.autoconfigure.exclude=org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration,org.springframework.boot.sql.init.autoconfigure.SqlInitializationAutoConfiguration"
})
class TaskBoardApplicationTests {

	@MockitoBean
	private JdbcTemplate jdbcTemplate;

	@Test
	void contextLoads() {
	}

}
