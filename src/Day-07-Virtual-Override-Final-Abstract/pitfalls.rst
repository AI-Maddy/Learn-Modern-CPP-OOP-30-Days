Pitfalls — Day 07: Virtual, Override, Final, Abstract
======================================================

Pitfall 1: Forgetting ``override`` and Silently Creating a New Function
-----------------------------------------------------------------------

**Description:** Intending to override a base class virtual function but having a slightly
different signature. Without ``override``, the compiler silently treats it as a new function.
The base's virtual is not overridden — polymorphic dispatch calls the base version.

**BAD code:**

.. code-block:: cpp

    #include <iostream>
    #include <memory>

    class Logger {
    public:
        virtual void log(const std::string& msg) const {
            std::cout << "[BASE] " << msg << '\n';
        }
        virtual ~Logger() = default;
    };

    class FileLogger : public Logger {
    public:
        // Accidental signature mismatch: missing const
        void log(const std::string& msg) {   // NOT an override — new function!
            std::cout << "[FILE] " << msg << '\n';
        }
    };

    int main() {
        std::unique_ptr<Logger> logger = std::make_unique<FileLogger>();
        logger->log("test");   // calls Logger::log — [BASE] test
                               // FileLogger::log is never called through the base pointer
    }

**Why it fails:** ``Logger::log`` is ``const``; ``FileLogger::log`` is non-``const``. They
have different signatures, so ``FileLogger::log`` is an entirely new (non-virtual) function
that hides the base's virtual. Through a ``Logger*``, only ``Logger::log`` is visible.

**GOOD code:**

.. code-block:: cpp

    class FileLogger : public Logger {
    public:
        void log(const std::string& msg) const override {  // override checks the signature
            std::cout << "[FILE] " << msg << '\n';
        }
    };

    // If you had written:
    // void log(const std::string& msg) override { ... }
    // The compiler would error: "does not override any virtual function"
    // — catching the mistake at compile time.

**Detection tip:** Enable ``-Wsuggest-override`` (GCC/Clang). The ``modernize-use-override``
clang-tidy check adds ``override`` to all overriding functions automatically. Make it a policy:
every function in a derived class that overrides a virtual must have ``override``.


Pitfall 2: Marking a Class ``final`` Prematurely
-------------------------------------------------

**Description:** Marking a class ``final`` as a premature optimisation or "just in case", before
understanding whether future extension is needed. This closes off legitimate extensibility and
forces callers to duplicate code when they need to customise behaviour.

**BAD code:**

.. code-block:: cpp

    // Library code shipped as final — no justification for sealing it
    class HttpClient final {
    public:
        virtual void send_request(const Request& r) { /* real HTTP */ }
        virtual ~HttpClient() = default;
    };

    // Test code: cannot create a mock/stub without modifying the library
    // class MockHttpClient : public HttpClient {};  // ERROR: HttpClient is final

    // This forces test code to use the real HTTP stack — untestable in isolation

**Why it fails:** ``final`` prevents test doubles (mocks, stubs, fakes) from being created by
inheriting. Libraries that are ``final`` by default are hostile to testing and to users who need
to adapt behaviour.

**GOOD code:**

.. code-block:: cpp

    // Abstract interface: fully mockable
    class IHttpClient {
    public:
        virtual void send_request(const Request& r) = 0;
        virtual ~IHttpClient() = default;
    };

    // Concrete implementation — final only if there is a specific reason
    class HttpClient : public IHttpClient {
    public:
        void send_request(const Request& r) override { /* real HTTP */ }
    };

    // Test code: mock without touching the library
    class MockHttpClient : public IHttpClient {
    public:
        void send_request(const Request& r) override { /* record call */ }
    };

**Correct use of ``final``:** Apply it when you have profiled a performance bottleneck and
devirtualisation will help, or when the semantics of the class genuinely must not be extended
(e.g., a cryptographic key type where any override would break security guarantees).


Pitfall 3: Abstract Base with Non-Virtual Destructor
-----------------------------------------------------

**Description:** Defining an abstract base class (with pure virtual functions) but forgetting
to declare the destructor virtual. Deleting a derived object through a base pointer is
undefined behaviour.

**BAD code:**

.. code-block:: cpp

    class IPlugin {
    public:
        virtual void run() = 0;
        // ~IPlugin() not declared — compiler generates a non-virtual destructor
    };

    class AudioPlugin : public IPlugin {
    public:
        AudioPlugin() : buffer_{new float[4096]} {}
        void run() override { /* process audio */ }
        ~AudioPlugin() { delete[] buffer_; }  // cleans up buffer
    private:
        float* buffer_;
    };

    IPlugin* p = new AudioPlugin{};
    p->run();
    delete p;   // UB: non-virtual ~IPlugin() runs, ~AudioPlugin() does not
                // buffer_ is leaked (4096 * 4 bytes)

**Why it fails:** ``delete p`` resolves the destructor through the static type ``IPlugin*``.
The compiler calls ``IPlugin::~IPlugin()`` (the non-virtual default). ``AudioPlugin::~AudioPlugin``
never runs. The ``buffer_`` allocation is leaked. This is undefined behaviour, and the memory
leak is essentially guaranteed.

**GOOD code:**

.. code-block:: cpp

    class IPlugin {
    public:
        virtual void run() = 0;

        // Explicitly virtual: ensures the right destructor runs
        virtual ~IPlugin() = default;
    };

    // Or if you want to forbid deletion through the interface:
    class IPluginNonOwning {
    public:
        virtual void run() = 0;
    protected:
        ~IPluginNonOwning() = default;   // non-virtual but protected: cannot delete through this ptr
    };

**Detection tip:** ``-Wnon-virtual-dtor`` (included in ``-Wall``) and ``clang-tidy`` check
``cppcoreguidelines-virtual-class-destructor`` both catch this. Every abstract base class must
have ``virtual ~ClassName() = default;``.


Pitfall 4: Bypassing the NVI Contract by Making the Hook Public
---------------------------------------------------------------

**Description:** Using the NVI idiom but accidentally making the virtual hook ``public`` instead
of ``protected``. Callers can then call the hook directly, bypassing the invariant-enforcing
wrapper.

**BAD code:**

.. code-block:: cpp

    class Transaction {
    public:
        void execute() {
            begin_transaction();
            do_execute();           // call virtual hook
            commit_transaction();
        }

        // Oops: hook is public — callers can bypass execute()
        virtual void do_execute() = 0;

        virtual ~Transaction() = default;

    private:
        void begin_transaction()  { /* acquire DB lock */ }
        void commit_transaction() { /* release lock */   }
    };

    Transaction* t = new DebitTransaction{};
    t->do_execute();   // bypasses begin/commit — no lock acquired, DB may be corrupted

**Why it fails:** ``do_execute()`` is the customisation point, not the contract. Making it
public allows callers to invoke it without the surrounding transaction machinery. The invariants
(lock acquisition, commit) are silently skipped.

**GOOD code:**

.. code-block:: cpp

    class Transaction {
    public:
        // Only this function is part of the public API
        void execute() {
            begin_transaction();
            do_execute();
            commit_transaction();
        }

        virtual ~Transaction() = default;

    protected:
        // Customisation point: visible to derived classes, not to callers
        virtual void do_execute() = 0;

    private:
        void begin_transaction()  { /* acquire DB lock */ }
        void commit_transaction() { /* release lock */   }
    };

    // External callers can only use transaction.execute() — invariants enforced

**Detection tip:** Review every ``virtual`` function in a base class. If it is ``public`` and
part of an NVI design, it should be ``protected`` (or ``private``). The only public virtual
function in a well-designed NVI class is the destructor.
