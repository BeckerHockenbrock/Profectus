#ifndef DATE_FUNCTIONS_H
#define DATE_FUNCTIONS_H

#include <string>

bool isValidDate(std::string dueDate);
std::string getTodayDate();
std::string getDateFromToday(int daysToAdd);
std::string formatDueDateForDisplay(std::string dueDate);
std::string getDueDate(std::string prompt);

#endif
