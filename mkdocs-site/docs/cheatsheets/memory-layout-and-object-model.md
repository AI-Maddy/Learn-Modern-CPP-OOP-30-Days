---
title: "Memory Layout And Object Model"
tags: ["cheatsheet", "reference"]
---

# :material-book: Memory Layout And Object Model


!!! abstract "🟣 Parietal Lobe — Pattern Recognition Reference"
    This is a **quick reference** card. Keep it open while coding.


---

# Memory Layout and Object Model

<div class="contents" local="" depth="2">

Sections

</div>

## sizeof and alignof

``` cpp
struct A { char c; int i; };
// sizeof(A) == 8 typically: 1 byte + 3 padding + 4 bytes
static_assert(sizeof(A)  >= sizeof(int));
static_assert(alignof(A) == alignof(int));  // alignment = largest member

struct B { int i; char c; };
// sizeof(B) == 8 typically: 4 bytes + 1 byte + 3 tail padding
// (B must be padded to a multiple of alignof(int)==4)

// Scalars:
// sizeof(char)==1, sizeof(short)==2, sizeof(int)==4, sizeof(long long)==8
// sizeof(float)==4, sizeof(double)==8, sizeof(pointer)==4 or 8 (platform)
```

## Struct Padding Rules

The compiler inserts padding so each member starts at an address that is a multiple of that member's alignment requirement.

``` cpp
// BAD layout: wastes 6 bytes
struct Wasteful {
    char   a;    // offset 0,  size 1
    // 7 bytes padding
    double b;    // offset 8,  size 8
    char   c;    // offset 16, size 1
    // 7 bytes tail padding
};
// sizeof(Wasteful) == 24

// GOOD layout: put largest members first
struct Packed {
    double b;    // offset 0,  size 8
    char   a;    // offset 8,  size 1
    char   c;    // offset 9,  size 1
    // 6 bytes tail padding (align to 8)
};
// sizeof(Packed) == 16

// Tip: sort members from largest to smallest alignment

// #pragma pack(1) forces no padding — use only for binary protocols
// Can cause undefined behavior on strict-alignment architectures
```

## \[\[no_unique_address\]\] (C++20)

Allows an empty base subobject to share the address of another member, removing the 1-byte overhead of empty member storage:

``` cpp
struct DefaultAlloc {
    void* allocate(std::size_t n) { return ::operator new(n); }
    void  deallocate(void* p)     { ::operator delete(p); }
};

// Without [[no_unique_address]]: allocator takes ≥1 byte
template <typename T, typename Alloc>
struct OldContainer {
    T*    data;
    Alloc alloc;   // 1 byte even if empty
};
// sizeof(OldContainer<int,DefaultAlloc>) = 8 + 1 + 7 padding = 16

// With [[no_unique_address]]: zero extra bytes for empty Alloc
template <typename T, typename Alloc>
struct NewContainer {
    T*    data;
    [[no_unique_address]] Alloc alloc;
};
// sizeof(NewContainer<int,DefaultAlloc>) = 8 (alloc occupies 0 bytes)
```

## vtable Pointer Overhead

Every class with a virtual function gets a hidden `vptr` (pointer to the vtable), added as the first member of the object.

``` cpp
struct Plain       { int x; };         // sizeof == 4
struct WithVirtual { virtual void f(); int x; };
// sizeof(WithVirtual) == 4 + 8(vptr) + 0 padding = 16 on 64-bit
// (or 12 on 32-bit with 4-byte pointer)

// The vtable itself is a static array of function pointers:
// - One entry per virtual function
// - Shared by all objects of the same type (not per-object)
// - Each derived class gets its OWN vtable if it overrides anything

struct Base    { virtual void f(); virtual void g(); int b; };
struct Derived : Base { void f() override; int d; };
// Base layout:    [vptr | b]          (16 bytes)
// Derived layout: [vptr | b | d]      (24 bytes)
// Derived vtable: [&Derived::f, &Base::g]
```

## Virtual Inheritance Layout

Virtual inheritance avoids the "diamond" duplication problem but adds an extra layer of indirection (vbptr or offset in vtable).

``` cpp
struct A       { int a; };
struct B : virtual A { int b; };
struct C : virtual A { int c; };
struct D : B, C      { int d; };

// Without virtual: D would have TWO copies of A
// With virtual: D has ONE shared A

// Typical layout of D (compiler-dependent):
//   [vbptr_B | b | vbptr_C | c | d | A::a]
// sizeof(D) > sizeof(B) + sizeof(C) - sizeof(A): offset overhead

// Performance: virtual base access requires an extra indirection
// Use virtual inheritance only when the diamond is unavoidable
```

## Cache Line Size and Performance

