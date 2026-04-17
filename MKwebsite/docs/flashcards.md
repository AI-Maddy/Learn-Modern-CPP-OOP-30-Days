# Flashcards: Modern C++ OOP

Use these flashcards to test your knowledge. Cover the answer, try to recall, then reveal.

---

## Day 00: Environment Setup and Build System

**Q:** What is the purpose of an out-of-source build in CMake, and how do you create one?

**A:** An out-of-source build keeps generated files separate from the source tree, preventing pollution and making clean builds trivial. You create one with `cmake -S . -B build`, which places all build artefacts under `build/`.

---

**Q:** What does `cmake --build build -- -j$(nproc)` do, and why is the `-j` flag useful?

**A:** It invokes the underlying build system (e.g., Make or Ninja) from the `build/` directory. The `-j$(nproc)` flag parallelises compilation across all available CPU cores, significantly reducing build times.

---

**Q:** What is the role of `target_compile_features(my_target PRIVATE cxx_std_23)` in CMakeLists.txt?

**A:** It tells CMake to compile `my_target` using at least C++23, propagating the correct `-std=c++23` flag without hardcoding compiler-specific flags. Using `PRIVATE` means the requirement does not propagate to consumers of the target.

---

**Q:** What is the risk of placing all compilation in a single translation unit (unity build) for learning?

**A:** Single-file builds avoid linker issues and simplify the setup for small projects, but they do not reflect real-world multi-file projects. They hide ODR violations and slow down incremental compilation as code grows.

---

**Q:** Why should you prefer `target_include_directories` over manually adding `-I` flags to compiler options?

**A:** `target_include_directories` is transitive and works correctly with CMake's dependency graph, so consumers automatically get the right include paths. Manual `-I` flags break when targets are linked and do not compose.

---

## Day 01: C++ Core Syntax Refresher

**Q:** Why does brace initialisation (`{}`) prevent narrowing conversions while parenthesis initialisation does not?

**A:** The C++ standard mandates that brace initialisation is ill-formed if the initialiser cannot be converted to the target type without a narrowing conversion, so `int x{3.14}` is a compile error. Parenthesis initialisation silently truncates.

---

**Q:** What is the difference between `const` and `constexpr` on a variable?

**A:** `const` means the variable cannot be modified after initialisation but its value may not be known at compile time. `constexpr` requires the value to be a compile-time constant and allows it to appear in contexts like template arguments and array sizes.

---

**Q:** What does `auto [key, value] = *it;` demonstrate, and what C++ version introduced it?

**A:** It demonstrates structured bindings, introduced in C++17, which decompose a `std::pair` (or aggregate) into named variables. This eliminates `it->first` / `it->second` noise and clarifies intent.

---

**Q:** What is the pitfall of using `auto` with a proxy-returning container like `std::vector<bool>`?

**A:** `std::vector<bool>` returns a proxy object, not `bool&`, so `auto x = v[0]` deduces `x` as the proxy type rather than `bool`. Modifying `x` may behave unexpectedly; use `bool x = v[0]` explicitly.

---

**Q:** What is a value category, and why does it matter for move semantics?

**A:** Every expression has a value category: an lvalue refers to an addressable object, while an rvalue (prvalue/xvalue) is a temporary or "movable from" object. Move semantics rely on detecting rvalues to steal resources instead of copying them.

---

## Day 02: Functions, Lambdas, and Parameter Passing

**Q:** When should you pass a parameter by `const T&` versus by value?

**A:** Pass by `const T&` when the object is expensive to copy and you only need to read it. Pass by value when you need a local copy anyway, or when the type is cheap to copy (e.g., arithmetic types, iterators).

---

**Q:** What does `[[nodiscard]]` on a function tell the compiler, and why is it useful for error-handling functions?

**A:** It instructs the compiler to warn when the return value is discarded without being used. For functions like `load_file()` that return an error indicator, silently ignoring the result is almost always a bug.

---

**Q:** What is the difference between capturing by value (`[=]`) and by reference (`[&]`) in a lambda?

**A:** `[=]` copies all used variables at the point of lambda creation, so changes to the originals do not affect the lambda. `[&]` stores references, which is efficient but dangerous if the lambda outlives the referenced variables.

---

**Q:** Why can `std::function<void()>` introduce heap allocation, and what is the alternative in performance-critical code?

**A:** `std::function` uses type erasure and allocates on the heap when the stored callable exceeds its small-buffer threshold. In hot paths, a template parameter (e.g., `template<typename F> void apply(F f)`) resolves the callable at compile time with zero overhead.

---

**Q:** What does this code do, and what pitfall does it illustrate?

```cpp
int x = 10;
auto f = [&x]() { return x * 2; };
x = 99;
return f();  // returns ?
```

**A:** It returns 198 because the lambda captures `x` by reference and reads the current value (99) when called. The pitfall is that capture-by-reference creates a dangling reference if `x` goes out of scope before the lambda is called.

---

## Day 03: Classes, Encapsulation, and Invariants

**Q:** What is a class invariant, and who is responsible for maintaining it?

**A:** A class invariant is a condition that must hold true for all valid objects of a class (e.g., `size_ <= capacity_`). It is established by the constructor, and every public method must preserve it before returning.

---

**Q:** Why should setters validate input rather than blindly assigning?

**A:** A setter that validates maintains the class invariant, ensuring the object is always in a consistent state. Blind assignment transfers the burden of correctness to every caller, making invariant violations easy to introduce.

---

**Q:** What does `explicit` on a constructor prevent, and when should it be omitted?

**A:** `explicit` prevents the constructor from being used for implicit conversions and copy-initialisation (`T x = value`). Omit it only when implicit conversion is semantically meaningful, such as `std::string` from a string literal.

---

**Q:** What is the "tell, don't ask" principle, and how does it relate to encapsulation?

