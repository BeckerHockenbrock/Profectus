#ifndef HABIT_H
#define HABIT_H

#include <string>

struct Habit {
    int id;
    std::string name;
    int xpReward;
    std::string lastCheckedIn;
    int currentStreak;
    int bestStreak;
    int totalCheckIns;
};

#endif
