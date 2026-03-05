#include "bank_account.hpp"

#include <utility>

BankAccount::BankAccount(std::string owner, double balance) : owner_(std::move(owner)), balance_(balance) {}

bool BankAccount::withdraw(double amount) {
    if (amount <= 0 || amount > balance_) {
        return false;
    }
    balance_ -= amount;
    return true;
}

void BankAccount::deposit(double amount) {
    if (amount > 0) {
        balance_ += amount;
    }
}

double BankAccount::balance() const {
    return balance_;
}

const std::string& BankAccount::owner() const {
    return owner_;
}
