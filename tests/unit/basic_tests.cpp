#include <numeric>
#include <string>
#include <vector>

#include <gtest/gtest.h>

TEST(BasicsTest, VectorAccumulateWorks) {
    const std::vector<int> values{1, 2, 3, 4, 5};
    const int sum = std::accumulate(values.begin(), values.end(), 0);
    EXPECT_EQ(sum, 15);
}

TEST(BasicsTest, StringCompositionWorks) {
    const std::string topic = "Modern C++";
    const std::string suffix = " OOP";
    EXPECT_EQ(topic + suffix, "Modern C++ OOP");
}

TEST(BasicsTest, BoundariesAreChecked) {
    const std::vector<int> values{10, 20, 30};
    EXPECT_EQ(values.at(0), 10);
    EXPECT_THROW(values.at(5), std::out_of_range);
}
