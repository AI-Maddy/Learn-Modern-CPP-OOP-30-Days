#include <iostream>
#include <utility>
#include <vector>

class Buffer {
  public:
    explicit Buffer(std::size_t n) : data_(n, 0) {}
    Buffer(Buffer&& other) noexcept : data_(std::move(other.data_)) {}
    Buffer& operator=(Buffer&& other) noexcept {
        data_ = std::move(other.data_);
        return *this;
    }

    std::size_t size() const { return data_.size(); }

  private:
    std::vector<int> data_;
};

int main() {
    Buffer a{1024};
    Buffer b{1};
    b = std::move(a);
    std::cout << "Day 13 - Move Semantics and Rvalue Refs\n";
    std::cout << "Moved buffer size: " << b.size() << "\n";
    return 0;
}