**A:** Instead of asking an object for its state and making decisions externally, you tell the object what to do and let it decide. This keeps decision logic inside the class where it can enforce invariants and avoids scattered conditionals.

---

**Q:** What is the pitfall of returning a non-`const` reference to a private member?

**A:** It breaks encapsulation by giving external code direct write access to the member, bypassing all validation logic. The class loses control of its invariant because callers can modify the member without the class knowing.

---

## Day 04: Constructors, Destructors, and RAII

**Q:** What is RAII, and how does it guarantee resource cleanup?

**A:** Resource Acquisition Is Initialisation ties resource lifetime to object lifetime. The constructor acquires the resource and the destructor releases it, so the resource is freed automatically when the object goes out of scope — even if an exception is thrown.

---

**Q:** Why must destructors never throw exceptions?

**A:** If a destructor throws during stack unwinding (already handling another exception), `std::terminate` is called and the program aborts. Destructors are implicitly `noexcept` in C++11 and beyond; any throwing destructor violates this contract.

---

**Q:** What is the two-phase initialisation anti-pattern, and why is it problematic?

**A:** Two-phase init separates construction from a separate `init()` call, meaning the object exists in an invalid intermediate state between the two. This forces every user to remember to call `init()` and makes it impossible to use `const` objects.

---

**Q:** What does a delegating constructor do?

**A:** A delegating constructor calls another constructor of the same class in its member-initialiser list, allowing shared initialisation logic without code duplication. The delegated-to constructor runs first and establishes the invariant.

---

**Q:** Why prefer member-initialiser lists over assignment in the constructor body?

**A:** Members are always default-constructed before the body runs. Assigning in the body means default-constructing then assigning, which is two operations. The initialiser list directly constructs, which is more efficient and required for `const` and reference members.

---

## Day 05: Smart Pointers and Ownership

**Q:** What is the ownership model difference between `std::unique_ptr` and `std::shared_ptr`?

**A:** `unique_ptr` models exclusive ownership — exactly one pointer owns the resource, and it is destroyed when the pointer goes out of scope or is explicitly released. `shared_ptr` models shared ownership via reference counting, destroying the resource when the last owner is destroyed.

---

**Q:** Why should you use `std::make_unique<T>()` instead of `new T()`?

**A:** `make_unique` is exception-safe (no memory leak if the constructor throws), reads more clearly, and avoids repeating the type. It also prevents certain undefined behaviours that arise from manually pairing `new` and `unique_ptr`.

---

**Q:** What problem does `std::weak_ptr` solve?

**A:** `weak_ptr` breaks reference cycles between `shared_ptr` instances that would otherwise keep objects alive forever. It holds a non-owning reference that must be promoted to a `shared_ptr` via `lock()` before use, returning `nullptr` if the object has been destroyed.

---

**Q:** What is the pitfall of storing `this` in a `shared_ptr` directly?

**A:** Constructing a `shared_ptr` from `this` creates a second, independent reference count, so the object may be destroyed while the original `shared_ptr` still thinks it is alive. Use `std::enable_shared_from_this` and call `shared_from_this()` instead.

---

**Q:** What does `std::unique_ptr` with a custom deleter look like, and when is it useful?

```cpp
auto handle = std::unique_ptr<FILE, decltype(&fclose)>(fopen("f.txt","r"), &fclose);
```

**A:** This wraps a C-style `FILE*` in a `unique_ptr` using `fclose` as the custom deleter, so the file is closed automatically. It is useful for any C resource (sockets, handles) that uses a non-`delete` cleanup function.

---

## Day 06: Inheritance and Polymorphism

**Q:** What is object slicing, and how do you prevent it?

**A:** Slicing occurs when a derived object is assigned to a base object by value, discarding the derived portion and the vtable pointer. Prevent it by using pointers or references to base (`Base*`, `Base&`) for polymorphic code.

---

**Q:** Why must a polymorphic base class have a virtual destructor?

**A:** When deleting a derived object through a `Base*`, the compiler calls the destructor indicated by the static type unless it is virtual. Without `virtual ~Base()`, the derived destructor never runs, causing resource leaks.

---

**Q:** How does a vtable enable runtime polymorphism?

**A:** Each class with virtual functions has a vtable — a table of function pointers to its virtual methods. Each object stores a vptr pointing to its class's vtable, so a virtual call dispatches through the vptr at runtime to the correct override.

---

**Q:** What does `dynamic_cast<Derived*>(base_ptr)` return if the cast is invalid?

**A:** It returns `nullptr` for pointer casts. For reference casts (`dynamic_cast<Derived&>`), it throws `std::bad_cast`. Always check the result of a pointer `dynamic_cast` before dereferencing.

---

**Q:** When is `std::variant` + `std::visit` preferable to virtual dispatch?

**A:** When the set of types is closed (known at compile time), `std::variant` avoids heap allocation and virtual call overhead. It also provides exhaustiveness checking — adding a new type without handling it is a compile error.

---

## Day 07: Virtual, Override, Final, and Abstract Classes

**Q:** What makes a class abstract, and what happens if you try to instantiate it?

**A:** A class is abstract if it has at least one pure virtual function (`= 0`). Attempting to instantiate it directly is a compile error; it can only be used through pointers or references to derived classes that implement all pure virtuals.

---

**Q:** What compiler protection does `override` provide?

**A:** `override` causes a compile error if the function does not actually override a virtual function in a base class (e.g., signature mismatch or missing `virtual` in base). Without it, a mismatched signature silently creates a new, non-overriding function.

---

**Q:** What is the NVI (Non-Virtual Interface) idiom, and what invariant guarantee does it provide?

**A:** NVI makes the public interface non-virtual while the virtual customisation points are `protected` or `private`. The public wrapper enforces pre/post conditions that no override can bypass, guaranteeing invariants around every customisation.

---

**Q:** What is a covariant return type, and how does it eliminate casts?

