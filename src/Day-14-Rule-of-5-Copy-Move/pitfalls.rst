Pitfalls — Day 14: Rule of Five, Copy and Move
================================================

Pitfall 1: Rule of Three Violation — Missing Copy Assignment
-------------------------------------------------------------

**Description**: Defining a destructor and copy constructor but forgetting the copy
assignment operator leaves the class with a compiler-generated memberwise copy
assignment that does a shallow copy — a double-free waiting to happen.

**BAD**

.. code-block:: cpp

    class Buffer {
        char*       data_;
        std::size_t size_;
    public:
        explicit Buffer(std::size_t n) : data_(new char[n]), size_(n) {}
        ~Buffer() { delete[] data_; }

        Buffer(const Buffer& other)           // copy constructor defined — OK
            : data_(new char[other.size_])
            , size_(other.size_) {
            std::copy_n(other.data_, size_, data_);
        }
        // Copy assignment NOT defined — compiler generates shallow copy!
    };

    Buffer a{10};
    Buffer b{5};
    b = a;           // compiler-generated: b.data_ = a.data_  (shallow!)
    // Both a and b now point to the same memory.
    // When a or b is destroyed, the other's pointer is dangling — double free.

**Why it fails**: The compiler-generated copy assignment does ``b.data_ = a.data_``
and ``b.size_ = a.size_``.  The old allocation in ``b`` is leaked, and the now-shared
pointer leads to double-free on destruction.

**GOOD**

.. code-block:: cpp

    // Apply copy-and-swap — one function handles both copy and move assignment
    Buffer& operator=(Buffer other) noexcept {  // copy made in parameter
        std::swap(data_, other.data_);           // swap pointers
        std::swap(size_, other.size_);
        return *this;                            // other's destructor frees old data
    }

**Detection tip**: Valgrind's ``--tool=memcheck`` and AddressSanitizer both catch
double-free errors.  If you define a destructor, always check whether you need all
five special members.

Pitfall 2: Self-Assignment in Move Assignment
----------------------------------------------

**Description**: A move assignment operator that frees ``this``'s resources before
copying from ``other`` will corrupt the object if it is called with ``obj = std::move(obj)``.

**BAD**

.. code-block:: cpp

    Buffer& operator=(Buffer&& other) noexcept {
        delete[] data_;                // frees *this's memory
        data_ = other.data_;           // if other == *this, data_ is now dangling!
        size_ = other.size_;
        other.data_ = nullptr;
        other.size_ = 0;
        return *this;
    }

    Buffer b{10};
    b = std::move(b);   // self-move: delete[] data_ frees data, then data_ = data_
                        // UB: reading a freed pointer

**Why it fails**: When ``this == &other``, freeing ``this->data_`` also frees
``other.data_``.  Reading ``other.data_`` afterwards is undefined behaviour.

**GOOD**

.. code-block:: cpp

    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {           // self-move guard
            delete[] data_;
            data_ = std::exchange(other.data_, nullptr);
            size_ = std::exchange(other.size_, 0);
        }
        return *this;
    }

    // Alternatively, use swap (always safe for self-assignment):
    Buffer& operator=(Buffer&& other) noexcept {
        std::swap(data_, other.data_);
        std::swap(size_, other.size_);
        return *this;   // other destroyed with old data
    }

**Detection tip**: Use ``-fsanitize=address,undefined`` during tests and always test
``obj = std::move(obj)`` for any class with a custom move assignment.

Pitfall 3: Defining Destructor Suppresses Move Operations
---------------------------------------------------------

**Description**: Adding a user-defined destructor causes the compiler to suppress the
implicit move constructor and move assignment operator.  The class silently falls back
to copies everywhere a move was expected.

**BAD**

.. code-block:: cpp

    class Resource {
        int* handle_;
    public:
        explicit Resource(int v) : handle_(new int(v)) {}
        ~Resource() { delete handle_; }  // user-defined destructor

        // No move operations declared!
        // Compiler does NOT generate them because destructor is user-defined.
        // Compiler DOES generate copy constructor (for now — deprecated for future).
    };

    Resource a{42};
    Resource b = std::move(a);   // silently calls copy constructor — expensive!

