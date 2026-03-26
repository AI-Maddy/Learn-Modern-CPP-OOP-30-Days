Pitfalls — Day 04: Constructors, Destructors, RAII
===================================================

Pitfall 1: Resource Leak on Early Return or Exception
------------------------------------------------------

**Description:** Acquiring a resource with a raw handle and relying on a cleanup call at the end
of the function. Any early return or exception bypasses the cleanup.

**BAD code:**

.. code-block:: cpp

    #include <cstdio>
    #include <vector>
    #include <stdexcept>

    void process_file(const char* path) {
        FILE* f = std::fopen(path, "r");
        if (!f) return;   // early return: nothing to clean up yet — OK here

        std::vector<char> buffer(1024);
        if (std::fread(buffer.data(), 1, buffer.size(), f) == 0) {
            return;           // early return: f is NOT closed — LEAK
        }

        if (/* some parse condition */ false) {
            throw std::runtime_error{"parse error"};  // exception: f is NOT closed — LEAK
        }

        std::fclose(f);   // only reached on the happy path
    }

**Why it fails:** ``fclose`` is only called at the bottom of the function. Every early return
and every exception bypasses it. The file descriptor leaks. On long-running servers this
exhausts the OS file descriptor table.

**GOOD code:**

.. code-block:: cpp

    #include <cstdio>
    #include <memory>
    #include <vector>

    // RAII wrapper using unique_ptr with a custom deleter
    struct FileCloser { void operator()(FILE* f) const { if (f) std::fclose(f); } };
    using ScopedFile = std::unique_ptr<FILE, FileCloser>;

    void process_file(const char* path) {
        ScopedFile f{std::fopen(path, "r")};
        if (!f) return;   // no resource yet

        std::vector<char> buffer(1024);
        if (std::fread(buffer.data(), 1, buffer.size(), f.get()) == 0) {
            return;   // ScopedFile destructor closes f — always
        }

        if (/* parse error */ false) {
            throw std::runtime_error{"parse error"};   // ScopedFile still closes f
        }
    }   // f.~ScopedFile() closes the file

**Detection tip:** Search for raw ``FILE*``, ``HANDLE``, socket file descriptors, or
``malloc``/``free`` pairs in function bodies. Wrap each in an RAII type.
AddressSanitizer's leak detector (``-fsanitize=address`` with ``ASAN_OPTIONS=detect_leaks=1``)
reports file-descriptor leaks on Linux.


Pitfall 2: Throwing from a Destructor
---------------------------------------

**Description:** Allowing an exception to propagate out of a destructor. If the destructor is
called during stack unwinding (handling another exception), this calls ``std::terminate``.

**BAD code:**

.. code-block:: cpp

    #include <stdexcept>
    #include <fstream>

    class LogFile {
    public:
        explicit LogFile(const std::string& path) : file_{path} {}

        ~LogFile() {
            file_.flush();              // flush might throw on some implementations
            if (!file_) {
                throw std::runtime_error{"flush failed"};  // DANGER: may terminate
            }
        }

    private:
        std::ofstream file_;
    };

    void risky() {
        LogFile log{"app.log"};
        throw std::runtime_error{"operation failed"};
        // Stack unwind: LogFile destructor runs while exception is active
        // If destructor also throws -> std::terminate -> crash
    }

**Why it fails:** During stack unwinding, ``std::uncaught_exceptions() > 0``. If the destructor
throws while another exception is active, C++ has no way to handle both. ``std::terminate`` is
called, producing an unrecoverable crash with no useful error message.

**GOOD code:**

.. code-block:: cpp

    #include <fstream>
    #include <iostream>

    class LogFile {
    public:
        explicit LogFile(const std::string& path) : file_{path} {}

        ~LogFile() noexcept {
            try {
                file_.flush();
            } catch (const std::exception& e) {
                // Log the error — do not propagate
                std::cerr << "LogFile flush error: " << e.what() << '\n';
            }
        }

    private:
        std::ofstream file_;
    };

**Detection tip:** Mark all destructors ``noexcept`` (the default in C++11+). Use
``clang-tidy`` check ``bugprone-exception-escape`` to find destructors that may throw.


Pitfall 3: Wrong Initialisation Order — Relying on Initialiser List Order
--------------------------------------------------------------------------