**A:** An override may return a pointer or reference to a more-derived type than the base virtual's return type. In a `clone()` pattern, `Derived* clone() override` can return `Derived*` directly, allowing callers to use the result without `dynamic_cast`.

---

**Q:** What devirtualisation benefit does `final` on a class provide?

**A:** When a class is `final`, the compiler knows no further derived classes exist, so virtual calls through a concrete `final` type can be resolved at compile time and potentially inlined, eliminating the vtable dispatch overhead.

---

## Day 08: Composition, Mixins, and Design Choices

**Q:** Why is composition generally preferred over inheritance for code reuse?

**A:** Inheritance creates tight coupling through the base class interface and can expose implementation details. Composition is more flexible — you can swap components at runtime or compile time, and changes to a component don't propagate unexpectedly.

---

**Q:** What is the Strategy pattern, and how does it relate to composition?

**A:** Strategy defines a family of algorithms behind an interface and makes them interchangeable at runtime by composing the context object with a strategy object. It is composition over inheritance: the context delegates to the strategy rather than inheriting behaviour.

---

**Q:** What is the Interface Segregation Principle, and how does it affect class design?

**A:** ISP states that clients should not be forced to depend on interfaces they don't use. It means splitting fat interfaces into focused ones, so implementing classes only need to provide the methods that are relevant to their responsibilities.

---

**Q:** What is the pImpl idiom, and what compilation benefit does it provide?

**A:** pImpl (pointer to implementation) hides a class's private data behind a forward-declared implementation struct, stored via a `unique_ptr`. Changes to private members do not recompile clients, providing a stable ABI and faster incremental builds.

---

**Q:** What is the pitfall of deep inheritance hierarchies?

**A:** Deep hierarchies create fragile base class problems: changes to intermediate classes propagate unpredictably. They also make code hard to understand because behaviour is spread across multiple levels, and they may force unneeded interface implementation on derived classes.

---

## Day 09: Templates Basics

**Q:** What is a function template, and when is it instantiated?

**A:** A function template is a blueprint parameterised by types or values. It is instantiated (concrete code generated) by the compiler at the point of use when it deduces or is explicitly given template arguments.

---

**Q:** What is template argument deduction, and when might it fail?

**A:** The compiler deduces template arguments from function call arguments. It fails when arguments have conflicting deductions (e.g., `T` deduced as both `int` and `double`), when the argument is a brace-enclosed initialiser, or when deduction requires a conversion.

---

**Q:** What is the purpose of a variadic template and fold expression?

**A:** Variadic templates accept any number of type or value arguments. Fold expressions (C++17) apply a binary operator across the pack, enabling concise implementations of `sum<1,2,3>()` or `print(args...)` without explicit recursion.

---

**Q:** What does `typename T::value_type` inside a template require, and how do you fix a compile error related to it?

**A:** `value_type` is a dependent name — its interpretation depends on `T`. The compiler does not treat it as a type by default, so you must write `typename T::value_type` explicitly to tell the compiler it names a type.

---

**Q:** What is explicit template instantiation and why would you use it?

**A:** `template class MyClass<int>;` forces the compiler to instantiate the template for `int` in the current translation unit. This reduces compile times and object size when the same instantiation would otherwise appear in many translation units.

---

## Day 10: Concepts and Constraints (C++20)

**Q:** What is the difference between a `requires` clause and a `requires` expression?

**A:** A `requires` clause is a boolean predicate on a template parameter (e.g., `requires Sortable<T>`). A `requires` expression is a body of syntactic constraints that evaluates to `bool` — it can appear inside a `requires` clause to check operations inline.

---

**Q:** What does concept subsumption mean for overload resolution?

**A:** If concept A implies concept B (A subsumes B), then a function constrained by A is more specialised than one constrained by B and will be preferred in overload resolution. This allows writing general and specialised overloads without ambiguity.

---

**Q:** Write a concept that constrains `T` to types that support `+=` with `int`.

```cpp
template<typename T>
concept AddAssignable = requires(T x, int n) { x += n; };
```

**A:** The `requires` expression checks that the expression `x += n` is well-formed for a value of type `T` and an `int`. Any type satisfying this is accepted; others produce a clear constraint violation error.

---

**Q:** What is `std::regular`, and what operations does it require?

**A:** `std::regular` is a standard concept requiring default construction, copy construction/assignment, move construction/assignment, and equality comparison (`==`). It models types that behave like "values" in the mathematical sense.

---

**Q:** Why is a concept error message friendlier than a raw SFINAE failure?

**A:** Concepts produce a single, targeted diagnostic naming the unsatisfied concept and the failed constraint. SFINAE failures produce cascading template substitution errors that are notoriously verbose and difficult to trace to the root cause.

---

## Day 11: Policy-Based Design and Static Polymorphism

**Q:** What is policy-based design, and how does it differ from runtime polymorphism?

**A:** Policy-based design passes behaviours as template parameters, allowing the compiler to inline and optimise the combined policy. Runtime polymorphism (virtual dispatch) defers the decision to runtime via vtable, incurring indirect call overhead.

---

**Q:** What is CRTP (Curiously Recurring Template Pattern)?

**A:** CRTP is a pattern where a derived class passes itself as a template argument to its base: `class Derived : public Base<Derived>`. The base can call methods on the derived type statically, achieving polymorphism without virtual dispatch.

---

**Q:** What is the mixin accumulation pattern, and how does it compose behaviours?

**A:** Mixins are small base classes providing one behaviour each (e.g., `Serialisable`, `Comparable`). A class inherits from multiple mixins via a variadic template chain: `class MyType : public Mixin1<MyType>, public Mixin2<MyType>`.

---

**Q:** What pitfall arises when using CRTP if the derived class forgets to pass itself?

