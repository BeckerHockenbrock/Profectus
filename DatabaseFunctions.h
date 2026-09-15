#ifndef DATABASE_FUNCTIONS_H
#define DATABASE_FUNCTIONS_H

#include <vector>

#include "Habit.h"
#include "Todo.h"

void setupDatabase();

void saveTodosToDatabase(const std::vector<Todo>& todos);
void loadTodosFromDatabase(std::vector<Todo>& todos, int& nextID);

void saveHabitsToDatabase(const std::vector<Habit>& habits);
void loadHabitsFromDatabase(std::vector<Habit>& habits, int& nextHabitID);

#endif
