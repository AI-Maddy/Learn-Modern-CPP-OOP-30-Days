#include <array>
#include <iostream>

constexpr int square(int x) { return x * x; }

int main() {
    constexpr int side = 6;
    constexpr int area = square(side);
    std::array<int, 3> dims{2, 3, 4};

    std::cout << "Day 01 - Variables, Types, Constexpr\n";
    std::cout << "Compile-time area: " << area << "\n";
    std::cout << "Dims: " << dims[0] << ", " << dims[1] << ", " << dims[2] << "\n";
    return 0;
}
