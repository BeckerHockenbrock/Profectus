#ifndef TODO_H
#define TODO_H

#include <string>

struct Todo {
    int id;
    std::string task;
    std::string description;
    std::string category;
    bool completed;
    std::string dueDate;
    long long totalSeconds;
};

#endif
