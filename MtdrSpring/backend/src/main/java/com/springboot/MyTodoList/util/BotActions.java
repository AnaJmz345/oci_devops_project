package com.springboot.MyTodoList.util;

import com.springboot.MyTodoList.model.User;
import com.springboot.MyTodoList.model.ToDoItem;
import com.springboot.MyTodoList.service.NaturalLanguageIntentService;
import com.springboot.MyTodoList.service.TaskNaturalLanguageService;
import com.springboot.MyTodoList.service.TaskNaturalLanguageService.TaskDraft;
import com.springboot.MyTodoList.service.TelegramTaskDraftService;
import com.springboot.MyTodoList.service.ToDoItemService;
import com.springboot.MyTodoList.service.UserService;
import com.springboot.MyTodoList.task.Task;
import com.springboot.MyTodoList.task.TaskAssignee;
import com.springboot.MyTodoList.task.TaskService;
import com.springboot.MyTodoList.sprint.Sprint;
import com.springboot.MyTodoList.sprint.SprintService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.ReplyKeyboardMarkup;
import org.telegram.telegrambots.meta.api.objects.replykeyboard.buttons.KeyboardRow;
import org.telegram.telegrambots.meta.generics.TelegramClient;

public class BotActions{

    private static final Logger logger = LoggerFactory.getLogger(BotActions.class);

    String requestText;
    long chatId;
    TelegramClient telegramClient;
    boolean exit;

    ToDoItemService todoService;
    NaturalLanguageIntentService naturalLanguageIntentService;
    TaskService taskService;
    TaskNaturalLanguageService taskNaturalLanguageService;
    TelegramTaskDraftService telegramTaskDraftService;
    UserService userService;
    SprintService sprintService;
    String detectedIntent;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\d+");

    public BotActions(TelegramClient tc, ToDoItemService ts,
            NaturalLanguageIntentService nlIntentService, TaskService taskSvc,
            TaskNaturalLanguageService taskNlService, TelegramTaskDraftService taskDraftService,
            UserService usrService, SprintService sprService){
        telegramClient = tc;
        todoService = ts;
        naturalLanguageIntentService = nlIntentService;
        taskService = taskSvc;
        taskNaturalLanguageService = taskNlService;
        telegramTaskDraftService = taskDraftService;
        userService = usrService;
        sprintService = sprService;
        exit  = false;
    }

    public void setRequestText(String cmd){
        requestText=cmd;
    }

    public void setChatId(long chId){
        chatId=chId;
    }

    public void setTelegramClient(TelegramClient tc){
        telegramClient=tc;
    }

    public void setTodoService(ToDoItemService tsvc){
        todoService = tsvc;
    }

    public ToDoItemService getTodoService(){
        return todoService;
    }

    public void setNaturalLanguageIntentService(NaturalLanguageIntentService nlIntentService){
        naturalLanguageIntentService = nlIntentService;
    }

    public void translateNaturalLanguageIntent(){
        if (requestText == null || requestText.startsWith("/") || naturalLanguageIntentService == null || exit) {
            return;
        }

        String intent = getDetectedIntent();
        if ("LIST_TASKS".equals(intent)) {
            requestText = BotCommands.TODO_LIST.getCommand();
        }
    }

    private String getDetectedIntent() {
        if (detectedIntent == null && naturalLanguageIntentService != null) {
            detectedIntent = naturalLanguageIntentService.detectIntent(requestText);
        }

        return detectedIntent;
    }


    

    public void fnStart() {
        if (!(requestText.equals(BotCommands.START_COMMAND.getCommand()) || requestText.equals(BotLabels.SHOW_MAIN_SCREEN.getLabel())) || exit) 
            return;

        BotHelper.sendMessageToTelegram(chatId, BotMessages.HELLO_MYTODO_BOT.getMessage(), telegramClient,  ReplyKeyboardMarkup
            .builder()
            .keyboardRow(new KeyboardRow(BotLabels.LIST_ALL_ITEMS.getLabel(), BotLabels.ADD_NEW_ITEM.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.CREATE_TASK.getLabel(), BotLabels.COMPLETED_BY_SPRINT.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.COMPLETED_BY_USER_SPRINT.getLabel()))
            .keyboardRow(new KeyboardRow(BotLabels.SHOW_MAIN_SCREEN.getLabel(), BotLabels.HIDE_MAIN_SCREEN.getLabel()))
            .build()
        );
        exit = true;
    }

