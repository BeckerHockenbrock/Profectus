#include "DateFunctions.h"

#include <ctime>
#include <iostream>
#include <string>

using namespace std;

bool isValidDate(string dueDate) {
    if (dueDate.length() != 10 || dueDate[4] != '-' || dueDate[7] != '-') {
        return false;
    }

    for (size_t i = 0; i < dueDate.length(); i++) {
        if (i != 4 && i != 7) {
            if (dueDate[i] < '0' || dueDate[i] > '9') {
                return false;
            }
        }
    }

    int year = stoi(dueDate.substr(0, 4));
    int month = stoi(dueDate.substr(5, 2));
    int day = stoi(dueDate.substr(8, 2));

    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }

    int daysInMonth[] = { 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 };
    bool leapYear = (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;

    if (month == 2 && leapYear) {
        return day <= 29;
    }

    if (day > daysInMonth[month - 1]) {
        return false;
    }

    return true;
}

string formatDate(int year, int month, int day) {
    string monthString = to_string(month);
    string dayString = to_string(day);

    if (month < 10) {
        monthString = "0" + monthString;
    }

    if (day < 10) {
        dayString = "0" + dayString;
    }

    return to_string(year) + "-" + monthString + "-" + dayString;
}

string getDateFromToday(int daysToAdd) {
    time_t now = time(0);
    tm date = *localtime(&now);

    date.tm_mday = date.tm_mday + daysToAdd;
    mktime(&date);

    return formatDate(date.tm_year + 1900, date.tm_mon + 1, date.tm_mday);
}

string getTodayDate() {
    return getDateFromToday(0);
}

void makeLowerCase(string& text) {
    for (size_t i = 0; i < text.length(); i++) {
        if (text[i] >= 'A' && text[i] <= 'Z') {
            text[i] = text[i] + ('a' - 'A');
        }
    }
}

bool isDayNumber(string dueDate) {
    if (dueDate.empty() || dueDate.length() > 2) {
        return false;
    }

    for (size_t i = 0; i < dueDate.length(); i++) {
        if (dueDate[i] < '0' || dueDate[i] > '9') {
            return false;
        }
    }

    int day = stoi(dueDate);
    return day >= 1 && day <= 31;
}

string getDueDate(string prompt) {
    string dueDate;

    cout << prompt;
    getline(cin, dueDate);

    while (!dueDate.empty()) {
        makeLowerCase(dueDate);

        if (dueDate == "today") {
            return getDateFromToday(0);
        }

        if (dueDate == "tomorrow" || dueDate == "tmrw") {
            return getDateFromToday(1);
        }

        if (isDayNumber(dueDate)) {
            time_t now = time(0);
            tm date = *localtime(&now);
            int year = date.tm_year + 1900;
            int month = date.tm_mon + 1;
            string dayDate = formatDate(year, month, stoi(dueDate));

            if (isValidDate(dayDate)) {
                return dayDate;
            }

            cout << "That day is not in the current month. Try again: ";
        } else if (isValidDate(dueDate)) {
            return dueDate;
        } else {
            cout << "Use YYYY-MM-DD, a day number, today, tomorrow, tmrw, or press Enter to skip: ";
        }

        getline(cin, dueDate);
    }

    return "";
}
