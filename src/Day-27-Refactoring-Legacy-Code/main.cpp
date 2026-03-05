#include <iostream>
#include <numeric>
#include <vector>

double average(const std::vector<int>& values) {
    if (values.empty()) {
        return 0.0;
    }
    int total = std::accumulate(values.begin(), values.end(), 0);
    return static_cast<double>(total) / values.size();
}

int main() {
    std::vector<int> scores{70, 80, 90};
    std::cout << "Day 27 - Refactoring Legacy Code\n";
    std::cout << "Average=" << average(scores) << "\n";
    return 0;
}
