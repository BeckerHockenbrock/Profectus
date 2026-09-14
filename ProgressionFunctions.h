#ifndef PROGRESSION_FUNCTIONS_H
#define PROGRESSION_FUNCTIONS_H

#include <vector>

#include "Todo.h"

int getXPForTime(long long totalSeconds);
int getTotalXP(const std::vector<Todo>& todos);

#endif
