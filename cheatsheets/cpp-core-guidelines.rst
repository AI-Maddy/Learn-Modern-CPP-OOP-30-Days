C++ Core Guidelines
===================

Overview
--------

High-value engineering rules for safe, maintainable, and modern C++ code.

Key Rules
---------

* Prefer expressing intent in types (const, references, spans, smart pointers).
* Minimize raw ownership; use RAII for every resource.
* Keep functions small, cohesive, and explicit about side effects.
* Use static analysis, warnings, and tests as continuous feedback.

Quick Snippet
-------------

.. code-block:: cpp

    struct FileHandle {
        explicit FileHandle(const char* path);
        ~FileHandle();
        FileHandle(const FileHandle&) = delete;
        FileHandle& operator=(const FileHandle&) = delete;
    };

Common Mistakes
---------------

* Using raw owning pointers without clear ownership.
* Global mutable state across modules.
* Large functions mixing business logic and IO.

Review Checklist
----------------

* Can you explain the tradeoff of the chosen approach?
* Is ownership/lifetime explicit at API boundaries?
* Is there at least one test or assertion for non-trivial behavior?

Related Paths
-------------

* Day modules: ``src/Day-*``
* Sequence guide: ``docs/day-index.rst``
* Weekly plan: ``docs/30-day-roadmap.rst``