**A:** If `class Derived : public Base<SomeOtherType>` is written, `Base` casts `this` to the wrong type, producing undefined behaviour at runtime with no compile-time error. A `static_assert(std::is_base_of_v<Base<Derived>, Derived>)` in the base can catch this.

---

**Q:** When is static polymorphism (CRTP/policies) inappropriate?

**A:** When the concrete type is not known until runtime (plugin systems, user-selected algorithms), or when separate compilation of each instantiation is required. Static polymorphism also increases compile times and binary size for many instantiations.

---

## Day 12: Ranges and Views (C++20)

**Q:** What does "lazy evaluation" mean for a `std::views` pipeline?

**A:** A view does not process elements when constructed; it stores only the transformation description. Elements are computed on demand as the pipeline is iterated, avoiding materialisation of intermediate containers.

---

**Q:** What does the pipe operator (`|`) do in a Ranges pipeline?

**A:** The pipe operator composes range adaptors: `v | std::views::filter(pred) | std::views::transform(fn)` builds a view that lazily applies `filter` then `transform` when iterated. It is syntactic sugar for `std::views::transform(std::views::filter(v, pred), fn)`.

---

**Q:** What is a dangling view, and how does it arise with temporaries?

**A:** A view that references a temporary container becomes dangling when the temporary is destroyed. `auto v = std::vector{1,2,3} | std::views::filter(...);` is dangling immediately; always ensure the underlying range outlives the view.

---

**Q:** What is the difference between `std::views::transform` and `std::ranges::transform`?

**A:** `std::views::transform` returns a lazy view; no work is done until you iterate. `std::ranges::transform` is an eager algorithm that writes results into an output range immediately, similar to `std::transform`.

---

**Q:** How do you materialise a view into a `std::vector` in C++23?

**A:** Use `std::ranges::to<std::vector>(view)` (C++23), or in C++20 use the range constructor: `std::vector<T>(view.begin(), view.end())`. The C++23 `to` helper is more concise and works with pipe syntax.

---

## Day 13: Move Semantics and Perfect Forwarding

**Q:** What is the difference between an lvalue reference and an rvalue reference?

**A:** An lvalue reference (`T&`) binds to named, addressable objects. An rvalue reference (`T&&`) binds only to temporaries or objects explicitly cast with `std::move`, enabling the called function to "steal" the resource rather than copying.

---

**Q:** What does `std::move` actually do?

**A:** `std::move` is a cast — it converts an lvalue to an xvalue (a type of rvalue). It does not move anything itself; it signals that the caller permits the resource to be moved from, enabling the move constructor/assignment to be selected.

---

**Q:** What is NRVO, and why should you return local variables by value rather than `std::move`?

**A:** Named Return Value Optimisation allows the compiler to construct the return value directly in the caller's storage, eliding the copy/move entirely. Applying `std::move` on a return value prevents NRVO and may cause an unnecessary move instead of elision.

---

**Q:** What is perfect forwarding, and what syntax enables it?

**A:** Perfect forwarding preserves the value category of arguments when passing them to another function. It uses a forwarding reference (`T&&` in a template context) combined with `std::forward<T>(arg)`, which casts to rvalue only if `T` was deduced as an rvalue reference.

---

**Q:** What pitfall does this code demonstrate?

```cpp
void sink(std::string s);
void relay(std::string&& s) { sink(s); }  // moves or copies?
```

**A:** `s` is an rvalue reference but it is an lvalue inside the function body (it has a name). Calling `sink(s)` copies instead of moves. You must write `sink(std::move(s))` to actually move the string into `sink`.

---

## Day 14: Rule of Five and Resource Management

**Q:** What are the five special member functions, and when does the Rule of Five apply?

**A:** Destructor, copy constructor, copy assignment, move constructor, move assignment. The Rule of Five applies when you manage a raw resource: if you define any one of these, you almost certainly need to define or explicitly delete all five.

---

**Q:** What is the copy-and-swap idiom, and what exception safety guarantee does it provide?

**A:** Copy-and-swap implements assignment by constructing a copy, then swapping with `*this`. It provides the strong exception safety guarantee: if the copy throws, `*this` is unchanged; the swap is `noexcept`.

---

**Q:** What is the Rule of Zero?

**A:** If a class manages no raw resources directly (using smart pointers and RAII wrappers instead), define none of the five special members. The compiler-generated versions are correct, and defining them manually only introduces risk.

---

**Q:** Why is `noexcept` on move operations important for containers like `std::vector`?

**A:** `std::vector` reallocation uses move if the move constructor is `noexcept`, otherwise it copies to preserve the strong exception guarantee. Without `noexcept`, your type copies on reallocation even when a move would be safe.

---

**Q:** What exception safety level does this assignment operator provide, and is it correct?

```cpp
MyClass& operator=(const MyClass& rhs) {
    delete[] data_;
    data_ = new int[rhs.size_];  // throws?
    // ...
}
```

**A:** Only the basic guarantee: if `new` throws, `data_` is a dangling pointer and the object is in an invalid state. The copy-and-swap idiom fixes this by not modifying `*this` until a successful copy is made.

---

## Day 15: Error Handling and std::expected (C++23)

**Q:** When should you use exceptions versus `std::expected<T,E>`?

**A:** Use exceptions for truly unexpected conditions (e.g., out-of-memory) or when propagating errors through many layers without touching intermediate code. Use `std::expected` when failure is a normal, expected outcome that callers should explicitly handle.

---

**Q:** How does `std::expected<T, E>` differ from returning an error code?

**A:** `std::expected` carries either a success value or an error value in a single return type, making it impossible to accidentally use the value when an error occurred. With `[[nodiscard]]`, discarding the result is a compiler warning.

---

**Q:** What does `.and_then` do in an `std::expected` pipeline?

**A:** `.and_then(f)` calls `f` with the success value only if the expected holds a value, propagating the error unchanged otherwise. It enables building a chain of fallible operations without nested `if` error checks.

