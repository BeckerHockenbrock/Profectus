#ifndef TODO_H
#define TODO_H

#include <string>

struct Todo {
    int id;
    std::string task;
    bool completed;
    std::string dueDate;
    long long totalSeconds;
};

#endif
