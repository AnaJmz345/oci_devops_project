package com.springboot.MyTodoList.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.springboot.MyTodoList.botai.IntentCatalogService;
import com.springboot.MyTodoList.botai.LocalHashEmbeddingService;
import com.springboot.MyTodoList.botai.VectorIntentMatchingService;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.NaturalLanguageIntentService;
import com.springboot.MyTodoList.service.TaskNaturalLanguageService;
import com.springboot.MyTodoList.service.TelegramTaskDraftService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.UserService;
import com.springboot.MyTodoList.sprint.Sprint;
import com.springboot.MyTodoList.sprint.SprintService;
import com.springboot.MyTodoList.task.Task;
import com.springboot.MyTodoList.task.TaskAssignee;
import com.springboot.MyTodoList.task.TaskService;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;
import org.telegram.telegrambots.meta.generics.TelegramClient;

class BotActionsMockTest {

    private TelegramClient telegramClient;
    private ToDoItemService toDoItemService;
    private NaturalLanguageIntentService intentService;
    private TaskService taskService;
    private TaskNaturalLanguageService taskNaturalLanguageService;
    private TelegramTaskDraftService draftService;
    private UserService userService;
    private SprintService sprintService;
    private BotActions actions;

    @BeforeEach
    void setUp() {
        telegramClient = mock(TelegramClient.class);
        toDoItemService = mock(ToDoItemService.class);
        VectorIntentMatchingService matcher = new VectorIntentMatchingService(
                new LocalHashEmbeddingService(),
                new IntentCatalogService());
        intentService = new NaturalLanguageIntentService(matcher);
        taskService = mock(TaskService.class);
        taskNaturalLanguageService = new TaskNaturalLanguageService();
        draftService = new TelegramTaskDraftService(taskNaturalLanguageService);
        userService = mock(UserService.class);
        sprintService = mock(SprintService.class);

        actions = new BotActions(telegramClient, toDoItemService,
                intentService, taskService, taskNaturalLanguageService, draftService,
                userService, sprintService);
        actions.setChatId(123L);
    }

    @Test
    void createsTaskUsingFallbackParserWithoutCallingAi() throws Exception {
        User developer = user(7L, "dev@correo.com", "Dev Uno");
        Sprint sprint = sprint(10L, "Sprint 1");
        LocalDate dueDate = LocalDate.now().plusDays(7);
        Task savedTask = task(99L, "Login mobile", "DONE", dueDate);

        when(userService.findByMail("dev@correo.com")).thenReturn(Optional.of(developer));
        when(sprintService.findBySprintNumber(1L)).thenReturn(Optional.of(sprint));
        when(taskService.addTask(any(Task.class))).thenReturn(savedTask);

        actions.setRequestText("/creartarea Login mobile | Implementar acceso | " + dueDate + " | dev@correo.com | Sprint 1");
        actions.fnCreateTaskFromNaturalLanguage();

        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskService).addTask(taskCaptor.capture());
        assertEquals("Login mobile", taskCaptor.getValue().getTaskName());
        assertEquals("Implementar acceso", taskCaptor.getValue().getDescription());
        assertEquals(dueDate, taskCaptor.getValue().getDueDate());
        assertEquals(10L, taskCaptor.getValue().getSprintId());

        ArgumentCaptor<TaskAssignee> assigneeCaptor = ArgumentCaptor.forClass(TaskAssignee.class);
        verify(taskService).assignTask(assigneeCaptor.capture());
        assertEquals(99L, assigneeCaptor.getValue().getTaskId());
        assertEquals(7L, assigneeCaptor.getValue().getOracleId());