---

**Q:** What is `std::unexpected`, and how is it used?

**A:** `std::unexpected<E>` wraps an error value and is used to construct the error case of `std::expected`: `return std::unexpected{ConfigError::file_not_found};`. It distinguishes error construction from value construction at the call site.

---

**Q:** What does `noexcept` on a function promise the compiler, and what happens if the promise is broken?

**A:** `noexcept` promises the function will never throw. If an exception propagates out of a `noexcept` function, `std::terminate` is called immediately. The compiler uses this guarantee to elide stack-unwinding infrastructure.

---

## Day 16: Modules (C++20)

**Q:** What is a Binary Module Interface (BMI), and how does it differ from a precompiled header?

**A:** A BMI is a compiled representation of a module's exported interface, produced once and reused by importers. Unlike a PCH, a BMI exposes only explicitly exported declarations, hiding internal implementation details and avoiding macro leakage.

---

**Q:** What is the global module fragment, and why is it needed?

**A:** The global module fragment (`module;` before `export module name;`) is where you place `#include` directives for legacy headers. Declarations from these headers are not exported with the module, keeping the module interface clean.

---

**Q:** What is a module partition, and when would you use one?

**A:** A module partition (`export module MyLib:part;`) splits a large module into separately compiled files. The primary module interface re-exports selected partitions, enabling large-scale organisation without a monolithic interface file.

---

**Q:** What pitfall arises when mixing `#include` and `import` in the same translation unit?

**A:** Macros from `#include`d headers can affect module-imported code, and the global module fragment ordering rules are strict. The safest practice is to use `#include` only in the global module fragment and `import` for all module dependencies.

---

**Q:** Why does `import std;` require a dedicated `std` module to be installed?

**A:** `import std;` imports the entire C++ standard library as a pre-built module, but the compiler must have a pre-compiled standard library module available. Not all toolchains provide this; GCC and MSVC support it in recent versions, but setup varies.

---

## Day 17: Design Patterns in Modern C++

**Q:** How does the Factory Method pattern differ from a simple constructor call?

**A:** A factory method returns a pointer to a base type, hiding which concrete subclass is constructed. This decouples the caller from the concrete type and allows changing the created subclass without modifying the caller.

---

**Q:** How is the Observer pattern implemented in modern C++?

**A:** An `Observable` holds a `std::vector<std::function<void(Event)>>` of subscribers. `subscribe()` adds a callback, and `notify()` iterates the list calling each. `std::function` allows any callable (lambda, method, free function) as an observer.

---

**Q:** What is the Decorator pattern, and how does it avoid subclass explosion?

**A:** Decorator wraps an object in another object implementing the same interface, adding behaviour before/after delegation. Instead of one subclass per combination of features, you compose decorators at runtime: `make_unique<Logging>(make_unique<Caching>(core))`.

---

**Q:** Why is the Command pattern useful for undo/redo?

**A:** Each command encapsulates an action and its inverse as `execute()` and `undo()`. A history stack of command objects lets you replay or reverse operations without coupling the UI to the underlying data model.

---

**Q:** What pitfall arises with the Singleton pattern in multithreaded code?

**A:** A naively implemented Singleton can have a race condition during first initialisation. In C++11+, local `static` variables are initialised in a thread-safe manner, so `static MyClass instance;` inside a `getInstance()` function is safe.

---

## Day 18: SOLID Principles

**Q:** What does the Single Responsibility Principle say, and how does a "God class" violate it?

**A:** SRP states a class should have only one reason to change — one responsibility. A God class accumulates unrelated responsibilities (parsing, networking, UI), meaning any change to any concern requires modifying the same class.

---

**Q:** How do you apply the Open/Closed Principle with templates or virtual dispatch?

**A:** Design so new behaviour is added by writing new types (new strategy classes or new template arguments) rather than modifying existing code. The existing class is "closed" to modification but "open" for extension through its abstraction points.

---

**Q:** What is the Liskov Substitution Principle, and what is a classic violation?

**A:** LSP requires that derived classes can be substituted for their base class without altering program correctness. The classic violation is `Square` inheriting from `Rectangle`: setting width on a `Rectangle*` that points to a `Square` breaks the width/height invariant.

---

**Q:** What is constructor injection, and why is it preferred over setter injection for required dependencies?

**A:** Constructor injection passes dependencies through the constructor, making them available immediately and allowing them to be `const` members. Setter injection permits objects to exist in an incomplete state, complicating reasoning about validity.

---

**Q:** What does the Dependency Inversion Principle say, and how do interfaces implement it?

**A:** High-level modules should not depend on low-level modules; both should depend on abstractions. By depending on `IDatabase*` rather than `MySQLDatabase*`, the high-level module is decoupled and can work with any conforming implementation.

---

## Day 19: Testing with Catch2

**Q:** What is the red-green-refactor TDD cycle?

**A:** Write a failing test (red), write the minimal code to make it pass (green), then improve the design without breaking tests (refactor). This rhythm ensures every piece of code has a test and that refactoring is safe.

---

**Q:** What is the difference between `REQUIRE` and `CHECK` in Catch2?

**A:** `REQUIRE` halts the current test case immediately on failure. `CHECK` records the failure but continues executing the test, allowing all failures in a test to be reported in a single run.

---

**Q:** What is a test double, and what are the four main kinds?

**A:** A test double replaces a real dependency in tests. The four kinds are: stub (returns fixed values), fake (working but simplified implementation), mock (verifies interactions/call counts), and spy (records calls for later inspection).

---

**Q:** What is a characterisation test, and when is it used?

**A:** A characterisation test documents the current (possibly buggy) behaviour of existing code before refactoring. It provides a safety net: if refactoring changes the output, the test fails, alerting you to unintended behaviour changes.

---

**Q:** What is the `SECTION` construct in Catch2, and why is it useful?

