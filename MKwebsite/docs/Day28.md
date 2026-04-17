# Day 28: Code Review and Common C++ Pitfalls

## Why This Day Matters

The single highest-leverage activity for improving code quality is
rigorous code review. This day gives you the mental checklist to spot
the most dangerous C++ anti-patterns quickly, the interpersonal skills
to give and receive review effectively, and the tooling knowledge to
automate the mechanical parts so human review focuses on substance.

## Learning Outcomes

After completing this day you will be able to:

* Apply a five-layer review checklist (correctness, safety, interface,
  performance, style) to any C++ pull request.
* Identify and fix nine named C++ anti-patterns: raw owning pointers,
  unsigned subtraction underflow, narrowing conversions, const-incorrectness,
  dangling references, signed/unsigned comparison, missing override,
  std::endl in loops, and incorrect noexcept.
* Configure `clang-tidy` with a `.clang-tidy` file and integrate it
  into a CI workflow.
* Set up `clang-format` as a pre-commit hook to enforce consistent style
  automatically.
* Give actionable, severity-classified review comments and respond
  professionally to comments on your own code.

## Key Concepts

* **Five-layer review** — correctness first; style last; never the reverse.
* **Anti-pattern checklist** — nine recurring C++ mistakes that automated
  tools can help catch but human reviewers must understand.
* **clang-tidy** — static analysis linter with 300+ checks covering the
  C++ Core Guidelines, safety, performance, and modernisation.
* **clang-format** — mechanical formatter that removes style arguments
  from code review permanently.
* **Review severity** — BLOCKER / CRITICAL / MAJOR / MINOR / NIT;
  blockers must be fixed before merge.

## Theory

### Motivation

Code review is where knowledge transfers between engineers and where
accumulated bugs are caught before they reach users. A reviewer who does
not know the common C++ anti-patterns will miss the most dangerous issues.

### How to Give a Code Review

Effective code reviews are structured. Work through these layers in order:

**Layer 1 — Correctness**
Does the code do what the ticket/spec says? Are edge cases handled? Can
it panic, deadlock, or produce undefined behaviour? This is the most
important layer — style is irrelevant if the code is wrong.

**Layer 2 — Safety and Resource Management**
Are all resources (memory, files, locks) acquired via RAII? Is ownership
clear (`unique_ptr` vs raw pointer)? Is exception safety considered?

**Layer 3 — Interface Design**
Is the API minimal and expressive? Do parameter names, types, and `const`
qualifiers communicate intent? Could the interface be misused by accident?

**Layer 4 — Performance**
Are there unnecessary copies? Is the wrong container chosen for the access
pattern? Are `std::string` temporaries being created in tight loops?

**Layer 5 — Style and Readability**
Naming, formatting, comment quality. These are important but should not
dominate the review if layers 1–4 are clean.

### How to Receive a Code Review

* Treat every comment as a question, not an attack.
* Respond to every comment — either fix it, explain why you disagree, or
  ask for clarification.
* Do not rewrite unrelated code in response to review feedback — that
  creates noise and is harder to review.
* If a reviewer's suggestion makes the code worse, explain why calmly with
  reference to the C++ Core Guidelines or the style guide.

### The C++ Anti-Pattern Checklist

Use this checklist mentally on every PR:

**1. Raw `new` / `delete`**

```cpp
// BAD: manual memory management
Foo* p = new Foo(args);
// ... something throws here ...
delete p;  // NEVER REACHED

// GOOD: RAII — destructor guaranteed
auto p = std::make_unique<Foo>(args);
```

**2. Unsigned Subtraction Underflow**

```cpp
// BAD: size_t is unsigned — wraps to huge number when b > a
std::size_t a = 3, b = 5;
std::size_t diff = a - b;   // wraps to ~18 quintillion
for (std::size_t i = 0; i < diff; ++i) { /* billions of iterations */ }

// GOOD: use signed comparison or check before subtracting
if (a >= b) {
    std::size_t diff = a - b;
}
// OR: cast to signed for arithmetic
auto diff = static_cast<std::ptrdiff_t>(a) - static_cast<std::ptrdiff_t>(b);
```

**3. Implicit Narrowing Conversion**

```cpp
// BAD: double silently truncated to int
double precise = 3.99;
int rounded = precise;    // int{3} — no warning by default with C-style init

// GOOD: use brace-initialisation — narrowing is a compile error
int rounded{precise};     // error: narrowing conversion from double to int
int rounded = static_cast<int>(precise);  // intentional, documented
```

**4. Missing `const` on Query Methods**