Modern CPUs load memory in 64-byte cache lines. Objects that cross cache line boundaries cause extra loads.

``` cpp
// Hot data (frequently accessed together) should share a cache line:
struct HotCold {
    // Hot fields — accessed in tight loop
    int    id;
    float  position[3];
    float  velocity[3];
    // Total hot: 28 bytes — fits in one 64-byte line

    // Cold fields — rarely accessed
    std::string name;       // 32 bytes
    int         flags[16];  // push these to a separate struct
};

// AoS vs SoA for SIMD-friendly access:
// AoS (Array of Structs):
struct Particle { float x, y, z, vx, vy, vz; };
Particle particles[1000];   // x,y,z,vx,vy,vz,x,y,z... interleaved

// SoA (Struct of Arrays) — better for batch operations on one field:
struct Particles {
    float x[1000], y[1000], z[1000];
    float vx[1000], vy[1000], vz[1000];
};
// Reading all x values: contiguous memory, max cache efficiency
```

### Cache Line Alignment

``` cpp
// Prevent false sharing: two threads writing different fields in same cache line
struct alignas(64) ThreadLocal {
    int counter = 0;
    // padding to 64 bytes ensures no other data shares this cache line
    char pad[64 - sizeof(int)];
};

// C++17: hardware_destructive_interference_size
struct alignas(std::hardware_destructive_interference_size) Atomic {
    std::atomic<int> counter{0};
};
```

## Placement new

Construct an object at a specific memory address without allocation:

``` cpp
alignas(Widget) char buf[sizeof(Widget)];

Widget* w = new (buf) Widget{42};   // construct in buf, no heap alloc
w->do_work();
w->~Widget();   // explicit destructor call required!
// do NOT delete w (buf is not heap-allocated)

// Common use: object pools, arenas, stack-local storage
// Common pitfall: forgetting to call the destructor
```

## std::aligned_storage Replacement (C++23)

`std::aligned_storage` is deprecated in C++23. Use `alignas` + array:

``` cpp
// C++17 / deprecated C++23:
std::aligned_storage_t<sizeof(Widget), alignof(Widget)> old_buf;

// C++23 / preferred:
alignas(Widget) std::byte buf[sizeof(Widget)];
Widget* w = new (buf) Widget{};
w->~Widget();
```

## Object Lifetime and std::launder

After placement new over an existing object, the old pointer becomes invalid. `std::launder` tells the compiler "this pointer points to a new live object at this address":

``` cpp
alignas(int) char storage[sizeof(int)];
int* p = new (storage) int{42};

// After placement-new, accessing through original char* is UB
// *reinterpret_cast<int*>(storage) = 99;  // may be optimized away!

// GOOD: use std::launder to get a valid pointer
int* q = std::launder(reinterpret_cast<int*>(storage));
*q = 99;   // OK

// std::launder is needed when:
// - const or reference members are replaced via placement new
// - Compiler caches original value and won't re-read through old pointer
```

## Object Lifetime Rules

``` cpp
// 1. Lifetime begins when constructor completes
// 2. Lifetime ends when destructor starts (or storage reused)
// 3. Using an object outside its lifetime is UB

Widget* w = static_cast<Widget*>(::operator new(sizeof(Widget)));
// w points to raw storage — NO Widget lifetime yet
// w->member = 5;   // UB: object not yet alive

new (w) Widget{};  // lifetime begins here
w->member = 5;     // OK
w->~Widget();      // lifetime ends here
// w->member = 5;  // UB: lifetime ended
::operator delete(w);
```

## Pitfalls

**Pitfall 1: Assuming struct layout is portable**

``` cpp
// BAD: reading binary file assuming exact layout
struct Header { uint8_t magic; uint32_t size; };
file.read(reinterpret_cast<char*>(&h), sizeof(h));
// Padding between magic and size may differ across compilers/targets!
// GOOD: read fields individually or use #pragma pack carefully
```

**Pitfall 2: Virtual destructor missing causes memory leak**

``` cpp
struct Base { virtual void f(); };
Base* p = new Derived{};
delete p;   // UB: Base destructor called, Derived::~Derived never runs
// GOOD: always add virtual ~Base() = default; to polymorphic bases
```

**Pitfall 3: Taking address of bit-field**

``` cpp
struct Flags { int a : 1; int b : 1; };
Flags f;
int* p = &f.a;   // ERROR: can't take address of bit-field
```

## Cross-References

- `performance-tips-oop.rst` — cache effects and AoS vs SoA in depth
- `common-pitfalls.rst` — object slicing and missing virtual destructor
- `modern-cpp20-23-cheat.rst` — \[\[no_unique_address\]\], std::byte
- `crtp-static-polymorphism.rst` — avoiding vtable overhead


---

[← All Cheatsheets](index.md)
