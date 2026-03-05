#include <iostream>
#include <numeric>
#include <vector>

int main() {
    std::vector<int> values{1, 2, 3, 4, 5};
    int sum = std::accumulate(values.begin(), values.end(), 0);
    std::cout << "Day 00 - Setup and Basics\n";
    std::cout << "Values count: " << values.size() << "\n";
    std::cout << "Sum: " << sum << "\n";
    return 0;
}
