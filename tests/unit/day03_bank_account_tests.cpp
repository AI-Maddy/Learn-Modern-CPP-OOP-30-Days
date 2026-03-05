#include <gtest/gtest.h>

#include "bank_account.hpp"

TEST(Day03BankAccountTest, DepositIncreasesBalance) {
    BankAccount account{"Alice", 100.0};
    account.deposit(50.0);
    EXPECT_DOUBLE_EQ(account.balance(), 150.0);
}

TEST(Day03BankAccountTest, WithdrawRejectsInvalidAmount) {
    BankAccount account{"Bob", 100.0};
    EXPECT_FALSE(account.withdraw(0.0));
    EXPECT_FALSE(account.withdraw(-10.0));
    EXPECT_FALSE(account.withdraw(150.0));
    EXPECT_DOUBLE_EQ(account.balance(), 100.0);
}

TEST(Day03BankAccountTest, WithdrawValidAmountUpdatesBalance) {
    BankAccount account{"Carol", 100.0};
    EXPECT_TRUE(account.withdraw(30.0));
    EXPECT_DOUBLE_EQ(account.balance(), 70.0);
}
