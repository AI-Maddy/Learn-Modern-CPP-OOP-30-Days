#include <iostream>
#include <map>
#include <string>

int main() {
    std::map<std::string, int> confidence{{"OOP", 8}, {"Templates", 7}, {"Ranges", 6}};
    std::cout << "Day 30 - Review and Next Steps\n";
    for (const auto& [topic, score] : confidence) {
        std::cout << topic << " confidence=" << score << "/10\n";
    }
    return 0;
}