**A:** `SECTION` divides a single `TEST_CASE` into independent sub-scenarios that each start from the shared setup code above them. Each `SECTION` runs as a separate test path, reducing duplication while keeping setup clean.

---

## Day 20: CRTP and Static Polymorphism

**Q:** How does CRTP achieve static polymorphism without vtables?

**A:** The base template casts `this` to `Derived&` and calls methods directly: `static_cast<Derived&>(*this).method()`. The call is resolved at compile time through the template instantiation, so there is no vtable and calls can be inlined.

---

**Q:** What is `std::span<T>`, and how does it differ from a raw pointer?

**A:** `std::span<T>` is a non-owning view over a contiguous sequence, carrying both a pointer and a size. Unlike a raw pointer, it enables range-based iteration, bounds checking (in debug mode), and passes without knowing the container type.

---

**Q:** What is a CRTP mixin, and how do you use it to add comparison operators?

**A:** A mixin base implements derived operators (`!=`, `>`, `<=`, `>=`) in terms of primitives (`==`, `<`) provided by the derived class. By inheriting `Comparable<Derived>`, the derived class gets all comparison operators without writing each one.

---

**Q:** What pitfall arises if you use CRTP base classes with non-virtual destructors polymorphically?

**A:** If you `delete` a derived object through a `Base<Derived>*`, the derived destructor does not run because the base destructor is not virtual. CRTP bases should either have a `protected` non-virtual destructor (preventing deletion through base pointer) or a `virtual` one.

---

**Q:** How does `std::ranges::sort` use a concept constraint to enforce requirements on its input?

**A:** `std::ranges::sort` requires `std::sortable<I>`, which checks that the iterator supports random access, swapping, and less-than comparison. If you pass an unsorted container, you get a clear concept violation instead of a cryptic template error.

---

## Day 21: Type Erasure

**Q:** What problem does type erasure solve?

**A:** Type erasure allows code to work with objects of arbitrary types without knowing the concrete type at compile time, without requiring a common base class. It provides runtime polymorphism for types that do not share an inheritance hierarchy.

---

**Q:** How does `std::function<void()>` perform type erasure?

**A:** `std::function` stores any callable in an internal buffer using a virtual dispatch table (or similar mechanism). The stored callable's type is erased; the only interface exposed is the call operator with the specified signature.

---

**Q:** What is the Concept/Model type erasure pattern?

**A:** A `Concept` abstract base defines the interface. A `Model<T>` template derives from `Concept` and holds a concrete `T`, delegating all calls to it. The outer type stores a `unique_ptr<Concept>`, providing polymorphism without inheritance on `T`.

---

**Q:** What is the difference between `std::any` and `std::variant` for type erasure?

**A:** `std::variant<A,B,C>` holds exactly one of a fixed set of types and provides exhaustive dispatch via `std::visit`. `std::any` holds any type without a fixed set but requires `any_cast` for access and loses compile-time exhaustiveness checking.

---

**Q:** What is the SBO threshold in `std::function`, and what happens when it is exceeded?

**A:** Small-buffer optimisation stores callables up to a threshold (typically 24–32 bytes) inline without heap allocation. Larger callables (those capturing many variables) overflow the buffer and trigger a heap allocation, adding latency.

---

## Day 22: Performance Tips for OOP

**Q:** What is the difference between Array-of-Structs (AoS) and Struct-of-Arrays (SoA), and when is SoA faster?

**A:** AoS stores each object contiguously: `[x,y,z, x,y,z, ...]`. SoA stores each field contiguously: `[x,x,x,...], [y,y,y,...], [z,z,z,...]`. SoA is faster for loops that access only one or two fields because those fields fit in cache without loading unused fields.

---

**Q:** What is devirtualisation, and what enables it?

**A:** Devirtualisation is when the compiler converts a virtual call to a direct call or inlines it, eliminating vtable dispatch. It is enabled by `final` on the class, local type deduction (knowing the concrete type), or link-time optimisation (LTO).

---

**Q:** What is hot/cold field splitting, and why does it improve performance?

**A:** Hot/cold splitting moves frequently-accessed fields into a compact "hot" struct and rarely-accessed fields into a "cold" struct accessed via pointer. The hot struct fits in fewer cache lines, improving cache hit rate for common operations.

---

**Q:** Why should you not apply `[[likely]]` or `[[unlikely]]` without profiling data?

**A:** Intuition about branch probability is often wrong. An incorrect hint tells the compiler to optimise for the wrong path, degrading performance for the common case. Always measure branch frequencies with a profiler before applying these attributes.

---

**Q:** What is the pitfall of storing polymorphic objects as `vector<unique_ptr<Base>>`?

**A:** Each object is allocated separately on the heap, scattering them across memory. Iterating the vector causes one cache miss per object, destroying cache efficiency compared to a contiguous array. Use SoA or object pools for hot polymorphic collections.

---

## Day 23: Modern Features Preview — C++26

**Q:** What does static reflection (P2996) enable that was not possible before in standard C++?

**A:** Static reflection provides compile-time introspection of type structure (member names, types, enumerators) as first-class values. This eliminates external code generators for serialisation, enum-to-string conversion, and similar boilerplate.

---

**Q:** How does `inspect` (P2688 pattern matching) improve on `std::visit` + `overloaded`?

**A:** `inspect` provides a readable, structured syntax for multi-way dispatch with type, value, and structural patterns in a single block. `std::visit` + `overloaded` requires constructing an overload set manually and is more verbose.

---

**Q:** What is the difference between a C++26 `pre()` contract and `assert()`?

**A:** `pre()` is a language-level precondition on a function declaration expressing a caller obligation, while `assert()` is a runtime check inside the function body. Contracts can be enabled, disabled, or set to observe mode independently of `NDEBUG`.

---

**Q:** What does "merged into C++26 draft" mean for compiler support?

