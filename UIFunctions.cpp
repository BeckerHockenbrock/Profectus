#include "UIFunctions.h"

#include <iostream>
#include <string>

using namespace std;

const string RESET = "\033[0m";
const string WHITE = "\033[38;5;255m";
const string ICE_BLUE = "\033[38;5;117m";
const string SILVER = "\033[38;5;251m";
const string MUTED = "\033[38;5;245m";

void clearScreen() {
    cout << "\033[2J\033[H";
}

void printHeader() {
    cout << MUTED;
    cout << "====================================================================================================" << endl;
    cout << WHITE;
    cout << "     _______ ____  _____   ____        ____  _    _ ______  _____ _______" << endl;
    cout << "    |__   __/ __ \\|  __ \\ / __ \\      / __ \\| |  | |  ____|/ ____|__   __|" << endl;
    cout << "       | | | |  | | |  | | |  | |    | |  | | |  | | |__  | (___    | |" << endl;
    cout << "       | | | |  | | |  | | |  | |    | |  | | |  | |  __|  \\___ \\   | |" << endl;
    cout << "       | | | |__| | |__| | |__| |    | |__| | |__| | |____ ____) |  | |" << endl;
    cout << "       |_|  \\____/|_____/ \\____/      \\___\\_\\____/|______|_____/   |_|" << endl;
    cout << MUTED;
    cout << "====================================================================================================" << endl;
    cout << ICE_BLUE << "                    Focus clearly. Progress quietly. Level up deliberately." << RESET << endl;
    cout << endl;
}

void printSection(string title) {
    cout << ICE_BLUE << "  " << title << " " << string(84 - title.length(), '-') << RESET << endl;
}

void printMenuItem(int number, string label) {
    cout << "  " << ICE_BLUE << number << "." << RESET << "  " << SILVER << label << RESET << endl;
}

void printMessage(string message) {
    cout << SILVER << message << RESET << endl;
}
