package com.medfinder.medfinder_backend;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MedfinderBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(MedfinderBackendApplication.class, args);
		System.out.println("Hello");
	}

}
