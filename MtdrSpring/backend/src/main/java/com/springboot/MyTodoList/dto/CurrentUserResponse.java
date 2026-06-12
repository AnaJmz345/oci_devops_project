package com.springboot.MyTodoList.dto;

public class CurrentUserResponse {

    private Long oracle_id;
    private String name;
    private String mail;
    private String role;

    public CurrentUserResponse(Long oracle_id, String name, String mail, String role) {
        this.oracle_id = oracle_id;
        this.name = name;
        this.mail = mail;
        this.role = role;
    }

    public Long getOracle_id() {
        return oracle_id;
    }

    public String getName() {
        return name;
    }

    public String getMail() {
        return mail;
    }

    public String getRole() {
        return role;
    }
}