#include "ProgressionFunctions.h"

using namespace std;

int getXPForTime(long long totalSeconds) {
    return totalSeconds / 60;
}

int getTotalXP(const vector<Todo>& todos) {
    int totalXP = 0;

    for (size_t i = 0; i < todos.size(); i++) {
        totalXP = totalXP + getXPForTime(todos[i].totalSeconds);
    }

    return totalXP;
}
