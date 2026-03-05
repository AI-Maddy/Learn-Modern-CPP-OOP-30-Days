#include <iostream>
#include <memory>

class Notifier {
  public:
    virtual ~Notifier() = default;
    virtual void send(const std::string& text) = 0;
};

class EmailNotifier : public Notifier {
  public:
    void send(const std::string& text) override { std::cout << "email: " << text << "\n"; }
};

class ReportService {
  public:
    explicit ReportService(std::unique_ptr<Notifier> notifier) : notifier_(std::move(notifier)) {}
    void publish() { notifier_->send("weekly report ready"); }

  private:
    std::unique_ptr<Notifier> notifier_;
};

int main() {
    ReportService service{std::make_unique<EmailNotifier>()};
    std::cout << "Day 18 - SOLID Principles\n";
    service.publish();
    return 0;
}
