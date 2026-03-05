#include <iostream>
#include <string>
#include <vector>

struct Record {
    std::string name;
    int score;
};

int main() {
    std::vector<Record> records;
    records.reserve(3);
    records.emplace_back(Record{"alpha", 90});
    records.emplace_back(Record{"beta", 95});
    records.emplace_back(Record{"gamma", 88});

    std::cout << "Day 22 - Performance Tips OOP\n";
    for (const auto& record : records) {
        std::cout << record.name << ':' << record.score << "\n";
    }
    return 0;
}
