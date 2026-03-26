CRTP and Static Polymorphism
=============================

.. contents:: Sections
   :local:
   :depth: 2

CRTP Pattern Mechanics
-----------------------

The Curiously Recurring Template Pattern (CRTP) passes the derived class
as a template argument to its own base, enabling the base to call derived
methods **without** a virtual function table.

.. code-block:: cpp

   // Base receives Derived as template argument
   template <typename Derived>
   struct Shape {
       // Non-virtual "polymorphic" call via static_cast
       double area() const {
           return static_cast<const Derived*>(this)->area_impl();
       }
       void print() const {
           std::cout << "Area: " << area() << '\n';
       }
   };

   struct Circle : Shape<Circle> {
       double radius;
       explicit Circle(double r) : radius(r) {}
       double area_impl() const { return 3.14159 * radius * radius; }
   };

   struct Rectangle : Shape<Rectangle> {
       double w, h;
       Rectangle(double w, double h) : w(w), h(h) {}
       double area_impl() const { return w * h; }
   };

   Circle c{5.0};
   c.print();       // calls area_impl() with zero virtual overhead
   Rectangle r{3, 4};
   r.print();

Static Interface Enforcement
-----------------------------

Use ``static_assert`` to produce a clear error if the derived class forgets
to implement the required method:

.. code-block:: cpp

   template <typename Derived>
   struct Serializable {
       std::string serialize() const {
           // Guard: fails at compile time with a readable message
           static_assert(
               requires(const Derived& d) { d.serialize_impl(); },
               "Derived must implement serialize_impl() const"
           );
           return static_cast<const Derived*>(this)->serialize_impl();
       }
   };

   struct Config : Serializable<Config> {
       std::string key, value;
       std::string serialize_impl() const { return key + "=" + value; }
   };

   struct BrokenConfig : Serializable<BrokenConfig> {
       // forgot serialize_impl -> clear static_assert message at call site
   };

Mixin Accumulation (Multiple CRTP Bases)
-----------------------------------------

Inherit from multiple CRTP bases to compose orthogonal capabilities:

.. code-block:: cpp

   template <typename D>
   struct Printable {
       void print()  const { std::cout << static_cast<const D*>(this)->to_string(); }
       void println() const { print(); std::cout << '\n'; }
   };

   template <typename D>
   struct Comparable {
       bool operator==(const D& o) const {
           return static_cast<const D*>(this)->compare(o) == 0;
       }
       bool operator<(const D& o) const {
           return static_cast<const D*>(this)->compare(o) < 0;
       }
       bool operator>(const D& o) const { return o < static_cast<const D&>(*this); }
   };

   template <typename D>
   struct Hashable {
       std::size_t hash() const {
           return std::hash<std::string>{}(static_cast<const D*>(this)->to_string());
       }
   };

   // Aggregate all mixins into one concrete class
   struct Point : Printable<Point>, Comparable<Point>, Hashable<Point> {
       int x, y;
       Point(int x, int y) : x(x), y(y) {}
       std::string to_string() const { return "(" + std::to_string(x) + "," + std::to_string(y) + ")"; }
       int compare(const Point& o) const {
           if (x != o.x) return x - o.x;
           return y - o.y;
       }
   };

   Point p1{1, 2}, p2{3, 4};
   p1.println();              // uses Printable mixin
   bool less = p1 < p2;      // uses Comparable mixin
   auto h = p1.hash();       // uses Hashable mixin

CRTP for Policy-Based Design
------------------------------

Separate algorithm (policy) from the type it operates on:

.. code-block:: cpp

   // Allocation policy
   struct HeapAllocPolicy {
       static void* allocate(std::size_t n)   { return ::operator new(n); }
       static void  deallocate(void* p)       { ::operator delete(p); }
   };

   struct StackAllocPolicy {
       alignas(std::max_align_t) char buf[4096];
       std::size_t used = 0;
       void* allocate(std::size_t n) {
           void* p = buf + used;
           used += n;
           return p;
       }
       void deallocate(void*) {}   // no-op for stack
   };

   template <typename AllocPolicy>
   class Pool : private AllocPolicy {
   public:
       void* get(std::size_t n) { return AllocPolicy::allocate(n); }
       void  put(void* p)       { AllocPolicy::deallocate(p); }
   };

   Pool<HeapAllocPolicy>  heap_pool;
   Pool<StackAllocPolicy> stack_pool;

CRTP vs Virtual Dispatch: Performance
---------------------------------------

