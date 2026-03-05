Learn Modern C++ and OOP in 30 Days
===================================


A structured, example-rich, industry-grade roadmap to master **Object-Oriented Programming (OOP)** and **Modern C++ (C++17/20/23)** in 30 days.  
This repository is designed for students, professionals, and embedded engineers who want a clean, practical, and modern foundation in C++.

Design patterns and embedded-system patterns are intentionally excluded here—they are covered in separate dedicated repositories.

---

📘 What This Repository Covers
-----------------------------


**Object-Oriented Programming (OOP)**
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Classes & Objects  
* Encapsulation & Abstraction  
* Inheritance & Composition  
* Polymorphism (runtime + compile-time)  
* Virtual dispatch, override/final  
* Interfaces & Abstract Classes  
* SOLID Principles  
* Refactoring & Code Review  
* OOP Design & Architecture  

**Modern C++ (C++17/20/23/26 Preview)**
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

* Type deduction (``auto``, ``decltype``)  
* Smart pointers & RAII  
* Move semantics & perfect forwarding  
* Lambdas & functional style  
* ``constexpr`` & compile-time programming  
* Concepts & constraints  
* Ranges & views  
* Type erasure & PIMPL  
* Optional, Variant, Any  
* Modules (C++20)  
* Error handling (``std::expected`` C++23)  

---

📁 Repository Structure
----------------------


.. code-block:: text

    Learn-Modern-CPP-OOP-30-Days/
    ├── .github/workflows/ci.yml
    ├── cmake/
    │   ├── CMakePresets.json
    │   ├── Sanitizers.cmake
    │   └── FindCatch2.cmake
    ├── external/Catch2/
    ├── src/
    │   ├── Day-00-Setup-And-Basics/
    │   ├── Day-01-Variables-Types-Constexpr/
    │   ├── Day-02-Functions-Lambdas/
    │   ├── Day-03-Classes-Encapsulation/
    │   ├── Day-04-Constructors-Destructors-RAII/
    │   ├── Day-05-Smart-Pointers-Ownership/
    │   ├── Day-06-Inheritance-Polymorphism/
    │   ├── Day-07-Virtual-Override-Final-Abstract/
    │   ├── Day-08-Advanced-OOP-Patterns/
    │   ├── Day-09-Templates-Basics/
    │   ├── Day-10-Concepts-Constraints-C++20/
    │   ├── Day-11-Generic-OOP-Design/
    │   ├── Day-12-Ranges-Views-C++20/
    │   ├── Day-13-Move-Semantics-Rvalue-Refs/
    │   ├── Day-14-Rule-of-5-Copy-Move/
    │   ├── Day-15-Error-Handling-Expected-C++23/
    │   ├── Day-16-Modules-Basics-C++20/
    │   ├── Day-17-Design-Patterns-OOP/
    │   ├── Day-18-SOLID-Principles/
    │   ├── Day-19-Testing-Catch2-TDD/
    │   ├── Day-20-Static-Polymorphism-CRTP/
    │   ├── Day-21-PIMPL-Idiom-Type-Erasure/
    │   ├── Day-22-Performance-Tips-OOP/
    │   ├── Day-23-Modern-Features-Preview-C++26/
    │   ├── Day-24-Mini-Project-1-Bank-System/
    │   ├── Day-25-Mini-Project-2-Shape-Editor/
    │   ├── Day-26-Mini-Project-3-Game-Entities/
    │   ├── Day-27-Refactoring-Legacy-Code/
    │   ├── Day-28-Code-Review-Common-Pitfalls/
    │   ├── Day-29-Advanced-Topics-Deep-Dive/
    │   └── Day-30-Review-Cert-Prep-Next-Steps/
    ├── cheatsheets/
    ├── examples/
    ├── tests/
    ├── docs/
    ├── .clang-format
    ├── .clang-tidy
    ├── CMakeLists.txt
    ├── LICENSE
    └── README.rst


---

🗂️ Roadmap Index
----------------


* Full day-by-day index: `docs/day-index.rst <docs/day-index.rst>`_
* Weekly plan and pacing: `docs/30-day-roadmap.rst <docs/30-day-roadmap.rst>`_

🧾 Cheatsheets
-------------


* Full cheatsheet index: `cheatsheets/index.rst <cheatsheets/index.rst>`_
* Modern C++ quick reference: `cheatsheets/modern-cpp20-23-cheat.rst <cheatsheets/modern-cpp20-23-cheat.rst>`_
* OOP + SOLID quick reference: `cheatsheets/oop-principles-solid.rst <cheatsheets/oop-principles-solid.rst>`_

---

🎯 Learning Philosophy
---------------------


This repository is built on three principles:

**1. Learn by building**
~~~~~~~~~~~~~~~~~~~~~~~~

Every day includes:
* A theory file  
* A main example  
* Multiple real-world examples  
* Pitfalls & common mistakes  

**2. Learn modern C++ the right way**
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

No outdated C++98/03 patterns.  
Everything uses C++17/20/23 best practices.

**3. Learn OOP with clarity**
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

OOP is taught with:
* ASCII diagrams  
* Real-world analogies  
* Clean code  
* SOLID principles  
* Refactoring sessions  

---

🧪 Testing & CI
--------------


* GoogleTest for unit testing  
* GitHub Actions CI  
* GCC + Clang + MSVC matrix  
* Sanitizers (ASan, UBSan, TSan)  
* Clang‑Tidy static analysis  

---

🧭 How to Build
--------------


.. code-block:: bash

    mkdir build
    cd build
    cmake ..
    cmake --build .


---

📚 Who This Repo Is For
----------------------


* Students learning C++  
* Engineers preparing for interviews  
* Professionals transitioning to Modern C++  
* Embedded engineers strengthening fundamentals  
* Anyone wanting a structured 30‑day roadmap  

---

📜 License
---------


MIT License.
