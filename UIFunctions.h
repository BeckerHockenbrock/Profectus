#ifndef UI_FUNCTIONS_H
#define UI_FUNCTIONS_H

#include <string>

void clearScreen();
void printHeader();
void printSection(std::string title);
void printMenuItem(int number, std::string label);
void printMessage(std::string message);

#endif
