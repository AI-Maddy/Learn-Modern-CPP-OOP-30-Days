#include <iostream>
#include <memory>

class PricingStrategy {
  public:
    virtual ~PricingStrategy() = default;
    virtual double apply(double basePrice) const = 0;
};

class PercentageDiscount : public PricingStrategy {
  public:
    explicit PercentageDiscount(double ratio) : ratio_(ratio) {}
    double apply(double basePrice) const override { return basePrice * (1.0 - ratio_); }

  private:
    double ratio_;
};

class Checkout {
  public:
    explicit Checkout(std::unique_ptr<PricingStrategy> strategy) : strategy_(std::move(strategy)) {}
    double total(double basePrice) const { return strategy_->apply(basePrice); }

  private:
    std::unique_ptr<PricingStrategy> strategy_;
};

int main() {
    Checkout checkout{std::make_unique<PercentageDiscount>(0.15)};
    std::cout << "Day 08 - Advanced OOP Patterns\n";
    std::cout << "Total: " << checkout.total(200.0) << "\n";
    return 0;
}
