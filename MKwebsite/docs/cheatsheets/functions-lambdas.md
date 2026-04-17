# Functions and Lambdas

Function signatures, overload resolution, default arguments, attributes,
and the complete lambda feature set for Modern C++ (C++14/17/20).

---

## Function Signature Anatomy

```cpp
// Full modern signature with all optional pieces
[[nodiscard]] auto divide(double num, double den) noexcept -> double;
//  ^attribute    ^leading return                  ^except   ^trailing return

// const member function — cannot modify *this
int get_count() const noexcept;

// Ref-qualified overloads — control whether callable on lvalue or rvalue
Data&  data() &;    // called on lvalue object
Data   data() &&;   // called on rvalue object (may move internal data out)

// noexcept(expr) — conditional noexcept based on type trait
template<typename T>
void swap(T& a, T& b) noexcept(std::is_nothrow_swappable_v<T>);

// Deleted to prevent unwanted conversions
void process(int);
void process(double) = delete;  // blocks implicit float->double->call
```

---

## Overload Resolution — Priority Order

The compiler selects the *best viable* candidate using this ranking:

1. Exact match (no conversion needed)
2. Trivial adjustments (array-to-pointer, function-to-pointer, add cv-qual)
3. Numeric promotion (`char`/`short` -> `int`, `float` -> `double`)
4. Standard conversion (`int` -> `double`, derived* -> base*)
5. User-defined conversion (converting constructor or operator)
6. Variadic (`...`) — last resort

```cpp
void f(int);           // (A)
void f(double);        // (B)
void f(long long);     // (C)

f(1);          // A — exact match int
f(1.0);        // B — exact match double
f('a');        // A — promotion: char -> int beats char -> double
f(1L);         // C — exact match long long
// f(1u);      // AMBIGUOUS — uint -> int or uint -> double equally good
```

Template vs non-template priority:

```cpp
template<typename T>
void log(T val);     // matches anything

void log(int val);   // non-template overload

log(42);     // calls non-template — preferred when equally good match
log(42LL);   // calls template — long long != int, template is better fit
```

---

## Default Arguments

```cpp
// Rules: rightmost only, declared once (in header or first declaration)
void connect(std::string host,
             uint16_t    port    = 443,
             bool        use_tls = true);

connect("host.com");             // port=443, tls=true
connect("host.com", 80);         // tls=true
connect("host.com", 80, false);  // all explicit

// WRONG — cannot redefine default in .cpp (ODR issue)
// void connect(std::string host, uint16_t port = 443) { ... }

// WRONG — default cannot reference other parameter
// void f(int x, int y = x);    // ERROR

// PREFER function overloads when behavior diverges, not just values
void connect(std::string host) { connect(std::move(host), 443, true); }
void connect(std::string host, uint16_t port, bool tls) { /* real impl */ }
```

---

## [[nodiscard]] Attribute

Prevents silent discard of return values carrying error state or ownership.

```cpp
[[nodiscard]] bool write_file(const std::string& path);

// C++20: attach a message
[[nodiscard("check the error code")]] std::error_code save();

write_file("out.txt");            // WARNING: ignoring nodiscard value
bool ok = write_file("out.txt");  // OK

// Mark types nodiscard — warns whenever the type is returned and discarded
struct [[nodiscard]] Result { int code; std::string message; };
Result compute();
compute();   // WARNING: Result is nodiscard

// Intentionally ignoring — cast to void to silence warning
(void)write_file("temp.txt");
```

---

## inline and Linkage

```cpp
// inline means "multiple identical definitions are allowed, pick one"
// It does NOT force the compiler to inline the call site
inline int clamp(int v, int lo, int hi) {
    return v < lo ? lo : (v > hi ? hi : v);
}

// constexpr functions are implicitly inline
constexpr double to_radians(double deg) { return deg * 3.14159 / 180.0; }

// Force / prevent inlining with attributes
[[gnu::always_inline]] inline void hot_path();
[[gnu::noinline]]             void cold_path();

// inline variables (C++17) — single definition across TUs
inline constexpr int MAX_CONNECTIONS = 64;
```

---

## Lambdas — Capture Modes

```cpp
int x = 10, y = 20;

auto by_val   = [x]()    { return x;     };  // copy of x at creation
auto by_ref   = [&x]()   { return x;     };  // reference to x (LIFETIME!)
auto all_val  = [=]()    { return x + y; };  // copy all used locals
auto all_ref  = [&]()    { x += y;       };  // ref all used locals
auto mixed    = [x, &y]()             { y += x; };

// Init capture (C++14) — move into lambda or rename
auto ptr = std::make_unique<int>(42);
auto owns = [p = std::move(ptr)]() { return *p; };
// ptr is now null — lambda owns the resource

// Capture *this by value (C++17) — safe for async/stored lambdas
struct Widget {
    int value = 5;
    auto make_callback() {
        return [*this]() { return value; };  // snapshot of *this
    }
};

// mutable — allows modifying value-captured copies
int counter = 0;
auto inc = [counter]() mutable { return ++counter; };
// counter outside is still 0 — only the copy changed
```

---

## Lambda Types and Template Lambdas (C++14/20)