        assertTrue(lastMessageText().contains("Task created"));
    }

    @Test
    void listsCompletedTasksForSprint() throws Exception {
        Sprint sprint = sprint(10L, "Sprint 1");
        when(sprintService.findBySprintNumber(1L)).thenReturn(Optional.of(sprint));
        when(taskService.findBySprintId(10L)).thenReturn(List.of(
                task(1L, "API terminada", "DONE", LocalDate.of(2026, 6, 2)),
                task(2L, "UI pendiente", "TODO", LocalDate.of(2026, 6, 3))));

        actions.setRequestText("/completadas_sprint 1");
        actions.fnCompletedTasksBySprint();

        String message = lastMessageText();
        assertTrue(message.contains("Completed tasks for Sprint 1"));
        assertTrue(message.contains("API terminada"));
        assertTrue(!message.contains("UI pendiente"));
    }

    @Test
    void listsCompletedTasksForUserInSprint() throws Exception {
        User developer = user(7L, "dev1@correo.com", "Dev Uno");
        Sprint sprint = sprint(10L, "Sprint 1");
        when(userService.findByMail("dev1@correo.com")).thenReturn(Optional.of(developer));
        when(sprintService.findBySprintNumber(1L)).thenReturn(Optional.of(sprint));
        when(taskService.findBySprintId(10L)).thenReturn(List.of(
                task(1L, "API de pagos", "DONE", LocalDate.of(2026, 6, 2)),
                task(2L, "API de reportes", "DONE", LocalDate.of(2026, 6, 3))));
        when(taskService.getAssigneesByTaskId(1L)).thenReturn(List.of(assignee(1L, 7L)));
        when(taskService.getAssigneesByTaskId(2L)).thenReturn(List.of(assignee(2L, 9L)));

        actions.setRequestText("/completadas_usuario_sprint dev1@correo.com 1");
        actions.fnCompletedTasksByUserInSprint();

        String message = lastMessageText();
        assertTrue(message.contains("Completed tasks for Dev Uno in Sprint 1"));
        assertTrue(message.contains("API de pagos"));
        assertTrue(!message.contains("API de reportes"));
    }

    @Test
    void listsAssignedTasksForEachDeveloper() throws Exception {
        User devOne = user(7L, "dev1@correo.com", "Dev Uno");
        User devTwo = user(9L, "dev2@correo.com", "Dev Dos");
        when(userService.findByRole("DEVELOPER")).thenReturn(List.of(devOne, devTwo));
        when(taskService.findAll()).thenReturn(List.of(
                task(1L, "API de pagos", "TODO", LocalDate.of(2026, 6, 20)),
                task(2L, "UI dashboard", "IN PROGRESS", LocalDate.of(2026, 6, 21))));
        when(taskService.getAllAssignees()).thenReturn(List.of(
                assignee(1L, 7L),
                assignee(2L, 9L)));

        actions.setRequestText("show tasks assigned to each developer");
        actions.fnListAssignedTasks();

        String message = lastMessageText();
        assertTrue(message.contains("Tasks Assigned by Developer"));
        assertTrue(message.contains("Dev Uno"));
        assertTrue(message.contains("API de pagos"));
        assertTrue(message.contains("Dev Dos"));
        assertTrue(message.contains("UI dashboard"));
    }

    @Test
    void listsAssignedTasksForSpecificDeveloper() throws Exception {
        User devOne = user(7L, "dev1@correo.com", "Dev Uno");
        User devTwo = user(9L, "dev2@correo.com", "Dev Dos");
        when(userService.findByRole("DEVELOPER")).thenReturn(List.of(devOne, devTwo));
        when(userService.findByMail("dev1@correo.com")).thenReturn(Optional.of(devOne));
        when(taskService.findAll()).thenReturn(List.of(
                task(1L, "API de pagos", "TODO", LocalDate.of(2026, 6, 20)),
                task(2L, "UI dashboard", "IN PROGRESS", LocalDate.of(2026, 6, 21))));
        when(taskService.getAllAssignees()).thenReturn(List.of(
                assignee(1L, 7L),
                assignee(2L, 9L)));

        actions.setRequestText("what tasks are assigned to dev1@correo.com");
        actions.fnListAssignedTasks();

        String message = lastMessageText();
        assertTrue(message.contains("Tasks Assigned to Dev Uno"));
        assertTrue(message.contains("API de pagos"));
        assertTrue(!message.contains("UI dashboard"));
    }

    private String lastMessageText() throws Exception {
        ArgumentCaptor<SendMessage> messageCaptor = ArgumentCaptor.forClass(SendMessage.class);
        verify(telegramClient).execute(messageCaptor.capture());
        return messageCaptor.getValue().getText();
    }

    private User user(Long oracleId, String mail, String name) {
        User user = new User();
        user.setOracleId(oracleId);
        user.setMail(mail);
        user.setName(name);
        return user;
    }

    private Sprint sprint(Long sprintId, String sprintName) {
        Sprint sprint = new Sprint();
        sprint.setSprintId(sprintId);
        sprint.setSprintName(sprintName);
        return sprint;
    }

    private Task task(Long taskId, String name, String status, LocalDate dueDate) {
        Task task = new Task();
        task.setTaskId(taskId);
        task.setTaskName(name);
        task.setDescription(name + " descripcion");
        task.setStatus(status);
        task.setDueDate(dueDate);
        return task;
    }

    private TaskAssignee assignee(Long taskId, Long oracleId) {
        TaskAssignee assignee = new TaskAssignee();
        assignee.setTaskId(taskId);
        assignee.setOracleId(oracleId);
        return assignee;
    }
}
