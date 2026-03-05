#include <functional>
#include <iostream>
#include <memory>

class Counter {
  public:
    Counter();
    ~Counter();
    void increment();
    int value() const;

  private:
    struct Impl;
    std::unique_ptr<Impl> impl_;
};

struct Counter::Impl {
    int n{0};
};

Counter::Counter() : impl_(std::make_unique<Impl>()) {}
Counter::~Counter() = default;
void Counter::increment() { ++impl_->n; }
int Counter::value() const { return impl_->n; }

int main() {
    std::function<int(int, int)> op = [](int a, int b) { return a + b; };
    Counter counter;
    counter.increment();
    std::cout << "Day 21 - PIMPL and Type Erasure\n";
    std::cout << "counter=" << counter.value() << ", op(2,3)=" << op(2, 3) << "\n";
    return 0;
}
