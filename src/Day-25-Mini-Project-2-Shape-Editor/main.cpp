#include <cmath>
#include <iostream>
#include <memory>
#include <vector>

class Shape {
  public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
};

class Circle : public Shape {
  public:
    explicit Circle(double r) : r_(r) {}
    double area() const override { return 3.1415926535 * r_ * r_; }

  private:
    double r_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> canvas;
    canvas.push_back(std::make_unique<Circle>(2.0));
    std::cout << "Day 25 - Mini Project Shape Editor\n";
    std::cout << "Area: " << canvas.front()->area() << "\n";
    return 0;
}