**Description:** Placing members in the initialiser list in a different order than they are
declared in the class. Members are always initialised in declaration order, not initialiser list
order, leading to use of uninitialised members.

**BAD code:**

.. code-block:: cpp

    class Buffer {
    public:
        Buffer(std::size_t capacity, std::size_t initial_fill)
            : data_(capacity)
            , size_{initial_fill}
            , capacity_{capacity}
            // DANGER: capacity_ is listed third but declared first.
            // In this class, if capacity_ was declared before data_, it would be
            // initialised before data_ regardless of list order.
        {}
        // Actual issue: if someone reorders declarations, this silently breaks.

    private:
        std::size_t capacity_;   // declared first
        std::vector<int> data_;  // declared second (depends on capacity_ being valid)
        std::size_t size_;
    };

    // More obvious example of the real danger:
    class Ratio {
    public:
        Ratio(int num, int den)
            : result_{num / den}   // uses result_ first in list...
            , num_{num}
            , den_{den}
            // result_ is declared AFTER num_ and den_ in the class body.
            // But result_ is INITIALISED first because... no — actually initialisation
            // follows declaration order. If result_ is declared first, it IS init'd first,
            // and at that point num and den are function parameters (safe here).
            // The danger is member-to-member dependencies where order matters.
        {}

    private:
        int result_;   // if this depends on num_ and den_ being members, not params: danger
        int num_;
        int den_;
    };

**Real danger — member depends on another member:**

.. code-block:: cpp

    class Window {
    public:
        Window(int w, int h)
            : area_{width_ * height_}   // BUG: width_ and height_ not yet initialised!
            , width_{w}
            , height_{h}
        {}
        // Even though width_ and height_ appear before area_ in the list,
        // they are declared after area_ in the class body.
        // Initialisation order: area_ first (reads garbage), then width_, then height_.

    private:
        int area_;     // declared first
        int width_;
        int height_;
    };

**GOOD code:**

.. code-block:: cpp

    class Window {
    public:
        Window(int w, int h)
            : width_{w}
            , height_{h}
            , area_{width_ * height_}   // safe: width_ and height_ declared before area_
        {}

    private:
        int width_;    // declared first
        int height_;   // declared second
        int area_;     // declared third — safely depends on the above
    };

**Detection tip:** Compiler warning ``-Wreorder`` (included in ``-Wall``) warns when the
initialiser list order does not match declaration order. Always fix these warnings.


Pitfall 4: Constructing in Two Phases (Init Anti-Pattern)
----------------------------------------------------------

**Description:** Providing a default constructor that creates an unusable object, then requiring
the caller to call a separate ``init()`` function before the object can be used. The object
has a "zombie" state between construction and initialisation.

**BAD code:**

.. code-block:: cpp

    class DatabaseConnection {
    public:
        DatabaseConnection() {}  // creates an unusable object

        bool init(const std::string& conn_string) {
            // actually connects here
            handle_ = connect_to_db(conn_string);
            return handle_ != nullptr;
        }

        void query(const std::string& sql) {
            if (!handle_) throw std::logic_error{"not initialised"};  // zombie check
            // ...
        }

    private:
        DbHandle* handle_{nullptr};
    };

    // User code can forget to call init():
    DatabaseConnection db;
    db.query("SELECT 1");   // throws: forgot init()

**Why it fails:** The class has two states: uninitialised (zombie) and initialised (valid). Every
member function must check which state it is in. The caller can forget to call ``init()``. The
invariant is violated from the moment of construction.

**GOOD code:**

.. code-block:: cpp

    class DatabaseConnection {
    public:
        // Constructor either succeeds (invariant holds) or throws (no zombie state)
        explicit DatabaseConnection(const std::string& conn_string)
            : handle_{connect_to_db(conn_string)} {
            if (!handle_) throw std::runtime_error{"connection failed: " + conn_string};
        }

        void query(const std::string& sql) {
            // No init check needed — invariant guarantees handle_ is valid
            execute(handle_, sql);
        }

    private:
        DbHandle* handle_;
    };

**Detection tip:** Any class with a no-argument constructor and a separate ``init()`` or
``open()`` function is a two-phase initialisation candidate. Refactor: move the resource
acquisition into a single constructor. If failure must be signalled without exceptions, use
a named factory function that returns ``std::optional<T>`` or ``std::expected<T, E>``.
