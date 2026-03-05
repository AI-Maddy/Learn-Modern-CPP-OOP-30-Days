#include <iostream>
#include <memory>
#include <string>

class Logger {
  public:
    virtual ~Logger() = default;
    virtual void log(const std::string& message) const = 0;
};

class ConsoleLogger : public Logger {
  public:
    void log(const std::string& message) const override { std::cout << "[console] " << message << "\n"; }
};

std::unique_ptr<Logger> make_logger() {
    return std::make_unique<ConsoleLogger>();
}

int main() {
    auto logger = make_logger();
    std::cout << "Day 17 - Design Patterns OOP\n";
    logger->log("factory-created logger");
    return 0;
}
