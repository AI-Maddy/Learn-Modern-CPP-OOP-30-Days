#pragma once

#include <string>

class BankAccount {
  public:
    BankAccount(std::string owner, double balance);

    bool withdraw(double amount);
    void deposit(double amount);

    double balance() const;
    const std::string& owner() const;

  private:
    std::string owner_;
    double balance_{};
};
