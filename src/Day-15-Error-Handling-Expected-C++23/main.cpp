#include <iostream>
#include <string>
#include <variant>

struct ParseError {
    std::string message;
};

using ParseResult = std::variant<int, ParseError>;

ParseResult parse_positive(const std::string& text) {
    try {
        int value = std::stoi(text);
        if (value < 0) {
            return ParseError{"value must be non-negative"};
        }
        return value;
    } catch (...) {
        return ParseError{"invalid integer"};
    }
}

int main() {
    std::cout << "Day 15 - Error Handling\n";
    ParseResult result = parse_positive("42");
    if (auto p = std::get_if<int>(&result)) {
        std::cout << "Parsed: " << *p << "\n";
    } else {
        std::cout << "Error: " << std::get<ParseError>(result).message << "\n";
    }
    return 0;
}
