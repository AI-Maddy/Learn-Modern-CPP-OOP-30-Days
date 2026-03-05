#include <iostream>
#include <string>

namespace inventory_api {
class Item {
  public:
    Item(std::string name, int qty) : name_(std::move(name)), qty_(qty) {}
    std::string summary() const { return name_ + ":" + std::to_string(qty_); }

  private:
    std::string name_;
    int qty_{};
};
}

int main() {
    inventory_api::Item item{"sensor", 8};
    std::cout << "Day 16 - Modules Basics (API boundary mindset)\n";
    std::cout << item.summary() << "\n";
    return 0;
}
