Day 15: Error Handling and std::expected (C++23)
=================================================

Learning Outcomes
-----------------

After completing this day you will be able to:

* Explain when to use exceptions, ``std::optional``, and ``std::expected<T,E>``
  and select the right tool for a given situation.
* Implement a function returning ``std::expected<T, E>`` with a custom error enum
  and handle all outcomes at the call site.
* Build a monadic error-handling pipeline using ``.and_then`` and ``.or_else``
  that eliminates nested ``if`` error checks.
* Apply ``noexcept`` correctly to destructors, move operations, and swap functions
  and explain the consequences of incorrect ``noexcept`` annotation.
* Distinguish logic errors (programming defects) from runtime errors (expected
  failures) and apply the appropriate reporting mechanism for each.

Key Concepts
------------

* **Exceptions** — non-local error propagation; zero-overhead happy path; forbidden
  in many embedded and real-time contexts; best for truly exceptional conditions.
* **Error codes** — explicit, cheap, always visible in the return type; easy to
  ignore; clutters intermediate call frames with forwarding boilerplate.
* **``std::optional<T>``** — a value-or-absent type; correct when absence has no
  error reason; ``value_or`` provides a convenient default.
* **``std::expected<T, E>``** (C++23) — a value-or-error type; the error type
  is part of the interface; cannot be accidentally discarded when ``[[nodiscard]]``.
* **``std::unexpected``** — the wrapper used to construct the error case of
  ``std::expected``.
* **``.and_then``** — monadic transform: calls the function only on success,
  short-circuits on error; requires same error type ``E`` in the chain.
* **``.or_else``** — monadic recovery: calls the function only on error, allows
  converting or swallowing errors.
* **``noexcept``** — a compile-time contract; enables move-based reallocation in
  containers; destructors are implicitly ``noexcept``.
* **Exception safety levels** — nothrow, strong, basic; know which guarantee each
  of your functions provides.

Hands-On Task
-------------

Build a **configuration file parser**:

#. Define ``enum class ConfigError { file_not_found, syntax_error, missing_key,
   type_mismatch }``.
#. Write ``load_file(path)`` returning ``std::expected<std::string, ConfigError>``.
#. Write ``parse_config(text)`` returning ``std::expected<ConfigMap, ConfigError>``
   where ``ConfigMap = std::unordered_map<std::string, std::string>``.
#. Write ``get_int(ConfigMap, key)`` returning ``std::expected<int, ConfigError>``.
#. Chain them with ``.and_then`` so the call site is a single expression.
#. Add ``[[nodiscard]]`` to all three functions and verify the compiler warns
   when the result is discarded.

What You Will Build
-------------------

A three-stage config-parsing pipeline where every failure is an ``std::expected``
error with a specific reason, the happy path is a single readable chain, and every
error is impossible to silently ignore — demonstrating ``std::expected`` as a
first-class error-handling strategy.

Suggested Study Order
---------------------

#. Read ``theory.rst`` sections 1–2 (exceptions overview, std::optional) — *15 min*
#. Read ``theory.rst`` sections 3–4 (std::expected, std::variant result type) — *20 min*
#. Read ``theory.rst`` section 5 (monadic operations, ASCII diagram) — *20 min*
#. Read ``theory.rst`` section 6 (noexcept correctness) — *10 min*
#. Read ``pitfalls.rst`` — *15 min*
#. Implement the hands-on task in ``main.cpp`` — *45 min*
#. Answer self-check questions in ``theory.rst`` — *10 min*

Build and Run
-------------

.. code-block:: bash

    cd build
    cmake .. -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_STANDARD=23
    cmake --build . --target day15
    ./day15

Related Days
------------

* **Day 14** — Rule of Five (exception safety levels, noexcept on moves)
* **Day 04** — Constructors and RAII (destructors must not throw — revisited here)
* **Day 17** — Design Patterns OOP (error handling in the context of larger patterns)
* **Day 29** — Advanced Topics (``std::error_code``, ``std::system_error``,
  C++26 contracts and static analysis for error handling)
