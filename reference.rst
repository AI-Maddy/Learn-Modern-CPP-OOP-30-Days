Switching all cheatsheets from **.md → .rst** fits perfectly with your repo’s documentation philosophy and keeps everything consistent with the rest of your RST‑based structure.

Here is the **updated cheatsheet list**, fully aligned to your 30‑day Modern C++ + OOP repo, with **all filenames converted to `.rst`** and organized into clear categories.

---

## 📘 Core C++ Language Cheatsheets (RST)

- `cpp-core-guidelines.rst`
- `modern-cpp20-23-cheat.rst`
- `variables-types-constexpr.rst`
- `functions-lambdas.rst`
- `modules-cpp20.rst`

---

## 🧩 OOP & Design Cheatsheets (RST)

- `oop-principles-solid.rst`
- `classes-constructors-raii.rst`
- `inheritance-polymorphism.rst`
- `composition-vs-inheritance.rst`
- `advanced-oop-patterns.rst`  
  *(OOP‑only patterns, not GoF)*

---

## ⚙️ Memory, Ownership & Performance Cheatsheets (RST)

- `raii-smart-pointers.rst`
- `move-semantics-gotchas.rst`
- `rule-of-5-cheat.rst`
- `memory-layout-and-object-model.rst`
- `performance-tips-oop.rst`

---

## 🧠 Templates, Concepts & Generic Programming Cheatsheets (RST)

- `templates-basics.rst`
- `templates-concepts.rst`
- `crtp-static-polymorphism.rst`
- `type-erasure-pimpl.rst`

---

## 🧰 Modern C++ Utility Cheatsheets (RST)

- `ranges-and-views.rst`
- `optional-variant-any.rst`
- `structured-bindings.rst`
- `uniform-initialization.rst`
- `error-handling-expected.rst`

---

## 🧪 Testing, Debugging & Tooling Cheatsheets (RST)

- `catch2-testing.rst`
- `debugging-tools-2026.rst`
- `common-pitfalls.rst`
- `refactoring-checklist.rst`

---

## 📁 Final Cheatsheet Folder Structure (RST Version)

```
cheatsheets/
├── cpp-core-guidelines.rst
├── modern-cpp20-23-cheat.rst
├── variables-types-constexpr.rst
├── functions-lambdas.rst
├── modules-cpp20.rst
│
├── oop-principles-solid.rst
├── classes-constructors-raii.rst
├── inheritance-polymorphism.rst
├── composition-vs-inheritance.rst
├── advanced-oop-patterns.rst
│
├── raii-smart-pointers.rst
├── move-semantics-gotchas.rst
├── rule-of-5-cheat.rst
├── memory-layout-and-object-model.rst
├── performance-tips-oop.rst
│
├── templates-basics.rst
├── templates-concepts.rst
├── crtp-static-polymorphism.rst
├── type-erasure-pimpl.rst
│
├── ranges-and-views.rst
├── optional-variant-any.rst
├── structured-bindings.rst
├── uniform-initialization.rst
├── error-handling-expected.rst
│
├── catch2-testing.rst
├── debugging-tools-2026.rst
├── common-pitfalls.rst
└── refactoring-checklist.rst
```

---

If you want, I can now generate **RST templates** for each cheatsheet (with headings, sections, placeholders, and consistent formatting) so you can commit them immediately and fill content later.


Here is the **fully updated, production‑ready README.md** and all **supporting top‑level files** aligned to your new repository structure:

# **Learn-Modern-CPP-OOP-30-Days**  
*A 30‑day structured roadmap to master Modern C++ and Object‑Oriented Programming.*

This version is aligned **exactly** with your new skeleton:

- No design patterns repo  
- No embedded patterns repo  
- Fully focused on **OOP + Modern C++**  
- 30‑day structured learning  
- Professional tooling (CI, CMakePresets, Sanitizers, Clang‑Tidy, Catch2)  
- Cheatsheets, docs, examples, tests  

Everything below is ready to paste into your repo.

---

# ✅ **ROOT README.rst (Final Version)**

