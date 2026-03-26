Day 22: Performance Tips for OOP
==================================

Learning Outcomes
------------------

By the end of this day you will be able to:

* Explain what a cache line is and why Struct-of-Arrays (SoA) can be 2–10×
  faster than Array-of-Structs (AoS) for bulk operations.
* Identify virtual call overhead and apply ``final``, CRTP, or template
  parameters to enable devirtualisation or eliminate virtual dispatch.
* Restructure a class with hot and cold fields into separate contiguous arrays
  to improve cache utilisation.
* Implement a basic small-buffer-optimised callable wrapper and explain the
  SBO threshold concept.
* Apply ``[[likely]]`` and ``[[unlikely]]`` attributes based on profile data
  and explain why intuition-based hints can hurt performance.
* Set up and run a ``google/benchmark`` micro-benchmark and interpret the
  nanoseconds-per-iteration output.

Key Concepts
-------------

* **Cache line (64 bytes)** — the unit of memory transfer between RAM and CPU
  cache; false sharing and wasted loads both stem from poor cache line usage.
* **SoA (Struct of Arrays)** — stores each field contiguously across all
  objects; enables auto-vectorisation and maximises cache utilisation for
  field-selective loops.
* **Devirtualisation** — compiler converts an indirect virtual call to a
  direct call or inline; enabled by ``final``, local type deduction, or
  whole-program optimisation (LTO).
* **Hot/cold splitting** — places frequently-accessed fields in a compact
  contiguous struct, leaving rarely-accessed fields in a separate cold struct.
* **SBO (Small Buffer Optimisation)** — stores objects below a size threshold
  inline to avoid heap allocation; used in ``std::string``, ``std::function``.
* **``[[likely]]``/``[[unlikely]]``** — C++20 branch probability hints; guide
  code layout decisions by the compiler; use only when confirmed by profiling.
* **Benchmark-first discipline** — every performance change must be justified
  by a before/after benchmark; no intuition-only optimisations.

Hands-On Task
--------------

Benchmark two particle system implementations:

#. Implement an AoS ``Particle`` struct with 8 fields and a
   ``std::vector<Particle>`` with 100,000 elements.
#. Implement a SoA ``ParticleSystem`` with separate vectors for each field.
#. Write a ``google/benchmark`` comparison of the position-update loop in both.
#. Add a virtual-dispatch version (``std::vector<unique_ptr<IParticle>>``) as
   a third baseline.
#. Record and report the benchmark results; calculate the speedup ratio.

What You Will Build
--------------------

A three-way particle system benchmark comparing AoS, SoA, and virtual-dispatch
implementations with measured throughput (million updates/second) and CPU cache
miss rates via ``perf stat``.

Suggested Study Order
----------------------

#. Read the Motivation section — commit to profiling-first — 10 min.
#. Study the cache line / SoA vs AoS section; draw the memory diagrams — 20 min.
#. Read the virtual call and devirtualisation section — 15 min.
#. Study hot/cold splitting; redesign the Enemy example yourself — 15 min.
#. Read the SBO and ``[[likely]]`` sections — 15 min.
#. Read the ``google/benchmark`` section; run the hello-world benchmark — 15 min.
#. Read ``pitfalls.rst`` — pitfall 1 (no profiling) and pitfall 3 (pointer
   scatter) are the most impactful — 20 min.
#. Complete the hands-on benchmark task — 45 min.

Build and Run
--------------

.. code-block:: bash

  cd Day-22-Performance-Tips-OOP
  cmake -S . -B build -DCMAKE_CXX_STANDARD=20 -DCMAKE_BUILD_TYPE=Release
  cmake --build build
  ./build/perf_benchmarks --benchmark_filter=BM_Particle

Cache miss analysis (Linux with perf):

.. code-block:: bash

  perf stat -e cache-misses,cache-references,instructions \
      ./build/perf_benchmarks --benchmark_min_time=2

Related Days
-------------

* **Day 20** — CRTP: the primary mechanism for eliminating virtual dispatch
  in hot paths; complements the devirtualisation techniques covered here.
* **Day 21** — Type Erasure: ``std::function`` SBO and ``std::variant`` are
  both relevant to the performance discussion of type-erasing abstractions.
* **Day 9** — Templates Basics: template parameters as zero-cost callbacks
  (replacing ``std::function`` in hot paths) are introduced in that day.
* **Day 26** — Mini Project 3 (Game Entities): the SoA and hot/cold splitting
  patterns are applied at project scale with benchmarks verifying the gains.
