package com.springboot.MyTodoList.dto;

public class CreateUserRequest {

    private String name;
    private String mail;
    private String role;

    public CreateUserRequest() {
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

    public void setName(String name) {
        this.name = name;
    }

    public void setMail(String mail) {
        this.mail = mail;
    }

    public void setRole(String role) {
        this.role = role;
    }
}