+----------------------------+-----------------------+------------------------------+
| Criterion                  | Virtual dispatch       | CRTP static dispatch         |
+============================+=======================+==============================+
| Dispatch mechanism         | Indirect call via      | Direct call (inlineable)     |
|                            | vtable pointer         |                              |
+----------------------------+-----------------------+------------------------------+
| Overhead per call          | ~1 indirect jmp +      | Zero (often inlined away)    |
|                            | icache miss            |                              |
+----------------------------+-----------------------+------------------------------+
| Runtime polymorphism       | Yes (store Base*)      | No (must know type at        |
|                            |                        | compile time)                |
+----------------------------+-----------------------+------------------------------+
| sizeof overhead per object | +1 pointer (vptr)      | None                         |
+----------------------------+-----------------------+------------------------------+
| Compiler optimisation      | Devirtualisation       | Full inlining possible       |
|                            | sometimes possible     |                              |
+----------------------------+-----------------------+------------------------------+
| Heterogeneous containers   | Yes: vector<Base*>     | No: must be same type        |
+----------------------------+-----------------------+------------------------------+
| Extensibility at runtime   | Yes (plugin DLLs)      | No                           |
+----------------------------+-----------------------+------------------------------+
| Debug / error messages     | Clear                  | Template cascade errors      |
+----------------------------+-----------------------+------------------------------+

Rule of thumb: prefer virtual when you need runtime extensibility or
heterogeneous containers; prefer CRTP when the type set is fixed at
compile time and call frequency is high (hot loops, DSP, game engines).

CRTP with Inheritance Chains
-----------------------------

.. code-block:: cpp

   template <typename D> struct A { void fa() { static_cast<D*>(this)->fa_impl(); } };
   template <typename D> struct B : A<D> { void fb() { static_cast<D*>(this)->fb_impl(); } };

   struct C : B<C> {
       void fa_impl() { std::cout << "C::fa\n"; }
       void fb_impl() { std::cout << "C::fb\n"; }
   };

   C c;
   c.fa();   // OK: A<C>::fa -> C::fa_impl
   c.fb();   // OK: B<C>::fb -> C::fb_impl

std::span as a Simpler Alternative
-------------------------------------

When you only need to provide a **read interface** over a contiguous buffer,
``std::span`` avoids both virtual and CRTP complexity:

.. code-block:: cpp

   // Before: CRTP to provide uniform interface over fixed arrays + vectors
   template <typename D>
   struct DataSource {
       const int* data() const { return static_cast<const D*>(this)->data_impl(); }
       std::size_t size() const { return static_cast<const D*>(this)->size_impl(); }
   };

   // After: std::span works for any contiguous range
   void process(std::span<const int> data) {
       for (int v : data) { /* ... */ }
   }

   std::array<int, 5> arr{1,2,3,4,5};
   std::vector<int>   vec{10,20,30};
   process(arr);   // OK
   process(vec);   // OK

Pitfalls
---------

**Pitfall 1: Wrong Derived type in CRTP**

.. code-block:: cpp

   // BAD: Typo — Circle inherits from Shape<Rectangle>!
   struct Circle : Shape<Rectangle> {
       double area_impl() const { return 3.14 * r * r; }
   };
   // static_cast<Rectangle*> on a Circle object → UB (wrong dynamic type)

   // GOOD: add an ownership check in the base constructor
   template <typename Derived>
   struct Shape {
       Shape() {
           // Verify at construction that this IS a Derived
           static_assert(std::is_base_of_v<Shape, Derived>,
                         "CRTP: Derived must inherit from Shape<Derived>");
       }
   };

**Pitfall 2: Slicing through a Base<D> pointer**

.. code-block:: cpp

   // CRTP bases should not be used as polymorphic base pointers
   Shape<Circle>* p = new Circle{5};
   delete p;   // UB: Shape<Circle> has no virtual destructor

   // GOOD: never store heterogeneous CRTP objects by base pointer.
   // Use std::variant or virtual if you need that.

**Pitfall 3: Protected destructor pattern**

.. code-block:: cpp

   template <typename Derived>
   struct Base {
   protected:
       ~Base() = default;   // prevents accidental delete-via-base
   };

**Pitfall 4: Accessing Derived members before they are complete**

.. code-block:: cpp

   template <typename D>
   struct Counter {
       static int count;
       Counter()  { ++count; }
       ~Counter() { --count; }
   };
   // D is incomplete inside Counter<D> body — only sizeof/alignof/pointer-to OK

Cross-References
-----------------

* ``templates-basics.rst`` — class templates and partial specialization
* ``templates-concepts.rst`` — concept-constrained CRTP bases
* ``type-erasure-pimpl.rst`` — type erasure as runtime alternative
* ``performance-tips-oop.rst`` — virtual overhead measurements
