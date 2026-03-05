#include <iostream>
#include <ranges>
#include <vector>

int main() {
    std::vector<int> nums{1, 2, 3, 4, 5, 6};
    auto pipeline = nums
        | std::views::filter([](int x) { return x % 2 == 0; })
        | std::views::transform([](int x) { return x * x; });

    std::cout << "Day 12 - Ranges and Views\n";
    for (int value : pipeline) {
        std::cout << value << ' ';
    }
    std::cout << "\n";
    return 0;
}
