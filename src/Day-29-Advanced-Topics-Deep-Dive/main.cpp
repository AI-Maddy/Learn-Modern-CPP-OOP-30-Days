#include <iostream>
#include <string>
#include <variant>

using Value = std::variant<int, double, std::string>;

int main() {
    Value v = std::string{"deep-dive"};
    std::cout << "Day 29 - Advanced Topics Deep Dive\n";
    std::visit([](const auto& item) { std::cout << item << "\n"; }, v);
    return 0;
}
