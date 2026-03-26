Pitfalls – Day 30: Review, Cert Prep, and Next Steps
=====================================================

Pitfall 1: Passive Re-Reading Without Active Recall
----------------------------------------------------

**Description**
  Reading through notes or theory files feels productive but produces
  almost no retention compared to active recall: closing the material
  and attempting to reproduce concepts from memory.

**BAD approach**

.. code-block:: text

    Student reads theory.rst for Day 9 (virtual functions).
    Student feels confident.
    Three days later: cannot write a vtable explanation from scratch.
    Cannot implement a polymorphic container without copying an example.

**Why it fails**
  Passive recognition ("I remember seeing this") is not the same as
  retrieval ("I can produce this"). The latter is what interviews,
  code reviews, and production code demand.

**GOOD approach**

.. code-block:: text

    After reading, close the file.
    1. Write down the key concept definitions on paper.
    2. Implement the day's example from scratch (no copy-paste).
    3. Answer each self-check question out loud or in writing.
    4. Only re-open the file to check specific details, not to re-read.

**Detection tip**
  If you cannot write a minimal working example of the day's concept
  without looking at the notes, mark that day for active review.
  Use a two-column table: "I can explain" vs "I need to re-implement".

Pitfall 2: Stopping After Completing the 30 Days
-------------------------------------------------

**Description**
  Treating the 30-day course as a destination rather than a foundation.
  Skills not used regularly atrophy quickly, especially the subtler C++
  rules around UB, move semantics, and exception safety.

**BAD approach**

.. code-block:: text

    Day 30 completed.
    No new C++ code written for two months.
    On a job interview: cannot recall when std::move should be used,
    forgets the rule about noexcept move constructors for containers.

**Why it fails**
  C++ has enough depth that irregular practice produces rapid knowledge
  decay for the parts not exercised day-to-day.

**GOOD approach**

.. code-block:: text

    Schedule one of:
    - 30 minutes of C++ reading per week (cppreference, CppCon talks).
    - One small project per month that uses a concept from the course.
    - Contributing to an open-source C++ project (LLVM, Abseil, etc.).
    - Solving one C++ kata on Exercism.io or LeetCode per week.

**Detection tip**
  Review your score on the Day 30 quiz every 6 weeks. A dropping score
  on specific questions tells you exactly which days need re-practice.

Pitfall 3: Skipping Weak Topics and Only Studying Strengths
-----------------------------------------------------------

**Description**
  Spending review time on concepts you already know well (because it feels
  productive) while avoiding the topics that feel uncomfortable.

**BAD approach**

.. code-block:: text

    Strong on templates and ranges? Spend all review time on those.
    Weak on move semantics and exception safety? Avoid them.
    Result: interview fails on a basic move-constructor question.

**Why it fails**
  Interviewers and code reviewers probe weaknesses specifically. A 20%
  gap in fundamentals costs more than a 20% gap in advanced features.

**GOOD approach**

.. code-block:: text

    After the quiz, list the questions answered incorrectly.
    Group them by day. Rank days by number of wrong answers.
    Spend 70% of review time on the bottom half of the ranking.
    Re-take the quiz two weeks later to confirm improvement.

**Detection tip**
  Honest self-assessment is the tool. Do not guess which topics are weak —
  measure by attempting to implement them without notes, then evaluate
  the result against the reference implementation.

Pitfall 4: Learning Only the Theory, Never the Toolchain
---------------------------------------------------------

**Description**
  Understanding C++ language features but being unable to set up a
  project, configure CMake, run sanitizers, or use a debugger efficiently.
  Toolchain knowledge is tested in every take-home assessment.

**BAD approach**

.. code-block:: text

    Can explain RAII, smart pointers, and polymorphism.
    Cannot set up CMakeLists.txt from scratch.
    Cannot run AddressSanitizer.
    Cannot interpret a clang-tidy warning.

**Why it fails**
  Professional C++ work requires the full toolchain. Code that is correct
  but undebuggable and unbuildable is not usable.

**GOOD approach**

.. code-block:: cpp

    // Hands-on toolchain exercise:
    // 1. Create a new CMakeLists.txt for a two-file project from scratch.
    // 2. Add: -Wall -Wextra -Wconversion -fsanitize=address,undefined
    // 3. Introduce a deliberate bug (unsigned underflow).
    // 4. Build and run — observe the sanitizer output.
    // 5. Fix the bug and confirm the sanitizer is silent.

**Detection tip**
  Include one toolchain task in every review session: set up a new
  project, add a test, configure a sanitizer build, run clang-tidy.

Pitfall 5: Focusing Only on Language Features, Ignoring Design
--------------------------------------------------------------

**Description**
  Mastering C++ syntax and semantics without practising design decisions:
  when to use inheritance vs composition, when an exception is right vs
  an error code, when to use a factory. Language knowledge without design
  judgment produces clever but unmaintainable code.

**BAD approach**

.. code-block:: cpp

    // Technically correct but poor design:
    // Uses CRTP, variant, coroutines, pmr allocators, consteval, bit_cast
    // all in one class — because they were learned this week.
    class MegaEntity : public EntityBase<MegaEntity>,
                       public std::enable_shared_from_this<MegaEntity> {
        std::variant<StateA, StateB, StateC> state_;
        std::pmr::vector<Component> components_;
        // ... 500 lines of over-engineered class
    };

**Why it fails**
  Every new feature used in the wrong context adds incidental complexity.
  Reviewers and teammates lose trust in code that applies advanced features
  where simpler ones would suffice.

**GOOD approach**

.. code-block:: text

    For each design decision, ask:
    1. What is the simplest solution that correctly solves the problem?
    2. What would I need to change for this solution to break?
    3. Only use a more complex pattern if the simple one demonstrably fails.

    Review Scott Meyers' "Effective Modern C++" Item 5: "Prefer auto to
    explicit type declarations" — the underlying principle is always:
    prefer the mechanism that makes the intent clearest.

**Detection tip**
  Ask a peer to read your code and explain it back to you. If they
  struggle to understand a design choice, it is either not documented
  well enough or genuinely unnecessarily complex.

Pitfall 6: Treating the Quiz Score as the Final Verdict
--------------------------------------------------------

**Description**
  Scoring well on the Day 30 quiz but never writing production-quality code.
  Quiz knowledge and engineering judgment are different things — the quiz
  tests recognition; engineering tests application under pressure.

**BAD conclusion**

.. code-block:: text

    Scored 20/20 on the quiz.
    Conclusion: "I know C++."
    Reality: first real-world PR has raw owning pointers, a missing virtual
    destructor, and a signed/unsigned comparison in a loop.

**Why it fails**
  Quiz questions test isolated concepts. Real code requires applying
  multiple concepts simultaneously under ambiguous requirements, with
  time pressure and incomplete information.

**GOOD conclusion**

.. code-block:: text

    Scored 20/20 on the quiz.
    Next step: implement a non-trivial project that uses concepts from
    at least 10 different days simultaneously. Review the code yourself
    against the Day 28 checklist. Then have someone else review it.
    Iterate until no checklist item produces a finding.

**Detection tip**
  The best indicator of genuine skill is not quiz scores but the quality
  of code you write without references when the problem is novel. Seek
  that kind of practice regularly.
