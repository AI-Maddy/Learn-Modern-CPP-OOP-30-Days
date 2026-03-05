#include <chrono>
#include <iostream>
#include <string>

class ScopedTimer {
  public:
    explicit ScopedTimer(std::string label)
        : label_(std::move(label)), start_(std::chrono::steady_clock::now()) {}

    ~ScopedTimer() {
        const auto end = std::chrono::steady_clock::now();
        const auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(end - start_).count();
        std::cout << label_ << " took " << ms << " ms\n";
    }

  private:
    std::string label_;
    std::chrono::steady_clock::time_point start_;
};

int main() {
    std::cout << "Day 04 - Constructors, Destructors, RAII\n";
    ScopedTimer timer{"Loop"};
    volatile long long sink = 0;
    for (int i = 0; i < 100000; ++i) {
        sink += i;
    }
    return static_cast<int>(sink % 2);
}
