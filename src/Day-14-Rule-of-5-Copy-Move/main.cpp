#include <cstring>
#include <iostream>
#include <utility>

class Text {
  public:
    Text() : data_(new char[1]{'\0'}) {}

    explicit Text(const char* s) {
        std::size_t n = std::strlen(s);
        data_ = new char[n + 1];
        std::memcpy(data_, s, n + 1);
    }

    ~Text() { delete[] data_; }

    Text(const Text& other) : Text(other.data_) {}

    Text& operator=(const Text& other) {
        if (this != &other) {
            Text tmp(other);
            swap(tmp);
        }
        return *this;
    }

    Text(Text&& other) noexcept : data_(other.data_) { other.data_ = nullptr; }

    Text& operator=(Text&& other) noexcept {
        if (this != &other) {
            delete[] data_;
            data_ = other.data_;
            other.data_ = nullptr;
        }
        return *this;
    }

    void swap(Text& other) noexcept { std::swap(data_, other.data_); }
    const char* c_str() const { return data_ ? data_ : ""; }

  private:
    char* data_{};
};

int main() {
    Text a{"rule-of-five"};
    Text b = a;
    Text c = std::move(b);
    std::cout << "Day 14 - Rule of 5\n";
    std::cout << c.c_str() << "\n";
    return 0;
}