```cpp
// Explicit return type
auto safe_div = [](double a, double b) -> double {
    return b != 0.0 ? a / b : 0.0;
};

// Generic lambda (C++14) — auto params expand to template
auto add = [](auto a, auto b) { return a + b; };
add(1, 2);     // int
add(1.5, 2.5); // double
add(std::string{"a"}, std::string{"b"}); // string

// Template lambda (C++20) — explicit type param, enables constraints
auto typed_add = []<typename T>(T a, T b) -> T { return a + b; };

// Constrained template lambda (C++20)
auto numeric_add = []<std::integral T>(T a, T b) { return a + b; };

// Variadic template lambda (C++20)
auto print_all = []<typename... Ts>(Ts&&... args) {
    ((std::cout << args << ' '), ...);
};

// Recursive lambda with explicit type (C++23 deducing this, C++14 workaround)
auto fib = [](auto self, int n) -> int {
    return n <= 1 ? n : self(self, n-1) + self(self, n-2);
};
fib(fib, 10);  // 55
```

---

## Immediately Invoked Lambda Expressions (IILE)

Use IILEs to initialize `const` variables with complex logic.

```cpp
// Replaces multi-step mutable temp + assignment
const std::string greeting = [&]() -> std::string {
    if (user.is_admin())   return "Hello, Admin " + user.name();
    if (user.is_vip())     return "Welcome back, " + user.name();
    return "Hello, " + user.name();
}();  // <-- invoked immediately

// Initialize arrays or containers with computed values
const std::vector<int> primes = []() {
    std::vector<int> result;
    // ... sieve logic ...
    return result;
}();
```

---

## std::function Overhead and Alternatives

| Callable mechanism | Runtime overhead | Best use case |
| --- | --- | --- |
| Function pointer | 1 indirect call | C interop, simple callbacks |
| Template parameter `F` | Zero (inlined) | Hot paths, algorithms |
| `std::function<Sig>` | Heap + vptr | Stored, runtime-selected tasks |
| `std::move_only_function` | Heap + vptr | Move-only captures (C++23) |

```cpp
// Zero overhead — template parameter, inlined at each instantiation
template<typename Predicate>
int count_if(const std::vector<int>& v, Predicate p) {
    int n = 0;
    for (int x : v) if (p(x)) ++n;
    return n;
}

// std::function — pays for type erasure
std::vector<std::function<void(int)>> handlers;
handlers.push_back([](int x) { std::cout << x; });
handlers.push_back([](int x) { log(x);          });
for (auto& h : handlers) h(42);  // runtime dispatch

// Small buffer optimization: stateless (no-capture) lambdas
// often avoid heap allocation in std::function
std::function<int()> f = []{ return 42; };   // likely no heap alloc
std::function<int()> g = [big_vec]{ ... };   // likely heap alloc
```

---

## Ranges-Compatible Callables

```cpp
#include <algorithm>
#include <ranges>

std::vector<int> nums{3, -1, 4, -1, 5, -9};

// Lambda as predicate in range view pipeline
auto result = nums
    | std::views::filter([](int x){ return x > 0; })
    | std::views::transform([](int x){ return x * x; });

// Projection — member pointer or lambda applied before comparison
struct Employee { std::string name; int salary; };
std::vector<Employee> staff{{"Alice", 80000}, {"Bob", 60000}};

std::ranges::sort(staff, {}, &Employee::salary);           // asc by salary
std::ranges::sort(staff, std::greater{}, &Employee::salary); // desc

auto highest = std::ranges::max_element(staff, {}, &Employee::salary);
```

---

## Common Pitfalls

**Dangling reference capture:**

```cpp
// BAD — lambda may outlive local variable
auto make_printer(int x) {
    return [&x]{ std::cout << x; };  // x destroyed on return!
}
// GOOD
auto make_printer(int x) {
    return [x]{ std::cout << x; };   // copy is safe
}
```

**Accidental copy of large captured data:**

```cpp
std::vector<HeavyObject> data(10000);

auto bad  = [=]() { return data.size(); };   // copies 10000 objects!
auto good = [sz = data.size()]() { return sz; };
auto ref  = [&data]() { return data.size(); };  // OK if lifetime safe
```

**Initializer_list vs element init in vector:**

```cpp
std::vector<int> a(5, 0);    // 5 elements, all 0
std::vector<int> b{5, 0};    // 2 elements: 5 and 0  <- surprise!
```

**Forgetting nodiscard leads to silent logic errors:**

```cpp
// BAD — result silently discarded, no error checked
save_to_disk(data);

// GOOD — with [[nodiscard]] compiler warns; use result
auto err = save_to_disk(data);
if (err) handle(err);
```

---

## Review Checklist

* Are all functions returning error state or ownership marked `[[nodiscard]]`?
* Do lambdas stored beyond the current scope capture by value (not reference)?
* Is `std::function` avoided on hot paths in favor of template parameters?
* Are `mutable` lambdas used intentionally, with awareness that originals are unchanged?
* Do default arguments appear only in the first declaration (header), not redefined in .cpp?
* Are generic lambdas (C++14) used where multiple typed overloads would be repetitive?
* Do `[*this]` captures protect async callbacks against use-after-free?
* Are ranges views and projections preferred over manual `std::sort` + comparator?
* Is overload ambiguity tested for all integer/float conversion paths in critical APIs?
* Are deleted overloads (`= delete`) used to block unintended implicit conversions?

## Related Concepts

* `variables-types-constexpr.rst` — auto deduction rules
* `move-semantics-gotchas.rst` — perfect forwarding in template functions
* `raii-smart-pointers.rst` — lambdas as custom deleters
* `advanced-oop-patterns.rst` — Strategy pattern with std::function
* `templates-concepts.rst` — concepts to constrain callable template params
