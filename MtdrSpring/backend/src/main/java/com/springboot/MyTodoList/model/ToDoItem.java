package com.springboot.MyTodoList.model;


import jakarta.persistence.*;
import java.time.OffsetDateTime;

/*
    representation of the TODOITEM table that exists already
    in the autonomous database
 */
// @Entity removido: la tabla TASK ahora la mapea com.springboot.MyTodoList.task.Task
// ToDoItem se conserva solo para compatibilidad con ToDoItemService y el bot de Telegram
public class ToDoItem {
    /*@Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    int ID;
    @Column(name = "DESCRIPTION")
    String description;
    @Column(name = "CREATION_TS")
    OffsetDateTime creation_ts;
    @Column(name = "done")
    boolean done;*/
    int ID;

    String description;

    String done="TODO";

    String name;

    Integer storyPoints;


    public ToDoItem(){

    }
    //public ToDoItem(int ID, String description, OffsetDateTime creation_ts, boolean done) {
    public ToDoItem(int ID, String description, String done) {
        this.ID = ID;
        this.description = description;
        //this.creation_ts = creation_ts;
        this.done = done;
    }

    public int getID() {
        return ID;
    }

    public void setID(int ID) {
        this.ID = ID;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
    /* 
    public OffsetDateTime getCreation_ts() {
        return creation_ts;
    }

    public void setCreation_ts(OffsetDateTime creation_ts) {
        this.creation_ts = creation_ts;
    }*/

    public String getDone() {
        return done;
    }

    public void setDone(String done) {
        this.done = done;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getStoryPoints() { return storyPoints; }
    public void setStoryPoints(Integer storyPoints) { this.storyPoints = storyPoints; }

    @Override
    public String toString() {
        return "ToDoItem{" +
                "ID=" + ID +
                ", description='" + description + '\'' +
                ", done=" + done +
                ", name='" + name + '\'' +
                ", storyPoints=" + storyPoints +
                '}';
    }
}