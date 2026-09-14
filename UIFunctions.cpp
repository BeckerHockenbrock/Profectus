#include "UIFunctions.h"

#include <iostream>
#include <string>

using namespace std;

const string RESET = "\033[0m";
const string PURPLE = "\033[38;5;141m";
const string CYAN = "\033[38;5;51m";
const string GOLD = "\033[38;5;220m";
const string GREEN = "\033[38;5;82m";
const string DIM = "\033[38;5;245m";

void clearScreen() {
    cout << "\033[2J\033[H";
}

void printHeader() {
    cout << PURPLE;
    cout << "====================================================================================================" << endl;
    cout << "  _______ ____  _____   ____        ____  _    _ ______  _____ _______ " << endl;
    cout << " |__   __/ __ \\|  __ \\ / __ \\      / __ \\| |  | |  ____|/ ____|__   __|" << endl;
    cout << "    | | | |  | | |  | | |  | |    | |  | | |  | | |__  | (___    | |   " << endl;
    cout << "    | | | |  | | |  | | |  | |    | |  | | |  | |  __|  \\___ \\   | |   " << endl;
    cout << "    | | | |__| | |__| | |__| |    | |__| | |__| | |____ ____) |  | |   " << endl;
    cout << "    |_|  \\____/|_____/ \\____/      \\___\\_\\____/|______|_____/   |_|   " << endl;
    cout << "====================================================================================================" << endl;
    cout << CYAN << "       QUEST TRACKER  //  FOCUS ENGINE  //  TURN YOUR TIME INTO EXPERIENCE" << RESET << endl;
    cout << endl;
}

void printSection(string title) {
    cout << GOLD << "--[ " << title << " ]" << string(78 - title.length(), '-') << RESET << endl;
}

void printMenuItem(int number, string label) {
    cout << "  " << PURPLE << "[" << number << "]" << RESET << "  " << label << endl;
}

void printMessage(string message) {
    cout << GREEN << message << RESET << endl;
}
