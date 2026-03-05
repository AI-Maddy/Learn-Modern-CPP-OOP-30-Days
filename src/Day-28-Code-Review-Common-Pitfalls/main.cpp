#include <iostream>
#include <optional>
#include <vector>

std::optional<int> at_or_none(const std::vector<int>& values, std::size_t index) {
    if (index >= values.size()) {
        return std::nullopt;
    }
    return values[index];
}

int main() {
    std::vector<int> values{5, 10, 15};
    std::cout << "Day 28 - Code Review and Pitfalls\n";
    auto item = at_or_none(values, 2);
    std::cout << (item ? std::to_string(*item) : std::string{"none"}) << "\n";
    return 0;
}
