#include <iostream>
#include <string>

template <typename T>
T max_of(T a, T b) {
    return (a < b) ? b : a;
}

int main() {
    std::cout << "Day 09 - Templates Basics\n";
    std::cout << "max(4,9)=" << max_of(4, 9) << "\n";
    std::cout << "max(cat,dog)=" << max_of(std::string{"cat"}, std::string{"dog"}) << "\n";
    return 0;
}
