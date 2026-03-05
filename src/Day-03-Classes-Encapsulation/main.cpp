#include <iostream>
#include "bank_account.hpp"

int main() {
    BankAccount account{"Madhavan", 1000.0};
    account.deposit(250.0);
    account.withdraw(80.0);
    std::cout << "Day 03 - Classes and Encapsulation\n";
    std::cout << account.owner() << " balance: " << account.balance() << "\n";
    return 0;
}
