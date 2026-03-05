#include <iostream>
#include <memory>
#include <vector>

struct Node {
    explicit Node(int v) : value(v) {}
    int value;
};

int main() {
    std::cout << "Day 05 - Smart Pointers and Ownership\n";

    auto root = std::make_unique<Node>(42);
    auto shared = std::make_shared<Node>(7);
    std::vector<std::shared_ptr<Node>> cache{shared};

    std::cout << "root=" << root->value << ", shared use_count=" << shared.use_count() << "\n";
    return 0;
}