**A:** It means the ISO committee voted to include the feature in the specification being developed, but it does NOT mean any released compiler supports it. Compiler implementation typically lags 6–24 months behind the specification. Always check cppreference compiler support tables.

---

**Q:** What does `std::inplace_vector<T, N>` provide, and how does `try_push_back` differ from `push_back`?

**A:** `inplace_vector` is a `vector`-like container with fixed inline storage of `N` elements — no heap allocation. `push_back` throws `std::bad_alloc` when full; `try_push_back` returns a null pointer on overflow, allowing graceful handling without exceptions.

---

**Q:** Why does the feature-test macro pattern `#if defined(__cpp_reflection)` matter for C++26 features?

**A:** It allows code to use native C++26 features when available and fall back to portable alternatives (e.g., Boost.PFR) when not. This enables gradual adoption without breaking CI on compilers that have not yet implemented the feature.

---

## Day 24: Mini Project 1 — Bank Account System

**Q:** What SOLID principles does a well-designed `BankAccount` class hierarchy apply?

**A:** SRP: each account type handles only its own rules. OCP: adding a new account type (e.g., `InvestmentAccount`) requires no changes to existing code. LSP: all account types can be used through `IAccount*` without special casing. DIP: the transaction engine depends on `IAccount`, not concrete types.

---

**Q:** Why is `std::expected<Money, TransactionError>` a better return type for `withdraw()` than throwing an exception?

**A:** Insufficient funds is an expected, recoverable outcome — not an exceptional condition. `std::expected` makes the error visible in the type signature, prevents accidental discard, and allows building pipelines with `.and_then` without exception-handling overhead.

---

**Q:** How does the Observer pattern apply to a bank account system?

**A:** The account is the subject; transaction loggers, fraud detectors, and notification services are observers. When a transaction occurs, the account notifies all observers via a callback list, decoupling the account from any specific monitoring logic.

---

**Q:** What is the role of a repository pattern in the bank system project?

**A:** A repository abstracts persistence behind an interface (`IAccountRepository`), so the domain logic (transfers, interest calculation) does not depend on the storage mechanism (in-memory, SQL, file). This enables testing with a fake in-memory repository.

---

**Q:** Why should `Money` be a value type with `operator==` and no implicit conversion from `double`?

**A:** Floating-point arithmetic causes rounding errors unsuitable for financial calculations. A `Money` type using integer cents prevents floating-point accumulation and `explicit` construction prevents accidental implicit conversions from raw `double` literals.

---

## Day 25: Mini Project 2 — Shape Editor

**Q:** What design pattern is central to a shape editor's undo/redo system?

**A:** The Command pattern: each editing operation (move, resize, delete) is encapsulated as an object with `execute()` and `undo()`. A history stack replays or reverses commands without the editor knowing the details of each operation.

---

**Q:** How does the Composite pattern apply to grouped shapes?

**A:** A `ShapeGroup` implements the same `IShape` interface as `Circle`, `Rectangle`, etc. It holds a `vector<shared_ptr<IShape>>` of children and delegates operations (draw, hit-test, move) to each child. The editor treats groups and primitives identically.

---

**Q:** Why is a scene graph represented as a tree rather than a flat list?

**A:** A tree naturally represents nesting: groups contain shapes, groups can contain other groups. Transformations (translate, scale) applied to a parent propagate to all children. A flat list cannot represent hierarchical containment or grouped transforms.

---

**Q:** What is the Visitor pattern, and how does it help with operations on a shape hierarchy?

**A:** Visitor separates an operation (e.g., serialisation, area calculation) from the object structure. A `ShapeVisitor` has `visit(Circle&)`, `visit(Rectangle&)` etc. Each shape calls `visitor.visit(*this)`, allowing new operations without modifying shape classes.

---

**Q:** How does `std::variant<Circle, Rectangle, Triangle>` compare to a virtual dispatch shape hierarchy for a closed set of shapes?

**A:** `std::variant` avoids heap allocation and virtual dispatch, provides exhaustive checking when adding a new shape type, and enables `std::visit` with a local overload set. It is preferable when the set of shapes is fixed; virtual dispatch is better for open extension.

---

## Day 26: Mini Project 3 — Game Entities (ECS)

**Q:** What is an Entity Component System (ECS), and why is it used in game development?

**A:** ECS separates data (components) from logic (systems) and identity (entities are just IDs). All components of one type are stored contiguously, making update loops cache-friendly. Systems iterate component arrays rather than objects, enabling high-throughput updates.

---

**Q:** How does SoA storage of components improve cache performance in an ECS?

**A:** Storing one component type per array means a system iterating only `Position` components accesses contiguous memory with no gaps from other components. This maximises cache utilisation versus AoS where each object mixes all components.

---

**Q:** What is an event bus, and how does it decouple game systems?

**A:** An event bus allows systems to communicate by publishing and subscribing to typed events without direct references. A collision system publishes `CollisionEvent`; an audio system and a damage system subscribe independently, so neither system knows about the other.

---

**Q:** What is spatial partitioning (e.g., a grid), and what performance problem does it solve?

**A:** Spatial partitioning divides world space into cells so that collision and proximity queries only check entities in the same or neighbouring cells, reducing O(n²) brute-force pair checks to near O(n) for sparse scenes.

---

**Q:** Why is the Archetype pattern used in production ECS engines like Unity DOTS?

**A:** Archetypes group entities with the same set of component types into contiguous arrays. When a component is added or removed, the entity moves to the matching archetype. This keeps iteration over a specific component combination maximally cache-friendly.

---

## Day 27: Refactoring Legacy Code

**Q:** What is a characterisation test, and why must it come before refactoring?

**A:** A characterisation test captures the current behaviour of legacy code by running it and asserting the actual output. Before refactoring, it creates a safety net: any unintended behavioural change causes a test failure, enabling confident transformation.

