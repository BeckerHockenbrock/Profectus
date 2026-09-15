#include "DatabaseFunctions.h"

#include <iostream>
#include <sqlite3.h>
#include <string>

using namespace std;

const string DATABASE_FILE = "todoQuest.db";

sqlite3* openDatabase() {
    sqlite3* database = nullptr;

    if (sqlite3_open(DATABASE_FILE.c_str(), &database) != SQLITE_OK) {
        cout << "Could not open the Todo Quest database." << endl;
        sqlite3_close(database);
        return nullptr;
    }

    return database;
}

bool runSQL(sqlite3* database, const string& sql) {
    char* errorMessage = nullptr;
    int result = sqlite3_exec(database, sql.c_str(), nullptr, nullptr, &errorMessage);

    if (result != SQLITE_OK) {
        cout << "Database error: " << errorMessage << endl;
        sqlite3_free(errorMessage);
        return false;
    }

    return true;
}

bool todoColumnExists(sqlite3* database, const string& columnName) {
    sqlite3_stmt* statement = nullptr;
    bool foundColumn = false;

    if (sqlite3_prepare_v2(database, "PRAGMA table_info(todos);", -1, &statement, nullptr) == SQLITE_OK) {
        while (sqlite3_step(statement) == SQLITE_ROW) {
            string currentColumn = reinterpret_cast<const char*>(sqlite3_column_text(statement, 1));

            if (currentColumn == columnName) {
                foundColumn = true;
                break;
            }
        }
    }

    sqlite3_finalize(statement);
    return foundColumn;
}

void setupDatabase() {
    sqlite3* database = openDatabase();

    if (database == nullptr) {
        return;
    }

    runSQL(database,
        "CREATE TABLE IF NOT EXISTS todos ("
        "id INTEGER PRIMARY KEY, "
        "task TEXT NOT NULL, "
        "description TEXT NOT NULL, "
        "category TEXT NOT NULL, "
        "completed INTEGER NOT NULL, "
        "due_date TEXT, "
        "total_seconds INTEGER NOT NULL);");

    if (!todoColumnExists(database, "description")) {
        runSQL(database, "ALTER TABLE todos ADD COLUMN description TEXT NOT NULL DEFAULT '';");
    }

    if (!todoColumnExists(database, "category")) {
        runSQL(database, "ALTER TABLE todos ADD COLUMN category TEXT NOT NULL DEFAULT 'General';");
    }

    runSQL(database,
        "CREATE TABLE IF NOT EXISTS habits ("
        "id INTEGER PRIMARY KEY, "
        "name TEXT NOT NULL, "
        "xp_reward INTEGER NOT NULL, "
        "last_checked_in TEXT, "
        "current_streak INTEGER NOT NULL, "
        "best_streak INTEGER NOT NULL, "
        "total_check_ins INTEGER NOT NULL);");

    sqlite3_close(database);
}

