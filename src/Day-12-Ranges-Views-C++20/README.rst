Day 12: Ranges and Views (C++20)
=================================

Learning Outcomes
-----------------

After completing this day you will be able to:

* Build a multi-step ``std::ranges::views`` pipeline using ``|`` and explain why
  no intermediate containers are created.
* Use ``filter``, ``transform``, ``take``, ``drop``, ``reverse``, and ``iota``
  adaptors in isolation and in combination.
* Explain the difference between an owning range and a non-owning view, and identify
  when a view will dangle.
* Write a custom range adaptor with its own iterator type that integrates with the
  ``|`` pipe syntax.
* Describe how lazy evaluation works at the iterator level and why infinite ranges
  are safe with ``take``.

Key Concepts
------------

* **Range** — any type with ``begin()`` and ``end()``; may own its elements.
* **View** — a lightweight, lazily-evaluated, non-owning window over a range;
  cheap to compose but must not outlive its source.
* **Range adaptor** — an object that, when piped a range, returns a view; examples:
  ``filter``, ``transform``, ``take``, ``drop``, ``reverse``.
* **Lazy evaluation** — each adaptor records what to do; elements are produced
  only when the iterator is advanced, enabling infinite and zero-copy pipelines.
* **Pipe operator** ``|`` — chains adaptors: ``range | adaptor1 | adaptor2``
  creates a composed view without any copying.
* **Owning vs non-owning** — a container owns its elements; a view borrows them;
  a dangling view (source destroyed) is undefined behaviour.
* **``iota``** — a view that generates an arithmetic sequence, optionally infinite.
* **Custom adaptor** — a view class + closure object that plugs into the pipeline
  via ``operator|``.

Hands-On Task
-------------

Build a **log-analysis pipeline**:

#. Start with a ``std::vector<std::string>`` of simulated log lines.
#. Use ``filter`` to keep only lines containing the word ``"ERROR"``.
#. Use ``transform`` to extract the timestamp (first 10 characters of each line).
#. Use ``take(5)`` to keep the five most recent errors.
#. Write a ``words_view`` custom adaptor that splits a string by spaces and
   yields each word as a ``std::string_view``.
#. Apply ``words_view`` to each error line to count the most common error keyword.

What You Will Build
-------------------

A lazy log-analysis tool that processes a vector of log strings through a
multi-step pipeline using standard and custom adaptors, demonstrating zero
intermediate allocations and infinite-range safety.

Suggested Study Order
---------------------

#. Read ``theory.rst`` sections 1–2 (motivation, pipeline syntax) — *15 min*
#. Read ``theory.rst`` section 3 (lazy evaluation, ASCII diagram) — *15 min*
#. Read ``theory.rst`` section 4 (core adaptors reference) — *20 min*
#. Read ``theory.rst`` sections 5–6 (owning vs non-owning, custom adaptor) — *20 min*
#. Read ``pitfalls.rst`` — *15 min*
#. Implement the hands-on task in ``main.cpp`` — *45 min*
#. Answer self-check questions in ``theory.rst`` — *10 min*

Build and Run
-------------

.. code-block:: bash

    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_STANDARD=20
    cmake --build . --target day12
    ./day12

Related Days
------------

* **Day 10** — Concepts and Constraints (ranges use concepts extensively)
* **Day 09** — Templates Basics (range adaptors are class templates)
* **Day 11** — Generic OOP Design (generic algorithms — precursor to ranges)
* **Day 22** — Performance Tips (ranges vs hand-written loops benchmarking)
