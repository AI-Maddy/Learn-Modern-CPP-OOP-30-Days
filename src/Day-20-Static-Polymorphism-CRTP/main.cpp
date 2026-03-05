#include <iostream>

template <typename Derived>
class AnimalBase {
  public:
    void speak() const { static_cast<const Derived*>(this)->speak_impl(); }
};

class Dog : public AnimalBase<Dog> {
  public:
    void speak_impl() const { std::cout << "woof\n"; }
};

int main() {
    Dog dog;
    std::cout << "Day 20 - Static Polymorphism and CRTP\n";
    dog.speak();
    return 0;
}
