#include <iostream>
#include <memory>
#include <vector>

class Shape {
  public:
    virtual ~Shape() = default;
    virtual double area() const = 0;
};

class Rectangle : public Shape {
  public:
    Rectangle(double w, double h) : w_(w), h_(h) {}
    double area() const override { return w_ * h_; }

  private:
    double w_;
    double h_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Rectangle>(3.0, 4.0));

    std::cout << "Day 06 - Inheritance and Polymorphism\n";
    std::cout << "First area: " << shapes.front()->area() << "\n";
    return 0;
}
