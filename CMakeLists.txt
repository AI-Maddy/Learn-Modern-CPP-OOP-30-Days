cmake_minimum_required(VERSION 3.20)
project(LearnModernCppOOP30Days LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(cmake/Sanitizers.cmake)

enable_testing()

add_subdirectory(src)
add_subdirectory(tests)
