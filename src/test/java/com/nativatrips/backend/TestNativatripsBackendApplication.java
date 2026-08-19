package com.nativatrips.backend;

import org.springframework.boot.SpringApplication;

public class TestNativatripsBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(NativatripsBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
