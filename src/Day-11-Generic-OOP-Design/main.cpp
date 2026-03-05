#include <iostream>
#include <string>

template <typename T>
class Box {
  public:
    explicit Box(T value) : value_(std::move(value)) {}
    const T& get() const { return value_; }

  private:
    T value_;
};

int main() {
    Box<std::string> name{"Modern C++"};
    std::cout << "Day 11 - Generic OOP Design\n";
    std::cout << "Box holds: " << name.get() << "\n";
    return 0;
}