**Why it fails**: The compiler-generated copy is chosen because the move operations
are not available.  For a large object this is a hidden performance regression.

**GOOD**

.. code-block:: cpp

    class Resource {
        int* handle_;
    public:
        explicit Resource(int v) : handle_(new int(v)) {}
        ~Resource() { delete handle_; }

        Resource(Resource&& other)            noexcept = default;   // re-enable move
        Resource& operator=(Resource&& other) noexcept = default;
        Resource(const Resource&)                       = delete;   // or implement
        Resource& operator=(const Resource&)            = delete;
    };

    // Verify:
    static_assert(std::is_nothrow_move_constructible_v<Resource>);

**Detection tip**: Add ``static_assert(std::is_move_constructible_v<T>)`` for every
class that should be movable but has a user-defined destructor.

Pitfall 4: Throwing in a Move Constructor — Strong Guarantee Lost
-----------------------------------------------------------------

**Description**: A move constructor that throws can leave both the source and the
destination in a partially-moved state — a violation of the basic guarantee.

**BAD**

.. code-block:: cpp

    class Document {
        std::string content_;
        std::filesystem::path path_;   // hypothetical — path might throw on move
    public:
        Document(Document&& other)   // NOT noexcept
            : content_(std::move(other.content_))  // safe
            , path_(std::move(other.path_))        // hypothetically might throw
        {
            // If path_ construction throws: content_ was already moved out of other,
            // but path_ was not transferred.  Both objects are in partial states.
        }
    };

**Why it fails**: After the first member move succeeds and the second throws, the
source has lost its ``content_`` but still has ``path_``.  The destination has
``content_`` but not ``path_``.  Neither object is in a coherent state.

**GOOD**

.. code-block:: cpp

    class Document {
        std::string           content_;
        std::filesystem::path path_;
    public:
        // Declare noexcept — if members throw, fix those members
        Document(Document&& other) noexcept
            : content_(std::move(other.content_))
            , path_(std::move(other.path_)) {}

        Document& operator=(Document&& other) noexcept {
            if (this != &other) {
                content_ = std::move(other.content_);
                path_    = std::move(other.path_);
            }
            return *this;
        }
    };

    static_assert(std::is_nothrow_move_constructible_v<Document>);

**Detection tip**: If the ``static_assert`` on ``noexcept`` move fails, find which
member is not ``noexcept`` movable and either fix it or provide a swap-based
implementation.

Pitfall 5: Slicing with Copy — Copying a Derived Object as Base
---------------------------------------------------------------

**Description**: Copying a derived-class object by value into a base-class variable
slices off the derived part.  The copy constructor of the base is called, not the
derived, and the derived-specific data is lost.

**BAD**

.. code-block:: cpp

    struct Animal {
        std::string name;
        virtual std::string sound() const { return "..."; }
    };

    struct Dog : Animal {
        std::string breed;
        std::string sound() const override { return "Woof"; }
    };

    Dog fido{"Fido", "Labrador"};
    Animal a = fido;   // SLICING: copies only the Animal part
                       // a.breed does not exist; a.sound() returns "..." not "Woof"

**Why it fails**: ``Animal a = fido`` calls ``Animal``'s copy constructor with a
reference to the ``Animal`` subobject of ``fido``.  The ``Dog``-specific data
(``breed``) and the virtual override are severed.

**GOOD**

.. code-block:: cpp

    // Option A: use polymorphism through pointers/references
    std::unique_ptr<Animal> animal = std::make_unique<Dog>("Fido", "Labrador");
    std::cout << animal->sound();   // "Woof" — virtual dispatch preserved

    // Option B: prevent slicing by making Animal non-copyable or abstract
    struct Animal {
        Animal() = default;
        Animal(const Animal&) = delete;             // prevent slice-copy
        Animal& operator=(const Animal&) = delete;
        virtual std::string sound() const = 0;
        virtual ~Animal() = default;
    };

**Detection tip**: Clang-tidy ``cppcoreguidelines-slicing`` warns when a derived
object is copied or assigned to a base object by value.
