---
title: "Refactoring Checklist"
tags: ["cheatsheet", "reference"]
---

# :material-book: Refactoring Checklist


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Refactoring Checklist

<div class="contents" local="" depth="2">

Sections

</div>

## The Golden Rule

**Never change behaviour and structure at the same time.**

Each commit should either (a) add/change a behaviour test, or (b) refactor the code while keeping all existing tests green. Mixing the two makes failures impossible to diagnose.

## Pre-Refactor: Add Tests First

Before touching any code, ensure you have a test that exercises the behaviour you are about to restructure:

``` bash
# 1. Run existing tests — all must pass before you start
cmake --build build && ctest --test-dir build -V

# 2. Identify the function/class to refactor — add a test if missing
# 3. Run the new test — it should PASS (we're not changing behaviour)
# 4. Only then begin refactoring
```

Pre-refactor checklist:

- All existing tests pass (`ctest` or `./tests`)
- The specific code under refactor has at least one unit test
- A code coverage report shows the refactored path is exercised
- You understand the preconditions and postconditions of the function
- You have a `git stash` or clean branch to return to if things go wrong

## Identifying Code Smells

**Smell 1: Long Method**

Method \> 30 lines; does more than one thing; hard to name precisely.

``` cpp
// SMELL: parse, validate, log, store all in one function (100 lines)
void handle_request(const HttpRequest& req) { /* ... 100 lines ... */ }

// FIX: extract each responsibility
auto parsed  = parse_request(req);
validate(parsed);
log_request(parsed);
store(parsed);
```

**Smell 2: Long Parameter List (\> 3 parameters)**

``` cpp
// SMELL
void create_user(std::string name, std::string email, int age,
                 std::string role, bool active, std::string timezone);

// FIX: introduce a parameter object
struct UserSpec {
    std::string name, email, role, timezone;
    int  age    = 0;
    bool active = true;
};
void create_user(const UserSpec& spec);
```

**Smell 3: Duplicate Code**

Two code paths that look 80% the same. Extract the common logic and parameterise the differences.

``` cpp
// SMELL: two near-identical loops
for (auto& e : employees) total_salary   += e.salary;
for (auto& e : employees) total_bonus    += e.bonus;

// FIX: extract field accessor
auto sum = [&](auto field) {
    double total = 0;
    for (auto& e : employees) total += std::invoke(field, e);
    return total;
};
double salary = sum(&Employee::salary);
double bonus  = sum(&Employee::bonus);
```

**Smell 4: Feature Envy**

A function uses data from another class more than from its own.

``` cpp
// SMELL: OrderPrinter accesses Order internals constantly
class OrderPrinter {
    void print(const Order& o) {
        std::cout << o.customer_name() << o.total() << o.shipping_address();
    }
};

// FIX: move print() into Order (or provide a summary struct)
class Order {
    void print(std::ostream& os) const { os << customer_name_ << total_; }
};
```

**Smell 5: Primitive Obsession**

Using int for phone numbers, string for dates, double for money.

``` cpp
// SMELL
void transfer(std::string from_account, std::string to_account, double amount);

// FIX: strong types prevent accidental argument swaps
struct AccountId { std::string value; };
struct Money     { int cents; };
void transfer(AccountId from, AccountId to, Money amount);
```

**Smell 6: Switch on Type Tag**

``` cpp
// SMELL: switch on a type tag instead of polymorphism
switch (shape.type) {
    case CIRCLE:    area = 3.14 * shape.radius * shape.radius; break;
    case RECTANGLE: area = shape.w * shape.h; break;
}

// FIX: virtual dispatch or std::visit
double area = std::visit([](const auto& s){ return s.area(); }, shape);
```

**Smell 7: Speculative Generality**

Interfaces or base classes that exist "in case they're needed later" but have only one implementor.

``` cpp
// SMELL: IUserRepository with one concrete implementation ever written
struct IUserRepository { virtual User find(int id) = 0; };
struct SqlUserRepository : IUserRepository { /* ... */ };

// FIX: remove the interface; inject the concrete type
// Re-introduce the interface when a second implementation is needed (YAGNI)
```

**Smell 8: Data Class**

A class that only has getters/setters with no behaviour — it's just a struct.

``` cpp
// SMELL: useless wrapper
class PersonData {
    std::string name_;
    int age_;
public:
    const std::string& name() const { return name_; }
    void set_name(const std::string& s) { name_ = s; }
    int  age()  const { return age_; }
    void set_age(int a) { age_ = a; }
};

// FIX: use a plain struct unless invariants need protecting
struct Person { std::string name; int age; };
```

## Incremental Refactoring Steps

