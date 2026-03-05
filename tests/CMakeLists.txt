include(FetchContent)

FetchContent_Declare(
	googletest
	URL https://github.com/google/googletest/archive/refs/tags/v1.14.0.zip
	DOWNLOAD_EXTRACT_TIMESTAMP TRUE
)

set(gtest_force_shared_crt ON CACHE BOOL "" FORCE)
FetchContent_MakeAvailable(googletest)

enable_testing()
include(GoogleTest)

add_executable(unit_tests
	unit/basic_tests.cpp
)

target_compile_features(unit_tests PRIVATE cxx_std_20)
target_link_libraries(unit_tests PRIVATE GTest::gtest_main)

gtest_discover_tests(unit_tests)

add_executable(day_examples_tests
	unit/day03_bank_account_tests.cpp
)

target_compile_features(day_examples_tests PRIVATE cxx_std_20)
target_link_libraries(day_examples_tests PRIVATE GTest::gtest_main day03_account)

gtest_discover_tests(day_examples_tests)
