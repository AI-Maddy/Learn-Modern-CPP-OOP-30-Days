#include <iostream>
#include <string>

class Account {
  public:
    Account(std::string id, double balance) : id_(std::move(id)), balance_(balance) {}
    bool transfer_to(Account& other, double amount) {
        if (amount <= 0 || amount > balance_) {
            return false;
        }
        balance_ -= amount;
        other.balance_ += amount;
        return true;
    }
    double balance() const { return balance_; }
    const std::string& id() const { return id_; }

  private:
    std::string id_;
    double balance_{};
};

int main() {
    Account a{"A001", 500.0};
    Account b{"B002", 200.0};
    a.transfer_to(b, 150.0);
    std::cout << "Day 24 - Mini Project Bank System\n";
    std::cout << a.id() << ':' << a.balance() << " | " << b.id() << ':' << b.balance() << "\n";
    return 0;
}
