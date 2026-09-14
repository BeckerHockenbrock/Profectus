#include <chrono>
#include <algorithm>
#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

#include "DateFunctions.h"
#include "DatabaseFunctions.h"
#include "HabitFunctions.h"
#include "ProgressionFunctions.h"
#include "Todo.h"
#include "UIFunctions.h"

using namespace std;

vector<Todo> todos;
int nextID = 1;
int runningTodoID = -1;
bool timerIsRunning = false;
chrono::steady_clock::time_point timerStart;

int getNumber(string prompt) {
    int number;

    cout << prompt;

    while (!(cin >> number)) {
        cout << "Please enter a whole number. Try again: ";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }

    return number;
}

void saveTodos() {
    saveTodosToDatabase(todos);
}

void loadTodos() {
    loadTodosFromDatabase(todos, nextID);
}

int findTodoByID(int id) {
    for (size_t i = 0; i < todos.size(); i++) {
        if (todos[i].id == id) {
            return i;
        }
    }

    return -1;
}

int getOpenTodoCount() {
    int openTodos = 0;

    for (size_t i = 0; i < todos.size(); i++) {
        if (!todos[i].completed) {
            openTodos++;
        }
    }

    return openTodos;
}

string shortenText(string text, int maxLength) {
    if (text.length() <= static_cast<size_t>(maxLength)) {
        return text;
    }

    return text.substr(0, maxLength - 3) + "...";
}

void showDashboard() {
    printSection("DAILY STATUS");
    cout << "  Open quests: " << getOpenTodoCount()
         << "    |    Completed: " << todos.size() - getOpenTodoCount()
         << "    |    Total XP: " << getTotalXP(todos) + getTotalHabitXP() << endl;
    cout << "  Every focused minute becomes 1 XP. Build your streak one quest at a time." << endl;
    cout << endl;
}

void waitForEnter() {
    cout << endl;
    cout << "Press Enter to return to the command console." << endl;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cin.get();
}

string formatTime(long long seconds) {
    long long hours = seconds / 3600;
    long long minutes = (seconds % 3600) / 60;
    long long remainingSeconds = seconds % 60;

    return to_string(hours) + "h " + to_string(minutes) + "m "
           + to_string(remainingSeconds) + "s";
}

long long getTrackedSeconds(Todo todo) {
    long long trackedSeconds = todo.totalSeconds;

    if (timerIsRunning && todo.id == runningTodoID) {
        long long currentSeconds = chrono::duration_cast<chrono::seconds>(
            chrono::steady_clock::now() - timerStart).count();
        trackedSeconds = trackedSeconds + currentSeconds;
    }

    return trackedSeconds;
}

void printTodoTableHeader() {
    cout << left << setw(6) << "ID"
         << setw(13) << "STATUS"
         << setw(34) << "QUEST"
         << setw(18) << "CATEGORY"
         << setw(16) << "DUE DATE"
         << setw(16) << "FOCUS TIME"
         << "XP" << endl;
    cout << string(111, '-') << endl;
}

void printTodoRow(Todo todo) {
    string status;

    if (todo.completed) {
        status = "COMPLETE";
    } else {
        status = "OPEN";
    }

    string dueDate = formatDueDateForDisplay(todo.dueDate);
    long long trackedSeconds = getTrackedSeconds(todo);

    cout << left << setw(6) << todo.id
         << setw(13) << status
         << setw(34) << shortenText(todo.task, 31)
         << setw(18) << shortenText(todo.category, 15)
         << setw(16) << dueDate
         << setw(16) << formatTime(trackedSeconds)
         << getXPForTime(trackedSeconds) << endl;

    if (timerIsRunning && todo.id == runningTodoID) {
        cout << "      >>> TIMER RUNNING FOR THIS QUEST <<<" << endl;
    }

    if (!todo.description.empty()) {
        cout << "      Details: " << todo.description << endl;
    }
}

void showTodos() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    printSection("QUEST LOG");
    printTodoTableHeader();

    for (size_t i = 0; i < todos.size(); i++) {
        printTodoRow(todos[i]);
    }

    cout << string(111, '-') << endl;
    cout << "  Task XP: " << getTotalXP(todos)
         << "    |    Ritual XP: " << getTotalHabitXP()
         << "    |    Total XP: " << getTotalXP(todos) + getTotalHabitXP() << endl;
}

