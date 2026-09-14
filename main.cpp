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
};

vector<Todo> todos;
int nextID = 1;

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
    ofstream file("todoData.txt");

    if (!file) {
        cout << "Could not open todoData.txt" << endl;
        return;
    }

    for (size_t i = 0; i < todos.size(); i++) {
        file << todos[i].id << "|" << todos[i].completed << "|" << todos[i].task << endl;
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
        Todo todo;
        stringstream ss(line);

        getline(ss, idString, '|');
        getline(ss, completedString, '|');
        getline(ss, todo.task);

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

        cout << todos[i].task << endl;
    }
}

void addTodo() {
    Todo todo;
    todo.id = nextID;
    todo.completed = false;

    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cout << "Enter a task: ";
    getline(cin, todo.task);

    if (todo.task.empty()) {
        cout << "Task cannot be blank." << endl;
        return;
    }

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
        cout << "5. Remove a task" << endl;
        cout << "6. Save tasks" << endl;
        cout << "7. Exit" << endl;
        choice = getNumber("Enter your choice (1-7): ");

        if (choice == 1) {
            addTodo();
        } else if (choice == 2) {
            showTodos();
        } else if (choice == 3) {
            completeTodo();
        } else if (choice == 4) {
            editTodo();
        } else if (choice == 5) {
            removeTodo();
        } else if (choice == 6) {
            saveTodos();
            cout << "Tasks saved." << endl;
        } else if (choice == 7) {
            saveTodos();
            cout << "Good Bye!" << endl;
        } else {
            cout << "Invalid choice. Try again." << endl;
        }

        cout << endl;
    } while (choice != 7);

    return 0;
}