void saveTodosToDatabase(const vector<Todo>& todos) {
    sqlite3* database = openDatabase();

    if (database == nullptr) {
        return;
    }

    runSQL(database, "BEGIN TRANSACTION;");
    runSQL(database, "DELETE FROM todos;");

    sqlite3_stmt* statement = nullptr;
    string sql = "INSERT INTO todos (id, task, description, category, completed, due_date, total_seconds) VALUES (?, ?, ?, ?, ?, ?, ?);";

    if (sqlite3_prepare_v2(database, sql.c_str(), -1, &statement, nullptr) == SQLITE_OK) {
        for (size_t i = 0; i < todos.size(); i++) {
            sqlite3_bind_int(statement, 1, todos[i].id);
            sqlite3_bind_text(statement, 2, todos[i].task.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(statement, 3, todos[i].description.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_text(statement, 4, todos[i].category.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_int(statement, 5, todos[i].completed);
            sqlite3_bind_text(statement, 6, todos[i].dueDate.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_int64(statement, 7, todos[i].totalSeconds);

            if (sqlite3_step(statement) != SQLITE_DONE) {
                cout << "Could not save a quest." << endl;
            }

            sqlite3_reset(statement);
            sqlite3_clear_bindings(statement);
        }
    } else {
        cout << "Could not prepare the quest save." << endl;
    }

    sqlite3_finalize(statement);
    runSQL(database, "COMMIT;");
    sqlite3_close(database);
}

void loadTodosFromDatabase(vector<Todo>& todos, int& nextID) {
    sqlite3* database = openDatabase();

    if (database == nullptr) {
        return;
    }

    sqlite3_stmt* statement = nullptr;
    string sql = "SELECT id, task, description, category, completed, due_date, total_seconds FROM todos ORDER BY id;";

    if (sqlite3_prepare_v2(database, sql.c_str(), -1, &statement, nullptr) == SQLITE_OK) {
        while (sqlite3_step(statement) == SQLITE_ROW) {
            Todo todo;
            todo.id = sqlite3_column_int(statement, 0);
            todo.task = reinterpret_cast<const char*>(sqlite3_column_text(statement, 1));
            todo.description = reinterpret_cast<const char*>(sqlite3_column_text(statement, 2));
            todo.category = reinterpret_cast<const char*>(sqlite3_column_text(statement, 3));
            todo.completed = sqlite3_column_int(statement, 4);
            todo.dueDate = reinterpret_cast<const char*>(sqlite3_column_text(statement, 5));
            todo.totalSeconds = sqlite3_column_int64(statement, 6);
            todos.push_back(todo);

            if (todo.id >= nextID) {
                nextID = todo.id + 1;
            }
        }
    } else {
        cout << "Could not load quests from the database." << endl;
    }

    sqlite3_finalize(statement);
    sqlite3_close(database);
}

void saveHabitsToDatabase(const vector<Habit>& habits) {
    sqlite3* database = openDatabase();

    if (database == nullptr) {
        return;
    }

    runSQL(database, "BEGIN TRANSACTION;");
    runSQL(database, "DELETE FROM habits;");

    sqlite3_stmt* statement = nullptr;
    string sql = "INSERT INTO habits (id, name, xp_reward, last_checked_in, current_streak, best_streak, total_check_ins) VALUES (?, ?, ?, ?, ?, ?, ?);";

    if (sqlite3_prepare_v2(database, sql.c_str(), -1, &statement, nullptr) == SQLITE_OK) {
        for (size_t i = 0; i < habits.size(); i++) {
            sqlite3_bind_int(statement, 1, habits[i].id);
            sqlite3_bind_text(statement, 2, habits[i].name.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_int(statement, 3, habits[i].xpReward);
            sqlite3_bind_text(statement, 4, habits[i].lastCheckedIn.c_str(), -1, SQLITE_TRANSIENT);
            sqlite3_bind_int(statement, 5, habits[i].currentStreak);
            sqlite3_bind_int(statement, 6, habits[i].bestStreak);
            sqlite3_bind_int(statement, 7, habits[i].totalCheckIns);

            if (sqlite3_step(statement) != SQLITE_DONE) {
                cout << "Could not save a ritual." << endl;
            }

            sqlite3_reset(statement);
            sqlite3_clear_bindings(statement);
        }
    } else {
        cout << "Could not prepare the ritual save." << endl;
    }

    sqlite3_finalize(statement);
    runSQL(database, "COMMIT;");
    sqlite3_close(database);
}

void loadHabitsFromDatabase(vector<Habit>& habits, int& nextHabitID) {
    sqlite3* database = openDatabase();

    if (database == nullptr) {
        return;
    }

    sqlite3_stmt* statement = nullptr;
    string sql = "SELECT id, name, xp_reward, last_checked_in, current_streak, best_streak, total_check_ins FROM habits ORDER BY id;";

    if (sqlite3_prepare_v2(database, sql.c_str(), -1, &statement, nullptr) == SQLITE_OK) {
        while (sqlite3_step(statement) == SQLITE_ROW) {
            Habit habit;
            habit.id = sqlite3_column_int(statement, 0);
            habit.name = reinterpret_cast<const char*>(sqlite3_column_text(statement, 1));
            habit.xpReward = sqlite3_column_int(statement, 2);
            habit.lastCheckedIn = reinterpret_cast<const char*>(sqlite3_column_text(statement, 3));
            habit.currentStreak = sqlite3_column_int(statement, 4);
            habit.bestStreak = sqlite3_column_int(statement, 5);
            habit.totalCheckIns = sqlite3_column_int(statement, 6);
            habits.push_back(habit);

            if (habit.id >= nextHabitID) {
                nextHabitID = habit.id + 1;
            }
        }
    } else {
        cout << "Could not load rituals from the database." << endl;
    }

    sqlite3_finalize(statement);
    sqlite3_close(database);
}