void showTodosByCategory() {
    vector<string> categories;

    for (size_t i = 0; i < todos.size(); i++) {
        bool categoryAlreadyListed = false;

        for (size_t j = 0; j < categories.size(); j++) {
            if (categories[j] == todos[i].category) {
                categoryAlreadyListed = true;
            }
        }

        if (!categoryAlreadyListed) {
            categories.push_back(todos[i].category);
        }
    }

    sort(categories.begin(), categories.end());

    printSection("QUESTS BY CATEGORY");

    for (size_t i = 0; i < categories.size(); i++) {
        cout << "  " << categories[i] << endl;
        printTodoTableHeader();

        for (size_t j = 0; j < todos.size(); j++) {
            if (todos[j].category == categories[i]) {
                printTodoRow(todos[j]);
            }
        }

        cout << string(111, '-') << endl;
        cout << endl;
    }
}

void viewQuests() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    showTodos();
    cout << endl;

    printSection("QUEST LOG OPTIONS");
    printMenuItem(1, "View all quests by category");
    printMenuItem(2, "Return to the command console");
    cout << endl;

    int choice = getNumber("Choose an option (1-2): ");

    if (choice != 1) {
        return;
    }

    showTodosByCategory();
    waitForEnter();
}

void showXPSummary() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    printSection("XP SUMMARY");
    cout << "Task XP: " << getTotalXP(todos) << endl;
    cout << "Ritual XP: " << getTotalHabitXP() << endl;
    cout << "Total XP: " << getTotalXP(todos) + getTotalHabitXP() << endl;
    cout << "Earn 1 XP for every full minute tracked." << endl;
    cout << endl;

    for (size_t i = 0; i < todos.size(); i++) {
        cout << "  " << left << setw(35) << shortenText(todos[i].task, 32)
             << getXPForTime(getTrackedSeconds(todos[i])) << " XP" << endl;
    }
}

void stopTimer() {
    if (!timerIsRunning) {
        cout << "There is no timer running." << endl;
        return;
    }

    int index = findTodoByID(runningTodoID);

    if (index == -1) {
        timerIsRunning = false;
        runningTodoID = -1;
        cout << "The running task could not be found." << endl;
        return;
    }

    long long elapsedSeconds = chrono::duration_cast<chrono::seconds>(
        chrono::steady_clock::now() - timerStart).count();
    todos[index].totalSeconds = todos[index].totalSeconds + elapsedSeconds;
    timerIsRunning = false;
    runningTodoID = -1;
    saveTodos();

    cout << "Timer stopped. Added " << formatTime(elapsedSeconds) << " to "
         << todos[index].task << "." << endl;
}

void startTimer() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    if (timerIsRunning) {
        int index = findTodoByID(runningTodoID);

        if (index != -1) {
            cout << "A timer is already running for " << todos[index].task << "." << endl;
        }

        return;
    }

    showTodos();
    int id = getNumber("Enter the task ID to start timing: ");
    int index = findTodoByID(id);

    if (index == -1) {
        cout << "Task not found." << endl;
        return;
    }

    if (todos[index].completed) {
        cout << "You cannot start a timer for a completed task." << endl;
        return;
    }

    runningTodoID = id;
    timerStart = chrono::steady_clock::now();
    timerIsRunning = true;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');

    clearScreen();
    printHeader();
    printSection("FOCUS SESSION ACTIVE");
    cout << "  Current quest: " << todos[index].task << endl;
    cout << "  Category: " << todos[index].category << endl;
    cout << "  Due date: " << formatDueDateForDisplay(todos[index].dueDate) << endl;
    cout << endl;
    cout << "  Your timer is running. Stay with the quest." << endl;
    cout << "  Press Enter when you are ready to finish this focus session." << endl;

    cin.get();
    stopTimer();
}

void addTodo() {
    Todo todo;
    todo.id = nextID;
    todo.completed = false;
    todo.totalSeconds = 0;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cout << "Enter a task: ";
    getline(cin, todo.task);

    if (todo.task.empty()) {
        cout << "Task cannot be blank." << endl;
        return;
    }

    cout << "Enter a category (class name, Work, College, etc.): ";
    getline(cin, todo.category);

    if (todo.category.empty()) {
        cout << "Category cannot be blank." << endl;
        return;
    }

    cout << "Enter a description (optional): ";
    getline(cin, todo.description);

    todo.dueDate = getDueDate("Enter due date (YYYY-MM-DD, day number, today, tomorrow, or tmrw): ");

    todos.push_back(todo);
    nextID++;
    saveTodos();
    cout << "Task added." << endl;
}