```cpp
// BAD: method does not modify state but lacks const
class Circle {
public:
    double area() { return 3.14 * r_ * r_; }   // should be const
private:
    double r_;
};

void print_info(const Circle& c) {
    std::cout << c.area();  // COMPILE ERROR: non-const method on const ref
}

// GOOD:
double area() const { return std::numbers::pi * r_ * r_; }
```

**5. Returning a Reference to a Local Variable**

```cpp
// BAD: local string is destroyed on return; reference dangles
const std::string& get_name() {
    std::string name = "Alice";  // local
    return name;                 // returns reference to dead object — UB
}

// GOOD: return by value (NRVO makes this cheap)
std::string get_name() {
    return "Alice";
}
```

**6. Comparing Signed and Unsigned Integers**

```cpp
// BAD: -1 as signed int compares as huge number when widened to size_t
int index = get_index();  // may return -1 on error
if (index < vec.size()) { // comparison signed/unsigned — -1 always "passes"
    return vec[index];    // UB: negative index
}

// GOOD:
if (index >= 0 && static_cast<std::size_t>(index) < vec.size()) {
    return vec[static_cast<std::size_t>(index)];
}
```

**7. Forgetting `override`**

```cpp
// BAD: typo in the signature means this is a NEW function, not an override
class Derived : public Base {
public:
    virtual void procces() { }  // typo: 'procces' vs 'process' — no error!
};

// GOOD: override makes the compiler enforce the signature match
class Derived : public Base {
public:
    void process() override { }  // compile error if Base has no matching virtual
};
```

**8. std::endl vs '\n'**

```cpp
// BAD: std::endl flushes the buffer on every call — 10x slower in loops
for (int i = 0; i < 10000; ++i)
    std::cout << i << std::endl;  // flush 10,000 times

// GOOD: '\n' outputs newline without flushing
for (int i = 0; i < 10000; ++i)
    std::cout << i << '\n';
```

**9. Exception Specification `noexcept` Misuse**

```cpp
// BAD: marking a function noexcept when it can throw causes std::terminate
void process(std::vector<int>& v) noexcept {
    v.at(100);  // throws std::out_of_range — calls std::terminate!
}

// GOOD: only mark noexcept when you have verified it truly cannot throw
void process(std::vector<int>& v) noexcept {
    if (v.size() > 100)
        v[100];  // no-throw once we have checked bounds
}
```

### Integrating Static Analysis into CI

```yaml
# .github/workflows/static_analysis.yml (example)
name: Static Analysis
on: [push, pull_request]
jobs:
  clang-tidy:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - name: Install tools
        run: sudo apt-get install -y clang-tidy
      - name: Configure
        run: cmake -S . -B build -DCMAKE_EXPORT_COMPILE_COMMANDS=ON
      - name: Run clang-tidy
        run: |
          run-clang-tidy -p build/ \
            -header-filter='.*' \
            -checks='cppcoreguidelines-*,modernize-*,readability-*' \
            src/
```

### Automated Formatters

`clang-format` enforces style mechanically so code review can focus on
substance. A `.clang-format` file checked into the repository ensures
every contributor gets the same style:

```yaml
# .clang-format
BasedOnStyle: Google
IndentWidth: 4
ColumnLimit: 100
AllowShortFunctionsOnASingleLine: None
SortIncludes: true
```

### ASCII: Review Severity Levels

```text
┌──────────────┬──────────────────────────────────────────┐
│ Severity     │ Example                                  │
├──────────────┼──────────────────────────────────────────┤
│ BLOCKER      │ UB, data race, memory leak on error path │
│ CRITICAL     │ Wrong algorithm, missing input validation │
│ MAJOR        │ Missing const, raw pointer for ownership  │
│ MINOR        │ Poor naming, missing [[nodiscard]]        │
│ NIT          │ Style preference, formatting              │
└──────────────┴──────────────────────────────────────────┘
```

Always start from BLOCKER and work downward. Do not leave BLOCKER issues
for a follow-up PR.

## Pitfalls

### Pitfall 1: Approving a PR Without Reading the Logic

**Description**
A reviewer leaves an "LGTM" based on a quick scan of formatting and naming
without verifying that the algorithm is correct.

**BAD review comment**

```text
"Looks good, style is clean, approved."
— on a function containing unsigned subtraction underflow
```

**GOOD approach**

```text
Review checklist (mental):
1. Trace the happy path through the logic manually.
2. Identify every boundary condition and check how it is handled.
3. Search for unsigned arithmetic used with potential negative values.
4. Check that all resources are acquired via RAII.
5. Verify exception paths do not leave objects in inconsistent state.
Only then approve.
```

---

### Pitfall 2: Missing `const` Cascades

