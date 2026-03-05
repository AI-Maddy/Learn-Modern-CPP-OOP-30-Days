#include <algorithm>
#include <iostream>
#include <vector>

int main() {
    std::vector<int> nums{1, 2, 3, 4, 5, 6};
    int factor = 3;
    std::transform(nums.begin(), nums.end(), nums.begin(), [factor](int x) { return x * factor; });

    std::cout << "Day 02 - Functions and Lambdas\n";
    for (int value : nums) {
        std::cout << value << ' ';
    }
    std::cout << "\n";
    return 0;
}