---

**Q:** What is the Strangler Fig pattern for incremental refactoring?

**A:** The Strangler Fig gradually replaces legacy code by building new functionality alongside the old, routing more traffic to the new code over time, until the old code can be removed. It avoids a risky big-bang rewrite and keeps the system functional throughout.

---

**Q:** What are two common code smells that indicate a class violates SRP?

**A:** A "God class" with many unrelated methods, and a class whose name contains "And" or "Manager". Both indicate multiple responsibilities that should be split into separate classes.

---

**Q:** How does `clang-tidy` help during refactoring?

**A:** `clang-tidy` applies automated checks and fixups (e.g., `modernize-use-override`, `cppcoreguidelines-*`) to flag and auto-correct common issues. Running it after refactoring verifies that the new code conforms to modern C++ idioms without manual review of every line.

---

**Q:** What is the "extract method" refactoring, and what precondition must hold?

**A:** Extract method moves a block of code into a named function with parameters for any local variables it needs. The precondition is that the block has a single entry point and clear data dependencies — i.e., you can identify all inputs and outputs.

---

## Day 28: Code Review Practices

**Q:** What are the five layers of a C++ code review checklist?

**A:** (1) Correctness (logic, UB, threading), (2) Resource management (ownership, leaks, RAII), (3) API design (clarity, error handling, `const`-correctness), (4) Performance (unnecessary copies, algorithmic complexity), and (5) Maintainability (naming, testability, coupling).

---

**Q:** What is the severity classification system for code review comments, and why is it useful?

**A:** Typically: blocker (must fix before merge), major (should fix), minor (optional improvement), nit (style). Classification helps authors prioritise and prevents minor style disagreements from blocking correct, important changes.

---

**Q:** What C++ anti-pattern does this code demonstrate?

```cpp
void process(std::vector<int> v) { /* ... */ }
process(huge_vector);
```

**A:** Passing by value copies `huge_vector` unnecessarily. Unless the function needs to modify a local copy, `const std::vector<int>&` avoids the copy. This is the "unnecessary copy" anti-pattern, flagged by `clang-tidy`'s `performance-unnecessary-copy-initialization`.

---

**Q:** Why should `clang-format` be enforced in CI rather than reviewed manually?

**A:** Style debates in code review waste reviewer attention on subjective preferences rather than correctness and design. Automating formatting with `clang-format` in CI eliminates style disagreements entirely and keeps diffs focused on meaningful changes.

---

**Q:** What is the "boolean parameter" anti-pattern, and what is the idiomatic C++ fix?

**A:** Functions like `process(data, true, false)` use boolean flags whose meaning is opaque at the call site. The fix is a `enum class` or named struct: `process(data, Mode::Async, Cache::Disabled)` reads clearly without knowing the function signature.

---

## Day 29: Advanced Topics

**Q:** What are the three keywords that define a C++20 coroutine, and what does each do?

**A:** `co_yield` suspends the coroutine and yields a value to the caller. `co_await` suspends until an awaitable completes. `co_return` finalises the coroutine and optionally provides a final value.

---

**Q:** What is `std::pmr` (polymorphic memory resource), and why is it useful?

**A:** `std::pmr` provides an allocator interface that can be swapped at runtime — for example, using a stack-based `monotonic_buffer_resource` to eliminate heap allocation in a hot loop. Standard containers (`std::pmr::vector`) accept a `pmr::memory_resource*` and forward all allocations through it.

---

**Q:** What is the difference between `consteval` and `constexpr` functions?

**A:** `constexpr` functions may run at compile time or runtime. `consteval` functions (immediate functions) must always be evaluated at compile time; calling one in a runtime context is a compile error. Use `consteval` to enforce compile-time evaluation.

---

**Q:** What does `std::bit_cast<To>(from)` do, and why is it safer than `reinterpret_cast`?

**A:** `std::bit_cast` reinterprets the bit pattern of `from` as type `To` (both must be the same size and trivially copyable). Unlike `reinterpret_cast`, it is well-defined, `constexpr`-capable, and does not invoke undefined behaviour.

---

**Q:** What pitfall arises with coroutine lifetimes and captured references?

**A:** A coroutine's frame persists between suspension points. If the coroutine captures a reference to a local variable in the caller and the caller's frame is destroyed before the coroutine completes, the reference dangles. Always ensure coroutine lifetime is shorter than referenced objects, or capture by value.

---

## Day 30: Review, Certification Prep, and Next Steps

**Q:** What is the most effective study technique for consolidating a large body of C++ knowledge?

**A:** Active recall — attempting to answer questions without looking — is far more effective than re-reading notes. Spaced repetition with flashcards targets weak areas efficiently; explaining concepts aloud (the Feynman technique) reveals gaps immediately.

---

**Q:** What are three signs that a C++ codebase is well-designed?

**A:** (1) New features can be added by writing new code, not modifying existing code (OCP). (2) Every class has a single, clearly nameable responsibility (SRP). (3) Tests are independent and fast, with no global state dependencies.

---

**Q:** How do the course topics build towards C++26?

**A:** The foundation (RAII, templates, concepts) makes C++26 features comprehensible. Contracts extend concepts into runtime; static reflection automates what templates and macros handle today; `std::execution` formalises the async patterns built on futures and coroutines.

---

**Q:** What is the recommended path from this course to production-grade C++ expertise?

**A:** Apply concepts in a real project (open source contribution or personal project), read the C++ Core Guidelines, study compiler explorer output to understand codegen, and follow the ISO committee papers (`open-std.org`) to stay current with the language direction.

---

**Q:** Why is benchmark-first discipline essential for C++ performance work?

**A:** Intuition about bottlenecks is unreliable — the actual hot path is almost always different from what developers expect. Profiling identifies where time is actually spent, ensuring optimisation effort is directed where it has measurable impact and is not wasted on cold paths.

---
