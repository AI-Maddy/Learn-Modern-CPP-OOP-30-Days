#include <cassert>
#include <iostream>

int add(int a, int b) { return a + b; }

int main() {
    std::cout << "Day 19 - Testing mindset\n";
    assert(add(2, 3) == 5);
    assert(add(-1, 1) == 0);
    std::cout << "Local assertions passed\n";
    return 0;
}
