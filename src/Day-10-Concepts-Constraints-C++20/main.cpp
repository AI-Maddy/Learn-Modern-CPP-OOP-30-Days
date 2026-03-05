#include <concepts>
#include <iostream>

template <typename T>
concept Addable = requires(T a, T b) {
    { a + b } -> std::convertible_to<T>;
};

template <Addable T>
T combine(T a, T b) {
    return a + b;
}

int main() {
    std::cout << "Day 10 - Concepts and Constraints\n";
    std::cout << combine(10, 20) << "\n";
    return 0;
}
