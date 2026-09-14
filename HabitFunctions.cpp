#include "HabitFunctions.h"

#include <iomanip>
#include <iostream>
#include <limits>
#include <string>
#include <vector>

#include "DateFunctions.h"
#include "DatabaseFunctions.h"
#include "Habit.h"
#include "UIFunctions.h"

using namespace std;

vector<Habit> habits;
int nextHabitID = 1;

int getHabitNumber(string prompt) {
    int number;

    cout << prompt;

    while (!(cin >> number)) {
        cout << "Please enter a whole number. Try again: ";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
    }

    return number;
}

void saveHabits() {
    saveHabitsToDatabase(habits);
}

void loadHabits() {
    loadHabitsFromDatabase(habits, nextHabitID);
}

int findHabitByID(int id) {
    for (size_t i = 0; i < habits.size(); i++) {
        if (habits[i].id == id) {
            return i;
        }
    }

    return -1;
}

string shortenHabitName(string name, int maxLength) {
    if (name.length() <= static_cast<size_t>(maxLength)) {
        return name;
    }

    return name.substr(0, maxLength - 3) + "...";
}

int getTotalHabitXP() {
    int totalXP = 0;

    for (size_t i = 0; i < habits.size(); i++) {
        totalXP = totalXP + habits[i].xpReward * habits[i].totalCheckIns;
    }

    return totalXP;
}

void showHabits() {
    if (habits.size() == 0) {
        printSection("RITUALS");
        cout << "  No rituals yet. Create one and check in every day." << endl;
        return;
    }

    printSection("DAILY RITUALS");
    cout << left << setw(6) << "ID"
         << setw(32) << "RITUAL"
         << setw(10) << "XP"
         << setw(12) << "STREAK"
         << setw(12) << "BEST"
         << "TODAY" << endl;
    cout << string(86, '-') << endl;

    string today = getTodayDate();

    for (size_t i = 0; i < habits.size(); i++) {
        string todayStatus = habits[i].lastCheckedIn == today ? "DONE" : "READY";

        cout << left << setw(6) << habits[i].id
             << setw(32) << shortenHabitName(habits[i].name, 29)
             << setw(10) << habits[i].xpReward
             << setw(12) << habits[i].currentStreak
             << setw(12) << habits[i].bestStreak
             << todayStatus << endl;
    }

    cout << string(86, '-') << endl;
    cout << "  Ritual XP earned: " << getTotalHabitXP() << endl;
}

void addHabit() {
    Habit habit;
    habit.id = nextHabitID;
    habit.currentStreak = 0;
    habit.bestStreak = 0;
    habit.totalCheckIns = 0;
    habit.lastCheckedIn = "";

    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cout << "Name your daily ritual: ";
    getline(cin, habit.name);

    if (habit.name.empty()) {
        cout << "Ritual name cannot be blank." << endl;
        return;
    }

    habit.xpReward = getHabitNumber("XP reward for each check-in: ");

    while (habit.xpReward < 1 || habit.xpReward > 100) {
        habit.xpReward = getHabitNumber("Choose an XP reward from 1 to 100: ");
    }

    habits.push_back(habit);
    nextHabitID++;
    saveHabits();
    cout << "Daily ritual added." << endl;
}

void checkInHabit() {
    if (habits.size() == 0) {
        cout << "Create a ritual before checking in." << endl;
        return;
    }

    showHabits();
    int id = getHabitNumber("Enter the ritual ID to check in: ");
    int index = findHabitByID(id);

    if (index == -1) {
        cout << "Ritual not found." << endl;
        return;
    }

    string today = getTodayDate();

    if (habits[index].lastCheckedIn == today) {
        cout << "You already checked in for this ritual today." << endl;
        return;
    }

    if (habits[index].lastCheckedIn == getDateFromToday(-1)) {
        habits[index].currentStreak++;
    } else {
        habits[index].currentStreak = 1;
    }

    if (habits[index].currentStreak > habits[index].bestStreak) {
        habits[index].bestStreak = habits[index].currentStreak;
    }

    habits[index].lastCheckedIn = today;
    habits[index].totalCheckIns++;
    saveHabits();

    cout << "Ritual complete. You earned " << habits[index].xpReward << " XP." << endl;
}

void waitForHabitEnter() {
    cout << endl;
    cout << "Press Enter to return to the ritual menu." << endl;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
    cin.get();
}

void habitMenu() {
    int choice;

    do {
        clearScreen();
        printHeader();
        printSection("RITUALS");
        cout << "  Daily check-ins build streaks and award a custom amount of XP." << endl;
        cout << endl;
        printMenuItem(1, "Create a daily ritual");
        printMenuItem(2, "View daily rituals");
        printMenuItem(3, "Check in for today");
        printMenuItem(4, "Return to Todo Quest");
        cout << endl;
        choice = getHabitNumber("Choose a ritual command (1-4): ");

        if (choice == 1) {
            addHabit();
        } else if (choice == 2) {
            showHabits();
            waitForHabitEnter();
        } else if (choice == 3) {
            checkInHabit();
        } else if (choice != 4) {
            cout << "Invalid choice. Try again." << endl;
        }

    } while (choice != 4);
}
