package com.springboot.MyTodoList.model;

import jakarta.persistence.*;

@Entity
@Table(name = "VANTAGE_USER", schema = "VANTAGE")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "vantage_user_seq_gen")
    @SequenceGenerator(
        name = "vantage_user_seq_gen",
        sequenceName = "VANTAGE.VANTAGE_USER_SEQ",
        allocationSize = 1
    )
    @Column(name = "ORACLE_ID")
    private Long oracleId;

    @Column(name = "MAIL", nullable = false)
    private String mail;

    @Column(name = "NAME", nullable = false)
    private String name;

    @Column(name = "PASSWORD", nullable = false)
    private String password;

    @Column(name = "ROLE", nullable = false)
    private String role;

    // Constructor vacío (requerido por JPA)
    public User() {}

    // Constructor completo
    public User(Long oracleId, String mail, String name, String password, String role) {
        this.oracleId = oracleId;
        this.mail = mail;
        this.name = name;
        this.password = password;
        this.role = role;
    }

    // Getters y Setters

    public Long getOracleId() {
        return oracleId;
    }

    public void setOracleId(Long oracleId) {
        this.oracleId = oracleId;
    }

    public String getMail() {
        return mail;
    }

    public void setMail(String mail) {
        this.mail = mail;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}