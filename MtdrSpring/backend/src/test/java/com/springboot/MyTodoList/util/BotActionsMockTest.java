package com.springboot.MyTodoList.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.service.DeepSeekService;
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

    /* These real dependencies that allow the bot to send Telegram messages,
    use task logic, search users, search sprints, and call AI-related logic will be replaced by mocks in the tests to only test the bot logic without depending on external factors.
    */
    private TelegramClient telegramClient;
    private ToDoItemService toDoItemService;
    private DeepSeekService deepSeekService;
    private NaturalLanguageIntentService intentService;
    private TaskService taskService;
    private TaskNaturalLanguageService taskNaturalLanguageService;
    private TelegramTaskDraftService draftService;
    private UserService userService;
    private SprintService sprintService;
    private BotActions actions;

    @BeforeEach
    void setUp() {
        // We clean the context before each test to ensure that the tests do not interfere with each other.


        // sending real telegram messages is mocked because we just want to check what message the bot tried to send.
        telegramClient = mock(TelegramClient.class);

        // Mocks general todo logic because we do not want to depend on a real database or real stored data. The tests will define exactly which fake items exist and how the service should respond to them.
        toDoItemService = mock(ToDoItemService.class);

        // AI service is mocked because we do not want to call the real API during the tests. We just want to check if the bot uses it or not, and how it behaves when it returns certain results.
        deepSeekService = mock(DeepSeekService.class);

        // Passes the mocked DeepSeekService to the bot so it can understand user messages.
        intentService = new NaturalLanguageIntentService(deepSeekService);
        taskNaturalLanguageService = new TaskNaturalLanguageService(deepSeekService);

        // TaskService is mocked because it is the dependency that creates, assigns, searches, and updates project tasks and we want to control what tasks exist in the test.
        taskService = mock(TaskService.class);

        draftService = new TelegramTaskDraftService(taskNaturalLanguageService);

        // UserService is mocked because we do not want to search users in a real database, so we define the fake user to be returned in each test.
        userService = mock(UserService.class);

        // SprintService is mocked because we do not want to search real sprints, so we define the fake sprints to be returned in each test. This helps us test how the bot behaves with different sprints and tasks without depending on real data.
        sprintService = mock(SprintService.class);

        /* creates the bot and injects the mocked dependencies.
            This way, when the bot calls these services, it will call the mocks and return the fake data defined in the tests instead of executing real logic and data.
        */
        actions = new BotActions(
                telegramClient,
                toDoItemService,
                deepSeekService,
                intentService,
                taskService,
                taskNaturalLanguageService,
                draftService,
                userService,
                sprintService
        );

        // This simulates the Telegram chat where the bot would answer.
        
        actions.setChatId(123L);
    }

    @Test
    void createsTaskUsingFallbackParserWithoutCallingAi() throws Exception {
        /* This test checks that the bot can create a task from a Telegram command by testing if BotActions reads the message, builds the task, assigns it to the correct user, and sends a confirmation message.
        */

        //fake data to simulate task
        User developer = user(7L, "uncorreo@gmail.com", "Personita");
        Sprint sprint = sprint(10L, "Sprint 1");
        Task savedTask = task(99L, "Login mobile", "TODO", LocalDate.of(2026, 6, 1));

        /* These lines define what the mocks should return.
        when(...).thenReturn(...) means:
        When this fake service is called with this value, return this fake result that we defined above in the fake data section.
        */
        when(userService.findByMail("uncorreo@gmail.com")).thenReturn(Optional.of(developer));
        when(sprintService.findBySprintNumber(1L)).thenReturn(Optional.of(sprint));
        when(taskService.addTask(any(Task.class))).thenReturn(savedTask);

        // simulation of message a user sends to telegram to create a task.
        actions.setRequestText("/creartarea Login mobile | Implementar acceso | 2026-06-01 | uncorreo@gmail.com | Sprint 1");

        // Execution of the real method of the bot using the moked services and the fake data defined in the test.
        actions.fnCreateTaskFromNaturalLanguage();

        /*
        ArgumentCaptor lets us capture the object that was sent to the mocked service.

        Here we capture the Task that BotActions tried to save.
        This is useful because we can check if the bot created the task correctly.
        */
        ArgumentCaptor<Task> taskCaptor = ArgumentCaptor.forClass(Task.class);
        verify(taskService).addTask(taskCaptor.capture());

        /*
        These assertions check that the task data from the task message saved in the mocked object was identified correctly and that the bot built the Task object with the correct values before saving it.
        */
        assertEquals("Login mobile", taskCaptor.getValue().getTaskName());
        assertEquals("Implementar acceso", taskCaptor.getValue().getDescription());
        assertEquals(LocalDate.of(2026, 6, 1), taskCaptor.getValue().getDueDate());
        assertEquals(10L, taskCaptor.getValue().getSprintId());

        /*
        Here we capture the assignment that BotActions created.
        This checks that the task was assigned to the correct user.
        */
        ArgumentCaptor<TaskAssignee> assigneeCaptor = ArgumentCaptor.forClass(TaskAssignee.class);
        verify(taskService).assignTask(assigneeCaptor.capture());

        assertEquals(99L, assigneeCaptor.getValue().getTaskId());
        assertEquals(7L, assigneeCaptor.getValue().getOracleId());

        //Finally, we check that the bot sent a confirmation message.
        assertTrue(lastMessageText().contains("Task created"));
    }

    @Test
    void listsCompletedTasksForSprint() throws Exception {
        //This test checks that the bot can show only the completed tasks from a sprint.
        

        Sprint sprint = sprint(10L, "Sprint 1");

        //The fake SprintService returns Sprint 1.
        when(sprintService.findBySprintNumber(1L)).thenReturn(Optional.of(sprint));

        /*
        The fake TaskService returns two tasks for the sprint.
        One is completed and the other one is pending.
        */
        when(taskService.findBySprintId(10L)).thenReturn(List.of(
                task(1L, "API terminada", "DONE", LocalDate.of(2026, 6, 2)),
                task(2L, "UI pendiente", "TODO", LocalDate.of(2026, 6, 3))
        ));

        // This simulates the Telegram command to ask for completed tasks in Sprint 1.
        actions.setRequestText("/completadas_sprint 1");

        // runs reaal bot method
        actions.fnCompletedTasksBySprint();

        // Gets the message that the bot tried to send to Telegram.
        String message = lastMessageText();

        /*
        The message should include the completed task.
        It should not include the pending task.
        */
        assertTrue(message.contains("Tareas completadas de Sprint 1"));
        assertTrue(message.contains("API terminada"));
        assertTrue(!message.contains("UI pendiente"));
    }

    @Test
    void listsCompletedTasksForUserInSprint() throws Exception {
        /*
        This test checks that the bot can show completed tasks for one specific user
        inside one specific sprint.
        */

        User developer = user(7L, "dev1@correo.com", "Dev Uno");
        Sprint sprint = sprint(10L, "Sprint 1");

        // The fake services return the user and sprint needed for the test.
        when(userService.findByMail("dev1@correo.com")).thenReturn(Optional.of(developer));
        when(sprintService.findBySprintNumber(1L)).thenReturn(Optional.of(sprint));

        // The fake TaskService returns two completed tasks in the sprint.
        when(taskService.findBySprintId(10L)).thenReturn(List.of(
                task(1L, "API de pagos", "DONE", LocalDate.of(2026, 6, 2)),
                task(2L, "API de reportes", "DONE", LocalDate.of(2026, 6, 3))
        ));

        /*
        Here we simulate which user is assigned to each task.
        Task 1 belongs to user 7.
        Task 2 belongs to user 9.
        Since the selected user is 7, only Task 1 should appear in the answer.
        */
        when(taskService.getAssigneesByTaskId(1L)).thenReturn(List.of(assignee(1L, 7L)));
        when(taskService.getAssigneesByTaskId(2L)).thenReturn(List.of(assignee(2L, 9L)));

        // This simulates the Telegram command to ask for completed tasks for one user in Sprint 1.
        actions.setRequestText("/completadas_usuario_sprint dev1@correo.com 1");

        //real bot method
        actions.fnCompletedTasksByUserInSprint();

        String message = lastMessageText();

        /*
        The response should include the task assigned to user 7.
        It should not include the task assigned to user 9.
        */
        assertTrue(message.contains("Tareas completadas de Dev Uno en Sprint 1"));
        assertTrue(message.contains("API de pagos"));
        assertTrue(!message.contains("API de reportes"));
    }

    @Test
    void deletesTaskFromTelegramCommand() throws Exception {
        
        actions.setRequestText("1" + BotLabels.DASH.getLabel() + BotLabels.DELETE.getLabel());

        /* real delete method of the bot. This will call the mocked ToDoItemService's delete method with the ID from the command (1 in this case).
        */
        actions.fnDelete();

        // This verifies that the bot called the delete method with ID 1.
    
        verify(toDoItemService).deleteToDoItem(1);

        // This checks that the bot sent a deletion confirmation message.
        assertTrue(lastMessageText().contains("deleted")
                || lastMessageText().contains("Deleted")
                || lastMessageText().contains("elimin"));
    }

    @Test
    void listsAllTodoItems() throws Exception {
        /*
        This test checks that the bot can list all ToDo items.

        We create two fake items:
        one pending and one done.
        Then we make the fake service return both.
        */

        ToDoItem pending = todoItem(1, "Preparar demo", "TODO");
        ToDoItem done = todoItem(2, "Configurar Mockito", "DONE");

        // When the bot asks the service for all items, the mock returns our fake list.
        when(toDoItemService.findAll()).thenReturn(List.of(pending, done));

        // This simulates the Telegram command that asks for the to-do list.
        actions.setRequestText(BotCommands.TODO_LIST.getCommand());

        // real method of the bot that lists all items. This will call the mocked service and return the fake items defined in this test.
        actions.fnListAll();

        String message = lastMessageText();

        /*
        The response should include both items and their statuses.
        */
        assertTrue(message.contains("Preparar demo"));
        assertTrue(message.contains("Configurar Mockito"));
        assertTrue(message.contains("TODO"));
        assertTrue(message.contains("DONE"));
    }

    @Test
    void marksTaskAsDoneFromTelegramCommand() throws Exception {
        /*
        This test checks that the bot can mark a task as DONE.

        First, the fake service returns a task with status TODO.
        Then, the bot should update it to DONE.
        */

        ToDoItem item = todoItem(1, "Crear pruebas", "TODO");
        when(toDoItemService.getToDoItemById(1)).thenReturn(item);

        // This simulates a Telegram command that marks task 1 as done.
        
        actions.setRequestText("1" + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());

        actions.fnDone();

        // We capture the ToDoItem that the bot sends to updateToDoItem. This lets us check that the bot changed the status to DONE.
        
        ArgumentCaptor<ToDoItem> itemCaptor = ArgumentCaptor.forClass(ToDoItem.class);
        verify(toDoItemService).updateToDoItem(eq(1), itemCaptor.capture());

        assertEquals("DONE", itemCaptor.getValue().getDone());

        // checks that the bot sent a confirmation message about the completion.
        assertTrue(lastMessageText().contains("done")
                || lastMessageText().contains("Done")
                || lastMessageText().contains("complet"));
    }

    private String lastMessageText() throws Exception {
        /*
       captures the last message that the bot tried to send.

        Since TelegramClient is mocked, no real Telegram message is sent.
        Instead, Mockito lets us inspect the SendMessage object that the bot passed
        to telegramClient.execute(...).
        */

        ArgumentCaptor<SendMessage> messageCaptor = ArgumentCaptor.forClass(SendMessage.class);
        verify(telegramClient).execute(messageCaptor.capture());
        return messageCaptor.getValue().getText();
    }

    private User user(Long oracleId, String mail, String name) {
        /*
        create a fake user for the tests.
        This avoids repeating the same setup code in every test.
        */

        User user = new User();
        user.setOracleId(oracleId);
        user.setMail(mail);
        user.setName(name);
        return user;
    }

    private Sprint sprint(Long sprintId, String sprintName) {
        // creates a fake sprint for the tests.
        

        Sprint sprint = new Sprint();
        sprint.setSprintId(sprintId);
        sprint.setSprintName(sprintName);
        return sprint;
    }

    private Task task(Long taskId, String name, String status, LocalDate dueDate) {
        /*
        Creates a fake project task.
        It receives the values that change in each test.
        */

        Task task = new Task();
        task.setTaskId(taskId);
        task.setTaskName(name);
        task.setDescription(name + " descripcion");
        task.setStatus(status);
        task.setDueDate(dueDate);
        return task;
    }

    private TaskAssignee assignee(Long taskId, Long oracleId) {
        /*
        creates a fake task assignment.
        It connects a task with a user.
        */

        TaskAssignee assignee = new TaskAssignee();
        assignee.setTaskId(taskId);
        assignee.setOracleId(oracleId);
        return assignee;
    }

    private ToDoItem todoItem(int id, String description, String done) {
        /*
        Creates a fake ToDo item.
        */

        ToDoItem item = new ToDoItem();
        item.setID(id);
        item.setDescription(description);
        item.setDone(done);
        return item;
    }
}