#include <iostream>

consteval int cube(int x) {
    return x * x * x;
}

int main() {
    constexpr int value = cube(4);
    std::cout << "Day 23 - Modern Features Preview\n";
    std::cout << "consteval cube(4)=" << value << "\n";
    return 0;
}