**Description**
A single function missing `const` forces every caller to be non-const,
which propagates through the codebase.

**BAD code**

```cpp
class Account {
public:
    double balance() { return balance_; }  // missing const
private:
    double balance_;
};

// Now this is a compile error — balance() is not const-qualified
void print_summary(const Account& acc) {
    std::cout << acc.balance() << '\n';  // error
}

// Developer "fixes" by removing const from the parameter — wrong!
void print_summary(Account& acc) {  // now cannot accept rvalue or const object
    std::cout << acc.balance() << '\n';
}
```

**GOOD code**

```cpp
class Account {
public:
    double balance() const { return balance_; }  // const correct from the start
};
```

**Detection tip:** `clang-tidy` check `readability-make-member-function-const` flags
member functions that do not modify any member and are not yet const.

---

### Pitfall 3: Raw Owning Pointer Returned From a Factory

**Description**
A factory function returns a raw pointer to a heap-allocated object.
If the caller forgets to delete it, or an exception is thrown, the memory leaks.

**BAD code**

```cpp
// Factory returns raw pointer — ownership is ambiguous
Widget* create_widget(const Config& cfg) {
    return new Widget(cfg);  // who deletes this?
}

void use_widget(const Config& cfg) {
    Widget* w = create_widget(cfg);
    w->do_work();   // if do_work() throws, w is leaked
    delete w;
}
```

**GOOD code**

```cpp
// unique_ptr expresses single ownership — caller automatically cleans up
std::unique_ptr<Widget> create_widget(const Config& cfg) {
    return std::make_unique<Widget>(cfg);
}

void use_widget(const Config& cfg) {
    auto w = create_widget(cfg);
    w->do_work();   // even if this throws, ~unique_ptr runs
}
```

---

### Pitfall 4: Signed/Unsigned Comparison in Loop Bounds

**Description**
Comparing a signed loop counter to an unsigned `size()` promotes the
signed value to unsigned. A negative value wraps to a huge positive.

**BAD code**

```cpp
int n = compute_count();  // might return -1 on error
std::vector<Item> items = load_items();

for (int i = 0; i < items.size(); ++i) {  // warning: signed/unsigned mismatch
    process(items[i]);
}
```

**GOOD code**

```cpp
// Option 1: use size_t for the loop variable
for (std::size_t i = 0; i < items.size(); ++i) {
    process(items[i]);
}

// Option 2: range-for (always correct)
for (const auto& item : items) {
    process(item);
}
```

**Detection tip:** `-Wsign-compare` (included in `-Wall`) flags signed/unsigned comparisons.

---

### Pitfall 5: Implicit Conversion Hiding a Type Mismatch

**Description**
Passing a `double` where an `int` is expected compiles silently with C-style
initialisation. The value is silently truncated.

**BAD code**

```cpp
void apply_discount(int percentage, double price) {
    double discount = price * percentage / 100;
}

apply_discount(3.5, 100.0);   // 3.5 silently truncated to 3 — bug!
```

**GOOD code**

```cpp
// Strong typing prevents the confusion
void apply_discount(double percentage_rate, double price) {
    double discount = price * percentage_rate;
}
apply_discount(0.035, 100.0);  // explicit: 3.5% rate
```

**Detection tip:** Enable `-Wconversion` and `-Wdouble-promotion`.

---

### Pitfall 6: `std::endl` in Performance-Critical Output

**Description**
`std::endl` outputs `'\n'` *and* calls `flush()`. In loops that
output thousands of lines, this can be 10–50x slower than using `'\n'`.

**BAD code**

```cpp
void dump_log(const std::vector<LogEntry>& entries) {
    for (const auto& e : entries)
        std::cout << e.message << std::endl;  // flush on every line
}
```

**GOOD code**

```cpp
void dump_log(const std::vector<LogEntry>& entries) {
    for (const auto& e : entries)
        std::cout << e.message << '\n';  // buffers output efficiently
    // std::cout.flush() if you need guaranteed flush at the end
}
```

**Detection tip:** `clang-tidy` check `performance-avoid-endl` flags `std::endl` usage.

## Code Example

```cpp
#include <iostream>
#include <optional>
#include <vector>

std::optional<int> at_or_none(const std::vector<int>& values, std::size_t index) {
    if (index >= values.size()) {
        return std::nullopt;
    }
    return values[index];
}

int main() {
    std::vector<int> values{5, 10, 15};
    std::cout << "Day 28 - Code Review and Pitfalls\n";
    auto item = at_or_none(values, 2);
    std::cout << (item ? std::to_string(*item) : std::string{"none"}) << "\n";
    return 0;
}
```
