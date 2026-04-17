---
title: Quick Reference
---

# ⚡ Quick Reference — Modern C++ Survival Guide

!!! note "🔵 Brain Stem Active — Reflex Knowledge"
    This is your **instant lookup**. Ctrl+F to find what you need.

---

## Smart Pointers

```cpp linenums="1"
#include <memory>

auto u = std::make_unique<T>(args);      // (1)
auto v = std::move(u);                    // (2)
auto s1 = std::make_shared<T>(args);     // (3)
auto s2 = s1;                             // (4)
std::weak_ptr<T> w = s1;                 // (5)
if (auto sp = w.lock()) { /* use sp */ } // (6)
```

1. `make_unique` — exception safe, single ownership
2. `u` is null after move
3. One allocation for object + control block
4. Shared ownership; destroyed when last shared_ptr goes away
5. Non-owning observer; breaks cycles
6. `lock()` returns shared_ptr or nullptr

---

## Rule of Five Template

```cpp linenums="1"
class MyResource {
public:
    MyResource();
    ~MyResource() noexcept;
    MyResource(const MyResource&);
    MyResource& operator=(const MyResource&);
    MyResource(MyResource&&) noexcept;
    MyResource& operator=(MyResource&&) noexcept;
};
```

---

## Concepts (C++20)

```cpp linenums="1"
template<typename T>
concept Printable = requires(T t) {
    { std::cout << t } -> std::same_as<std::ostream&>;
};

void print(Printable auto const& val) {
    std::cout << val << '\n';
}
```

---

## Ranges Pipeline (C++20)

```cpp linenums="1"
auto result = v
    | std::views::filter([](int x){ return x % 2 == 0; })
    | std::views::transform([](int x){ return x * x; })
    | std::views::take(3);
```

---

## std::expected (C++23)

```cpp linenums="1"
std::expected<int, std::string> divide(int a, int b) {
    if (b == 0) return std::unexpected{"Division by zero"};
    return a / b;
}
```

---

## Pitfalls Quick Reference

| Pitfall | Fix |
|---------|-----|
| `delete[]` on `new T` | Use `std::vector` or `unique_ptr<T[]>` |
| Slicing via value copy | Pass polymorphic types by pointer/reference |
| Missing virtual dtor | Add `virtual ~Base() = default;` |
| `std::move` on const | `const T&&` can't actually move |
| Dangling ref return | Return by value or use `string_view` carefully |
| Exception in dtor | Mark `noexcept`, handle internally |

---

[← Home](index.md) · [Cheatsheets](cheatsheets/index.md) · [Mind Map](mindmap.md)