void completeTodo() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    showTodos();
    int id = getNumber("Enter the task ID to mark complete: ");
    int index = findTodoByID(id);

    if (index == -1) {
        cout << "Task not found." << endl;
        return;
    }

    if (todos[index].completed) {
        cout << "That task is already complete." << endl;
        return;
    }

    if (timerIsRunning && runningTodoID == id) {
        stopTimer();
    }

    todos[index].completed = true;
    saveTodos();
    cout << "Task marked complete." << endl;
}

void editTodo() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    showTodos();
    int id = getNumber("Enter the task ID to edit: ");
    int index = findTodoByID(id);

    if (index == -1) {
        cout << "Task not found." << endl;
        return;
    }

    string newTask;
    string newCategory;
    string newDescription;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cout << "Enter the new quest title: ";
    getline(cin, newTask);

    if (newTask.empty()) {
        cout << "Task cannot be blank." << endl;
        return;
    }

    cout << "Enter the new category: ";
    getline(cin, newCategory);

    if (newCategory.empty()) {
        cout << "Category cannot be blank." << endl;
        return;
    }

    cout << "Enter the new description (press Enter to clear it): ";
    getline(cin, newDescription);

    todos[index].task = newTask;
    todos[index].category = newCategory;
    todos[index].description = newDescription;
    saveTodos();
    cout << "Task updated." << endl;
}

void editDueDate() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    showTodos();
    int id = getNumber("Enter the task ID to change its due date: ");
    int index = findTodoByID(id);

    if (index == -1) {
        cout << "Task not found." << endl;
        return;
    }

    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    todos[index].dueDate = getDueDate("Enter a due date (YYYY-MM-DD, day number, today, tomorrow, or tmrw), or press Enter to clear it: ");
    saveTodos();
    cout << "Due date updated." << endl;
}

void removeTodo() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    showTodos();
    int id = getNumber("Enter the task ID to remove: ");
    int index = findTodoByID(id);

    if (index == -1) {
        cout << "Task not found." << endl;
        return;
    }

    if (timerIsRunning && runningTodoID == id) {
        stopTimer();
    }

    todos.erase(todos.begin() + index);
    saveTodos();
    cout << "Task removed." << endl;
}

int main() {
    setupDatabase();

    loadTodos();
    loadHabits();

    int choice;

    do {
        clearScreen();
        printHeader();
        showDashboard();
        printSection("COMMAND CONSOLE");
        printMenuItem(1, "Create a new quest");
        printMenuItem(2, "Open the quest log");
        printMenuItem(3, "Mark a quest complete");
        printMenuItem(4, "Edit a quest");
        printMenuItem(5, "Change a due date");
        printMenuItem(6, "Begin a focus session");
        printMenuItem(7, "Remove a quest");
        printMenuItem(8, "Save your progress");
        printMenuItem(9, "View XP summary");
        printMenuItem(10, "Open daily rituals");
        printMenuItem(11, "Exit Todo Quest");
        cout << endl;
        choice = getNumber("Choose a command (1-11): ");

        if (choice == 1) {
            addTodo();
        } else if (choice == 2) {
            viewQuests();
        } else if (choice == 3) {
            completeTodo();
        } else if (choice == 4) {
            editTodo();
        } else if (choice == 5) {
            editDueDate();
        } else if (choice == 6) {
            startTimer();
        } else if (choice == 7) {
            removeTodo();
        } else if (choice == 8) {
            saveTodos();
            cout << "Tasks saved." << endl;
        } else if (choice == 9) {
            showXPSummary();
            waitForEnter();
        } else if (choice == 10) {
            habitMenu();
        } else if (choice == 11) {
            if (timerIsRunning) {
                stopTimer();
            }

            saveTodos();
            cout << "Good Bye!" << endl;
        } else {
            cout << "Invalid choice. Try again." << endl;
        }

        cout << endl;
    } while (choice != 11);

    return 0;
}