    public void fnDone() {
        if (!(requestText.indexOf(BotLabels.DONE.getLabel()) != -1) || exit) 
            return;
            
        String done = requestText.substring(0, requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(done);

        try {

            ToDoItem item = todoService.getToDoItemById(id);
            item.setDone("DONE");
            todoService.updateToDoItem(id, item);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DONE.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnUndo() {
        if (requestText.indexOf(BotLabels.UNDO.getLabel()) == -1 || exit)
            return;

        String undo = requestText.substring(0,
                requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(undo);

        try {

            ToDoItem item = todoService.getToDoItemById(id);
            item.setDone("TODO");
            todoService.updateToDoItem(id, item);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_UNDONE.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnDelete(){
        if (requestText.indexOf(BotLabels.DELETE.getLabel()) == -1 || exit)
            return;

        String delete = requestText.substring(0,
                requestText.indexOf(BotLabels.DASH.getLabel()));
        Integer id = Integer.valueOf(delete);

        try {
            todoService.deleteToDoItem(id);
            BotHelper.sendMessageToTelegram(chatId, BotMessages.ITEM_DELETED.getMessage(), telegramClient);

        } catch (Exception e) {
            logger.error(e.getLocalizedMessage(), e);
        }
        exit = true;
    }

    public void fnHide(){
        if (requestText.equals(BotCommands.HIDE_COMMAND.getCommand())
				|| requestText.equals(BotLabels.HIDE_MAIN_SCREEN.getLabel()) && !exit)
			BotHelper.sendMessageToTelegram(chatId, BotMessages.BYE.getMessage(), telegramClient);
        else
            return;
        exit = true;
    }

    public void fnListAll(){
        if (!(requestText.equals(BotCommands.TODO_LIST.getCommand())
				|| requestText.equals(BotLabels.LIST_ALL_ITEMS.getLabel())
				|| requestText.equals(BotLabels.MY_TODO_LIST.getLabel())) || exit)
            return;
        logger.info("todoSvc: "+todoService);
        List<ToDoItem> allItems = todoService.findAll();
        ReplyKeyboardMarkup keyboardMarkup = ReplyKeyboardMarkup.builder()
            .resizeKeyboard(true)
            .oneTimeKeyboard(false)
            .selective(true)
            .build();

        List<KeyboardRow> keyboard = new ArrayList<>();

        KeyboardRow mainScreenRowTop = new KeyboardRow();
        mainScreenRowTop.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowTop);

        KeyboardRow firstRow = new KeyboardRow();
        firstRow.add(BotLabels.ADD_NEW_ITEM.getLabel());
        keyboard.add(firstRow);

        KeyboardRow myTodoListTitleRow = new KeyboardRow();
        myTodoListTitleRow.add(BotLabels.MY_TODO_LIST.getLabel());
        keyboard.add(myTodoListTitleRow);

        List<ToDoItem> activeItems = allItems.stream().filter(item -> "TODO".equalsIgnoreCase(item.getDone()))
                .collect(Collectors.toList());

        StringBuilder responseText = new StringBuilder("Here are all your tasks:");

        if (activeItems.isEmpty() && allItems.stream().noneMatch(item -> "DONE".equalsIgnoreCase(item.getDone()))) {
            responseText.append("\n\nYou do not have any tasks yet.");
        }

        if (!activeItems.isEmpty()) {
            responseText.append("\n\nPending:");
        }

        for (ToDoItem item : activeItems) {
            responseText.append("\n- ")
                    .append(item.getDescription())
                    .append(" [TODO]");

            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getDescription());
            currentRow.add(item.getID() + BotLabels.DASH.getLabel() + BotLabels.DONE.getLabel());
            keyboard.add(currentRow);
        }

        List<ToDoItem> doneItems = allItems.stream().filter(item -> "DONE".equalsIgnoreCase(item.getDone()))
                .collect(Collectors.toList());

        if (!doneItems.isEmpty()) {
            responseText.append("\n\nCompleted:");
        }

        for (ToDoItem item : doneItems) {
            responseText.append("\n- ")
                    .append(item.getDescription())
                    .append(" [DONE]");

            KeyboardRow currentRow = new KeyboardRow();
            currentRow.add(item.getDescription());
            currentRow.add(item.getID() + BotLabels.DASH.getLabel() + BotLabels.UNDO.getLabel());
            currentRow.add(item.getID() + BotLabels.DASH.getLabel() + BotLabels.DELETE.getLabel());
            keyboard.add(currentRow);
        }

        KeyboardRow mainScreenRowBottom = new KeyboardRow();
        mainScreenRowBottom.add(BotLabels.SHOW_MAIN_SCREEN.getLabel());
        keyboard.add(mainScreenRowBottom);

        keyboardMarkup.setKeyboard(keyboard);

        BotHelper.sendMessageToTelegram(chatId, responseText.toString(), telegramClient,  keyboardMarkup);
        exit = true;
    }

    public void fnAddItem(){
        logger.info("Adding item");
		if (!(requestText.contains(BotCommands.ADD_ITEM.getCommand())
				|| requestText.contains(BotLabels.ADD_NEW_ITEM.getLabel())) || exit )
            return;
        logger.info("Adding item by BotHelper");
        BotHelper.sendMessageToTelegram(chatId, BotMessages.TYPE_NEW_TODO_ITEM.getMessage(), telegramClient);
        exit = true;
    }

    public void fnElse(){
        if(exit)
            return;
        ToDoItem newItem = new ToDoItem();
        newItem.setDescription(requestText);
        newItem.setDone("TODO");
        todoService.addToDoItem(newItem);

        BotHelper.sendMessageToTelegram(chatId, BotMessages.NEW_ITEM_ADDED.getMessage(), telegramClient, null);
    }

    public void fnLLM(){
        logger.info("Calling LLM");
        if (!(requestText.contains(BotCommands.LLM_REQ.getCommand())) || exit)
            return;

        BotHelper.sendMessageToTelegram(chatId,
                "Las APIs externas de IA estan desactivadas. Usa lenguaje natural como: 'muestrame mis tareas' o 'crea una tarea para terminar el login'.",
                telegramClient, null);
        exit = true;

    }

    public void fnCreateTaskFromNaturalLanguage(){
        if (exit || requestText == null || taskService == null || taskNaturalLanguageService == null
                || telegramTaskDraftService == null || userService == null) {
            return;
        }

        Long chatKey = chatId;

        try {
            if (telegramTaskDraftService.hasDraft(chatKey)) {
                telegramTaskDraftService.fillNextMissing(chatKey, requestText);
                TaskDraft draft = telegramTaskDraftService.getDraft(chatKey);
                handleTaskDraft(chatKey, draft);
                exit = true;
                return;
            }

            boolean explicitCreateCommand = isCreateTaskCommand(requestText);
            String intent = explicitCreateCommand ? "CREATE_TASK" : getDetectedIntent();
            if (!"CREATE_TASK".equals(intent)) {
                return;
            }

            if (explicitCreateCommand && commandPayload(requestText).isBlank()) {
                BotHelper.sendMessageToTelegram(chatId, createTaskHelpMessage(), telegramClient, null);
                exit = true;
                return;
            }

            TaskDraft draft = taskNaturalLanguageService.extractTaskDraft(requestText);
            handleTaskDraft(chatKey, draft);
            exit = true;
        } catch (Exception exc) {
            logger.error("Could not create task from natural language", exc);
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not create the task. Please check the data and try again.",
                    telegramClient, null);
            exit = true;
        }
    }

    public void fnCompletedTasksBySprint() {
        if (exit || requestText == null || taskService == null || sprintService == null) {
            return;
        }

        if (!isCompletedBySprintCommand(requestText)) {
            return;
        }

        Long sprintNumber = firstNumber(requestText);
        if (sprintNumber == null) {
            BotHelper.sendMessageToTelegram(chatId,
                    "Indica el sprint. Ejemplo: /completadas_sprint 1",
                    telegramClient, null);
            exit = true;
            return;
        }

        Optional<Sprint> sprint = sprintService.findBySprintNumber(sprintNumber);
        if (sprint.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                    "No encontre el Sprint " + sprintNumber + ".\n\n" + sprintOptionsMessage(),
                    telegramClient, null);
            exit = true;
            return;
        }

        List<Task> completedTasks = taskService.findBySprintId(sprint.get().getSprintId()).stream()
                .filter(task -> "DONE".equalsIgnoreCase(task.getStatus()))
                .sorted(Comparator.comparing(Task::getTaskName))
                .collect(Collectors.toList());

        BotHelper.sendMessageToTelegram(chatId,
                completedTasksMessage("Tareas completadas de " + sprint.get().getSprintName(), completedTasks),
                telegramClient, null);
        exit = true;
    }

    public void fnCompletedTasksByUserInSprint() {
        if (exit || requestText == null || taskService == null || sprintService == null || userService == null) {
            return;
        }

        if (!isCompletedByUserSprintCommand(requestText)) {
            return;
        }

        String email = firstEmail(requestText);
        Long sprintNumber = firstNumber(email == null ? requestText : requestText.replace(email, ""));
        if (email == null || sprintNumber == null) {
            BotHelper.sendMessageToTelegram(chatId,
                    "Indica correo y sprint. Ejemplo: /completadas_usuario_sprint dev@correo.com 1",
                    telegramClient, null);
            exit = true;
            return;
        }

        Optional<User> user = userService.findByMail(email);
        if (user.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                    "No encontre al usuario " + email + ".\n\n" + developerEmailsMessage(),
                    telegramClient, null);
            exit = true;
            return;
        }

        Optional<Sprint> sprint = sprintService.findBySprintNumber(sprintNumber);
        if (sprint.isEmpty()) {
            BotHelper.sendMessageToTelegram(chatId,
                    "No encontre el Sprint " + sprintNumber + ".\n\n" + sprintOptionsMessage(),
                    telegramClient, null);
            exit = true;
            return;
        }

        Long oracleId = user.get().getOracleId();
        List<Task> completedTasks = taskService.findBySprintId(sprint.get().getSprintId()).stream()
                .filter(task -> "DONE".equalsIgnoreCase(task.getStatus()))
                .filter(task -> taskService.getAssigneesByTaskId(task.getTaskId()).stream()
                        .anyMatch(assignee -> oracleId.equals(assignee.getOracleId())))
                .sorted(Comparator.comparing(Task::getTaskName))
                .collect(Collectors.toList());

        BotHelper.sendMessageToTelegram(chatId,
                completedTasksMessage("Tareas completadas de " + user.get().getName()
                        + " en " + sprint.get().getSprintName(), completedTasks),
                telegramClient, null);
        exit = true;
    }

    private void handleTaskDraft(Long chatKey, TaskDraft draft) {
        if (draft == null) {
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not understand the task details. Let's try again: what should the task be called?",
                    telegramClient, null);
            return;
        }

        String validationMessage = validateDraft(draft);
        if (validationMessage != null) {
            telegramTaskDraftService.saveDraft(chatKey, draft);
            BotHelper.sendMessageToTelegram(chatId, validationMessage, telegramClient, null);
            return;
        }

        Optional<User> assignee = userService.findByMail(draft.getAssigneeEmail());
        if (assignee.isEmpty()) {
            draft.setAssigneeEmail(null);
            draft.setPendingField("ASSIGNEE_EMAIL");
            telegramTaskDraftService.saveDraft(chatKey, draft);
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not find a developer with that email. Send me a valid one.\n\n" + developerEmailsMessage(),
                    telegramClient, null);
            return;
        }