| Step | Action                                                       | Verification                                               |     |
|------|--------------------------------------------------------------|------------------------------------------------------------|-----|
| 1    | Run all tests — must be green                                | `ctest` output shows 0 failures                            |     |
| 2    | Add a test for the target code if missing                    | New test passes                                            |     |
| 3    | Rename for clarity (variable, function, class)               | Tests still green; names express intent                    |     |
| 4    | Extract method: move a block into a named function           | Tests still green; function named \| after what it does    |     |
| 5    | Extract class: move related functions + data into a new type | Tests still green; each class has \| single responsibility |     |
| 6    | Introduce parameter object                                   | Tests still green; API cleaner                             |     |
| 7    | Run clang-tidy + warnings                                    | No new warnings                                            |     |
| 8    | Commit                                                       | `git log` shows atomic commit                              |     |

## Extract Method Checklist

Before extracting a block of code into a function:

- The block has a single, describable purpose (one good name possible)
- All variables used in the block are either passed as parameters or declared inside
- The block has at most one point of exit (or refactor first)
- The extracted function does not require access to `this` (prefer free function)
- After extraction, the calling function reads like a summary of steps

``` cpp
// BEFORE: one large function
void process_order(Order& o) {
    // validate: 10 lines
    if (o.items.empty()) throw ...;
    for (auto& item : o.items) if (item.qty <= 0) throw ...;

    // calculate total: 8 lines
    double total = 0;
    for (auto& item : o.items) total += item.price * item.qty;
    o.total = total;

    // send confirmation: 12 lines
    // ...
}

// AFTER: readable top-level summary
void process_order(Order& o) {
    validate_order(o);
    o.total = calculate_total(o.items);
    send_confirmation(o);
}
```

## Replace Inheritance with Composition

When a derived class uses only part of a base class, or the IS-A relationship is forced, prefer composition:

``` cpp
// SMELL: Stack inherits Vector to reuse push/pop (IS-A is wrong)
class Stack : public std::vector<int> {
public:
    void push(int v) { push_back(v); }
    int  pop()       { int v = back(); pop_back(); return v; }
    // Exposes ALL of vector's interface — resize, insert, etc.!
};

// FIX: composition (HAS-A)
class Stack {
    std::vector<int> data_;
public:
    void push(int v) { data_.push_back(v); }
    int  pop()       { int v = data_.back(); data_.pop_back(); return v; }
    bool empty()     const { return data_.empty(); }
    // Only the Stack interface is exposed
};
```

Steps for replace-inheritance-with-composition:

1.  Add a private data member of the base type
2.  For each overridden method, delegate to the member
3.  For each inherited method used externally, add a forwarding wrapper
4.  Change inheritance to contain the base type as a member
5.  Remove the inheritance (`public Base` declaration)
6.  Run tests — should still pass

## Strangler Fig Pattern (for large legacy refactors)

Incrementally replace a legacy system by routing new traffic to the refactored implementation while keeping the old one running:

    Legacy code path:  old_process(req) → old_handler
    Strangler step 1:  new_process_v2(req) → new_handler for /new_endpoint
    Strangler step 2:  route both /new and /old requests to new_handler
    Strangler step 3:  route ALL requests to new_handler
    Strangler step 4:  delete old_handler

In C++:

``` cpp
// Before: one god function
Result process(Request req) {
    if (req.version == 1) return old_process(req);
    // ... all mixed together
}

// During: new path extracted, toggled by feature flag
Result process(Request req) {
    if (use_new_path(req)) return new_process(req);   // new path
    return old_process(req);                          // old path
}

// After: old_process deleted; feature flag removed
```

## Rename with Confidence

- Use your IDE's rename refactoring (not manual search/replace)
- Verify the rename didn't touch string literals that match the name
- Check that comments still make sense after the rename
- Run tests after every rename before doing the next one

``` bash
# clangd / clang-rename for large codebases:
clang-rename -qualified-name=OldClass -new-name=NewClass \
    -p build/ src/**.cpp
```

## Post-Refactor Verification

``` bash
# 1. All tests pass
ctest --test-dir build -V

# 2. No new warnings
cmake --build build 2>&1 | grep -i warning

# 3. No new clang-tidy findings
clang-tidy -p build/ src/**/*.cpp

# 4. Code coverage unchanged or improved
llvm-cov report ... | grep TOTAL

# 5. Binary size and runtime performance unchanged (for critical paths)
# Compare with baseline benchmark
```

## Cross-References

- `catch2-testing.rst` — write tests before refactoring
- `common-pitfalls.rst` — smells and pitfalls that indicate refactoring need
- `cpp-core-guidelines.rst` — target state guidelines for the refactored code
- `debugging-tools-2026.rst` — clang-tidy for automated smell detection


---

[← All Cheatsheets](index.md)