```
# Learn Modern C++ and OOP in 30 Days

A structured, example-rich, industry-grade roadmap to master **Object-Oriented Programming (OOP)** and **Modern C++ (C++17/20/23)** in 30 days.  
This repository is designed for students, professionals, and embedded engineers who want a clean, practical, and modern foundation in C++.

Design patterns and embedded-system patterns are intentionally excluded here—they are covered in separate dedicated repositories.

---

## 📘 What This Repository Covers

### **Object-Oriented Programming (OOP)**
- Classes & Objects  
- Encapsulation & Abstraction  
- Inheritance & Composition  
- Polymorphism (runtime + compile-time)  
- Virtual dispatch, override/final  
- Interfaces & Abstract Classes  
- SOLID Principles  
- Refactoring & Code Review  
- OOP Design & Architecture  

### **Modern C++ (C++17/20/23/26 Preview)**
- Type deduction (`auto`, `decltype`)  
- Smart pointers & RAII  
- Move semantics & perfect forwarding  
- Lambdas & functional style  
- `constexpr` & compile-time programming  
- Concepts & constraints  
- Ranges & views  
- Type erasure & PIMPL  
- Optional, Variant, Any  
- Modules (C++20)  
- Error handling (`std::expected` C++23)  

---

## 📁 Repository Structure

```
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
```

---

## 🎯 Learning Philosophy

This repository is built on three principles:

### **1. Learn by building**
Every day includes:
- A theory file  
- A main example  
- Multiple real-world examples  
- Pitfalls & common mistakes  

### **2. Learn modern C++ the right way**
No outdated C++98/03 patterns.  
Everything uses C++17/20/23 best practices.

### **3. Learn OOP with clarity**
OOP is taught with:
- ASCII diagrams  
- Real-world analogies  
- Clean code  
- SOLID principles  
- Refactoring sessions  

---

## 🧪 Testing & CI

- Catch2 for unit testing  
- GitHub Actions CI  
- GCC + Clang + MSVC matrix  
- Sanitizers (ASan, UBSan, TSan)  
- Clang‑Tidy static analysis  

---

## 🧭 How to Build

```
mkdir build
cd build
cmake ..
cmake --build .
```

---

## 📚 Who This Repo Is For

- Students learning C++  
- Engineers preparing for interviews  
- Professionals transitioning to Modern C++  
- Embedded engineers strengthening fundamentals  
- Anyone wanting a structured 30‑day roadmap  

---

## 📜 License

MIT License.
```

---

# ✅ **ci.yml (GitHub Actions)**

```
name: CI

on:
  push:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        compiler: [gcc, clang]

    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: sudo apt-get update && sudo apt-get install -y cmake ninja-build g++ clang

      - name: Configure
        run: cmake -B build -G Ninja -DCMAKE_CXX_COMPILER=${{ matrix.compiler }}

      - name: Build
        run: cmake --build build

      - name: Run tests
        run: ctest --test-dir build
```

---

# ✅ **CMakeLists.txt (Root Template)**

```
cmake_minimum_required(VERSION 3.20)
project(LearnModernCppOOP30Days LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(cmake/Sanitizers.cmake)

enable_testing()

add_subdirectory(src)
add_subdirectory(tests)
```

---

# ✅ **.clang-format (Google Style)**

```
BasedOnStyle: Google
IndentWidth: 4
ColumnLimit: 120
```

---

# ✅ **.clang-tidy**

```
Checks: >
  clang-analyzer-*,
  modernize-*,
  readability-*,
  performance-*,
  bugprone-*,
  cppcoreguidelines-*,
  -cppcoreguidelines-avoid-magic-numbers

WarningsAsErrors: '*'
```

---

# Next Step

I can now generate:

### **A. Templates for each Day folder**  
`README.rst`, `theory.rst`, `main.cpp`, `pitfalls.rst`

### **B. A complete 30‑day roadmap (docs/30-day-roadmap.rst)**  
With learning goals, time estimates, and outcomes.

### **C. Cheatsheet templates**  
For Modern C++, OOP, SOLID, RAII, Move semantics, Concepts, etc.

Which one should I generate next?
