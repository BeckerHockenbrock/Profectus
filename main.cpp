#include <chrono>
#include <ctime>
#include <fstream>
#include <iostream>
#include <limits>
#include <sstream>
#include <string>
#include <vector>

using namespace std;

struct Todo {
    int id;
    string task;
    bool completed;
    string dueDate;
    long long totalSeconds;
};

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

bool isValidDate(string dueDate) {
    if (dueDate.length() != 10 || dueDate[4] != '-' || dueDate[7] != '-') {
        return false;
    }

    for (size_t i = 0; i < dueDate.length(); i++) {
        if (i != 4 && i != 7) {
            if (dueDate[i] < '0' || dueDate[i] > '9') {
                return false;
            }
        }
    }

    int year = stoi(dueDate.substr(0, 4));
    int month = stoi(dueDate.substr(5, 2));
    int day = stoi(dueDate.substr(8, 2));

    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }

    int daysInMonth[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
    bool leapYear = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;

    if (month == 2 && leapYear) {
        return day <= 29;
    }

    if (day > daysInMonth[month - 1]) {
        return false;
    }

    return true;
}

string formatDate(int year, int month, int day) {
    string monthString = to_string(month);
    string dayString = to_string(day);

    if (month < 10) {
        monthString = "0" + monthString;
    }

    if (day < 10) {
        dayString = "0" + dayString;
    }

    return to_string(year) + "-" + monthString + "-" + dayString;
}

string getDateFromToday(int daysToAdd) {
    time_t now = time(0);
    tm date = *localtime(&now);

    date.tm_mday = date.tm_mday + daysToAdd;
    mktime(&date);

    return formatDate(date.tm_year + 1900, date.tm_mon + 1, date.tm_mday);
}

void makeLowerCase(string& text) {
    for (size_t i = 0; i < text.length(); i++) {
        if (text[i] >= 'A' && text[i] <= 'Z') {
            text[i] = text[i] + ('a' - 'A');
        }
    }
}

bool isDayNumber(string dueDate) {
    if (dueDate.empty() || dueDate.length() > 2) {
        return false;
    }

    for (size_t i = 0; i < dueDate.length(); i++) {
        if (dueDate[i] < '0' || dueDate[i] > '9') {
            return false;
        }
    }

    int day = stoi(dueDate);
    return day >= 1 && day <= 31;
}

string getDueDate(string prompt) {
    string dueDate;

    cout << prompt;
    getline(cin, dueDate);

    while (!dueDate.empty()) {
        makeLowerCase(dueDate);

        if (dueDate == "today") {
            return getDateFromToday(0);
        }

        if (dueDate == "tomorrow" || dueDate == "tmrw") {
            return getDateFromToday(1);
        }

        if (isDayNumber(dueDate)) {
            time_t now = time(0);
            tm date = *localtime(&now);
            int year = date.tm_year + 1900;
            int month = date.tm_mon + 1;
            string dayDate = formatDate(year, month, stoi(dueDate));

            if (isValidDate(dayDate)) {
                return dayDate;
            }

            cout << "That day is not in the current month. Try again: ";
        } else if (isValidDate(dueDate)) {
            return dueDate;
        } else {
            cout << "Use YYYY-MM-DD, a day number, today, tomorrow, tmrw, or press Enter to skip: ";
        }

        getline(cin, dueDate);
    }

    return "";
}

void saveTodos() {
    ofstream file("todoData.txt");

    if (!file) {
        cout << "Could not open todoData.txt" << endl;
        return;
    }

    for (size_t i = 0; i < todos.size(); i++) {
        file << todos[i].id << "|" << todos[i].completed << "|"
             << todos[i].dueDate << "|" << todos[i].totalSeconds << "|"
             << todos[i].task << endl;
    }

    file.close();
}

void loadTodos() {
    ifstream file("todoData.txt");

    if (!file) {
        return;
    }

    string line;

    while (getline(file, line)) {
        string idString;
        string completedString;
        string savedDueDate;
        string savedTotalSeconds;
        string savedTask;
        Todo todo;
        stringstream ss(line);
        int separatorCount = 0;

        for (size_t i = 0; i < line.length(); i++) {
            if (line[i] == '|') {
                separatorCount++;
            }
        }

        getline(ss, idString, '|');
        getline(ss, completedString, '|');
        getline(ss, savedDueDate, '|');
        getline(ss, savedTotalSeconds, '|');
        getline(ss, savedTask);

        // Older saved tasks did not have a due date or tracked time.
        if (separatorCount == 2) {
            todo.dueDate = "";
            todo.task = savedDueDate;
            todo.totalSeconds = 0;
        } else if (separatorCount == 3) {
            todo.dueDate = savedDueDate;
            todo.task = savedTotalSeconds;
            todo.totalSeconds = 0;
        } else {
            todo.dueDate = savedDueDate;
            todo.task = savedTask;
            todo.totalSeconds = stoll(savedTotalSeconds);
        }

        if (idString.empty() || completedString.empty() || todo.task.empty()) {
            continue;
        }

        todo.id = stoi(idString);
        todo.completed = stoi(completedString);
        todos.push_back(todo);

        if (todo.id >= nextID) {
            nextID = todo.id + 1;
        }
    }

    file.close();
}

int findTodoByID(int id) {
    for (size_t i = 0; i < todos.size(); i++) {
        if (todos[i].id == id) {
            return i;
        }
    }

    return -1;
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

void showTodos() {
    if (todos.size() == 0) {
        cout << "Your todo list is empty." << endl;
        return;
    }

    cout << "Todo List" << endl;
    cout << "---------" << endl;

    for (size_t i = 0; i < todos.size(); i++) {
        cout << todos[i].id << ". ";

        if (todos[i].completed) {
            cout << "[Done] ";
        } else {
            cout << "[Open] ";
        }

        cout << todos[i].task;

        if (todos[i].dueDate.empty()) {
            cout << " - No due date";
        } else {
            cout << " - Due: " << todos[i].dueDate;
        }

        cout << " - Time: " << formatTime(getTrackedSeconds(todos[i]));

        if (timerIsRunning && todos[i].id == runningTodoID) {
            cout << " [Timer running]";
        }

        cout << endl;
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

    cout << endl;
    cout << "Timer Running" << endl;
    cout << "-------------" << endl;
    cout << "Task: " << todos[index].task << endl;
    cout << "Press Enter to stop the timer." << endl;

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

    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cout << "Enter the new task description: ";
    getline(cin, newTask);

    if (newTask.empty()) {
        cout << "Task cannot be blank." << endl;
        return;
    }

    todos[index].task = newTask;
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
    loadTodos();

    int choice;

    do {
        cout << "Todo App" << endl;
        cout << "1. Add a task" << endl;
        cout << "2. View all tasks" << endl;
        cout << "3. Mark a task complete" << endl;
        cout << "4. Edit a task" << endl;
        cout << "5. Change a due date" << endl;
        cout << "6. Start a timer" << endl;
        cout << "7. Remove a task" << endl;
        cout << "8. Save tasks" << endl;
        cout << "9. Exit" << endl;
        choice = getNumber("Enter your choice (1-9): ");

        if (choice == 1) {
            addTodo();
        } else if (choice == 2) {
            showTodos();
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
            if (timerIsRunning) {
                stopTimer();
            }

            saveTodos();
            cout << "Good Bye!" << endl;
        } else {
            cout << "Invalid choice. Try again." << endl;
        }

        cout << endl;
    } while (choice != 9);

    return 0;
}