        Optional<Sprint> sprint = resolveSprint(draft);
        if (draft.getSprintId() != null && sprint.isEmpty()) {
            draft.setSprintId(null);
            draft.setPendingField("SPRINT");
            telegramTaskDraftService.saveDraft(chatKey, draft);
            BotHelper.sendMessageToTelegram(chatId,
                    "I could not find that sprint. The number must match the sprint name, for example: Sprint 3.\n\n"
                            + sprintOptionsMessage(),
                    telegramClient, null);
            return;
        }

        createTask(draft, assignee.get(), sprint.orElse(null));
        telegramTaskDraftService.clearDraft(chatKey);
    }

    private String validateDraft(TaskDraft draft) {
        if (draft.getTaskName() == null || draft.getTaskName().isBlank()) {
            draft.setTaskName(null);
            draft.setPendingField("TASK_NAME");
            return "What should the task be called?";
        }

        LocalDate today = LocalDate.now();
        if (draft.getDueDate() == null) {
            draft.setPendingField("DUE_DATE");
            return "What is the due date? Today is " + today + ". It must be today or later.";
        }

        if (draft.getDueDate().isBefore(today)) {
            draft.setDueDate(null);
            draft.setPendingField("DUE_DATE");
            return "The due date is invalid because it already passed. Today is " + today
                    + ". Send me a date that is today or later.";
        }

        if (draft.getAssigneeEmail() == null || draft.getAssigneeEmail().isBlank()) {
            draft.setAssigneeEmail(null);
            draft.setPendingField("ASSIGNEE_EMAIL");
            return "Which developer email should I assign it to?\n\n" + developerEmailsMessage();
        }

        draft.setPendingField(null);
        return null;
    }

    private Optional<Sprint> resolveSprint(TaskDraft draft) {
        if (draft.getSprintId() == null || sprintService == null) {
            return Optional.empty();
        }

        return sprintService.findBySprintNumber(draft.getSprintId());
    }

    private String developerEmailsMessage() {
        List<User> developers = userService.findByRole("DEVELOPER");
        if (developers == null || developers.isEmpty()) {
            return "There are no registered developers.";
        }

        StringBuilder message = new StringBuilder("Registered developers:");
        developers.stream()
                .sorted(Comparator.comparing(User::getMail))
                .forEach(user -> message.append("\n- ").append(user.getMail()));
        return message.toString();
    }

    private String sprintOptionsMessage() {
        if (sprintService == null) {
            return "I could not check the sprints.";
        }

        List<Sprint> sprints = sprintService.findAll();
        if (sprints == null || sprints.isEmpty()) {
            return "There are no registered sprints.";
        }

        StringBuilder message = new StringBuilder("Registered sprints:");
        sprints.stream()
                .sorted(Comparator.comparing(Sprint::getSprintName))
                .forEach(sprint -> message.append("\n- ")
                        .append(sprint.getSprintName())
                        .append(" (internal ID: ")
                        .append(sprint.getSprintId())
                        .append(")"));
        return message.toString();
    }

    private void createTask(TaskDraft draft, User assignee, Sprint sprint) {
        Task task = new Task();
        task.setTaskName(draft.getTaskName());
        task.setDescription(draft.getDescription());
        task.setDueDate(draft.getDueDate());
        task.setSprintId(sprint == null ? null : sprint.getSprintId());
        task.setStatus("TODO");
        task.setCategory("FEATURE");
        task.setStoryPoints(1);
        task.setCreatedBy(1L);

        Task savedTask = taskService.addTask(task);

        TaskAssignee taskAssignee = new TaskAssignee();
        taskAssignee.setTaskId(savedTask.getTaskId());
        taskAssignee.setOracleId(assignee.getOracleId());
        taskAssignee.setRealTimeSpent(0.0);
        taskService.assignTask(taskAssignee);

        BotHelper.sendMessageToTelegram(
                chatId,
                "Task created:\n- " + savedTask.getTaskName()
                        + "\nDescription: " + valueOrEmpty(savedTask.getDescription())
                        + "\nDue date: " + savedTask.getDueDate()
                        + "\nSprint: " + (sprint == null ? "No data" : sprint.getSprintName())
                        + "\nAssigned to: " + assignee.getName() + " (" + assignee.getMail() + ")",
                telegramClient,
                null
        );
    }

    private String valueOrEmpty(Object value) {
        return value == null ? "No data" : value.toString();
    }

    private boolean isCreateTaskCommand(String text) {
        String normalized = normalize(text);
        return normalized.startsWith(BotCommands.CREATE_TASK.getCommand())
                || normalized.startsWith("crear tarea")
                || normalized.equals(BotLabels.CREATE_TASK.getLabel().toLowerCase());
    }

    private boolean isCompletedBySprintCommand(String text) {
        String normalized = normalize(text);
        return normalized.startsWith(BotCommands.COMPLETED_BY_SPRINT.getCommand())
                || normalized.startsWith("completadas sprint")
                || normalized.equals(BotLabels.COMPLETED_BY_SPRINT.getLabel().toLowerCase());
    }

    private boolean isCompletedByUserSprintCommand(String text) {
        String normalized = normalize(text);
        return normalized.startsWith(BotCommands.COMPLETED_BY_USER_SPRINT.getCommand())
                || normalized.startsWith("completadas usuario sprint")
                || normalized.equals(BotLabels.COMPLETED_BY_USER_SPRINT.getLabel().toLowerCase());
    }

    private String commandPayload(String text) {
        String normalized = normalize(text);
        if (normalized.startsWith(BotCommands.CREATE_TASK.getCommand())) {
            return text.substring(BotCommands.CREATE_TASK.getCommand().length()).trim();
        }
        if (normalized.startsWith("crear tarea")) {
            return text.substring("crear tarea".length()).trim();
        }
        return "";
    }

    private Long firstNumber(String text) {
        Matcher matcher = NUMBER_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return Long.valueOf(matcher.group());
    }

    private String firstEmail(String text) {
        Matcher matcher = EMAIL_PATTERN.matcher(text);
        if (!matcher.find()) {
            return null;
        }
        return matcher.group();
    }

    private String completedTasksMessage(String title, List<Task> tasks) {
        StringBuilder message = new StringBuilder(title);
        if (tasks == null || tasks.isEmpty()) {
            return message.append("\n\nNo hay tareas completadas.").toString();
        }

        tasks.forEach(task -> message.append("\n- #")
                .append(task.getTaskId())
                .append(" ")
                .append(task.getTaskName())
                .append(" (vence: ")
                .append(valueOrEmpty(task.getDueDate()))
                .append(")"));
        return message.toString();
    }

    private String createTaskHelpMessage() {
        return "Enviame la tarea con este formato:\n"
                + "/creartarea Nombre | Descripcion | 2026-06-01 | dev@correo.com | Sprint 1";
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }
        return java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .trim();
    }

}
