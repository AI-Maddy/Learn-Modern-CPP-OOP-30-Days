---
title: "02 — Definition · Day 07"
---

<div class="brain-cluster-banner" data-cluster="oop-core">
  🟢 &nbsp; **OOP Core** &nbsp;·&nbsp; Temporal Lobe
</div>



# :material-book: 02 — Definition: Virtual Override Final Abstract

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)

!!! info "🔵 Blue = Theory — Precise, formal, complete"
    Read this section carefully. Every word matters.
    After reading, close the page and explain it back in your own words.

---


## :material-book: Why This Day Matters

Day 06 introduced virtual functions for polymorphism. Day 07 goes deeper: pure virtual functions to mandate derived class behaviour, abstract base classes as pure interface contracts, `final` to seal classes and optimise virtual calls, covariant return types, and the Non-Virtual Interface idiom that separates interface from implementation. This day also addresses the question of when virtual dispatch is too expensive and what the alternatives are.

## :material-book: Pure Virtual Functions and Abstract Classes

A **pure virtual function** has no implementation in the base class; any derived class must provide one. A class with at least one pure virtual function is **abstract** — you cannot instantiate it directly.

``` cpp
class Renderer {
public:
    // Pure virtual: derived classes MUST implement these
    virtual void clear(int colour) = 0;
    virtual void draw_rect(int x, int y, int w, int h) = 0;
    virtual void present() = 0;

    // Virtual destructor: mandatory for polymorphic base classes
    virtual ~Renderer() = default;

    // Non-pure virtual: has a default; derived classes MAY override
    virtual std::string name() const { return "Renderer"; }
};

// Renderer r;  // ERROR: cannot instantiate abstract class

class OpenGLRenderer : public Renderer {
public:
    void clear(int colour) override { /* GL calls */ }
    void draw_rect(int x, int y, int w, int h) override { /* GL calls */ }
    void present() override { /* swap buffers */ }
    std::string name() const override { return "OpenGL"; }
};

class NullRenderer : public Renderer {
public:
    void clear(int)                     override {}
    void draw_rect(int,int,int,int)     override {}
    void present()                      override {}
    std::string name() const override { return "Null"; }
};
```

**When to use abstract classes:**

- To define a protocol that all implementations must follow (interfaces)
- To enforce that a class is never used as a concrete type — only as a base
- As "role" types in design patterns (Strategy, Observer, Command)

### Providing a Default Implementation for Pure Virtual Functions

Pure virtual functions *can* have a body, but derived classes must still override them. This is useful for providing a fallback callable by explicit scope.

``` cpp
class Logger {
public:
    virtual void log(const std::string& msg) = 0;
    virtual ~Logger() = default;
};

// Provide a default body — callable explicitly, but still forces override
void Logger::log(const std::string& msg) {
    std::cerr << "[DEFAULT] " << msg << '\n';
}

class FileLogger : public Logger {
public:
    void log(const std::string& msg) override {
        Logger::log(msg);    // call base body explicitly if desired
        file_ << msg << '\n';
    }
private:
    std::ofstream file_;
};
```

## :material-book: Interface Design Principles

An interface in C++ is an abstract class with only pure virtual functions and a virtual destructor — no data members, no non-pure virtual functions.

``` cpp
// Clean interface: all pure virtual, no data
class ISerializable {
public:
    virtual std::string serialize() const = 0;
    virtual void deserialize(const std::string& data) = 0;
    virtual ~ISerializable() = default;
};

class IDrawable {
public:
    virtual void draw(Canvas& canvas) const = 0;
    virtual ~IDrawable() = default;
};

// A concrete class can implement multiple interfaces
class Sprite : public IDrawable, public ISerializable {
public:
    void draw(Canvas& c)       const override { /* ... */ }
    std::string serialize()    const override { /* ... */ }
    void deserialize(const std::string& d)  override { /* ... */ }
};
```

**Guideline:** Keep interfaces narrow. An interface with 20 pure virtual functions is hard to mock and hard to implement. Prefer several small interfaces (Interface Segregation Principle).


---

## :material-vector-polyline: Knowledge Map (SPATIAL MEMORY — Feature 7)

```mermaid
graph TD
    ROOT["Virtual Override Final Abstract"] --> A["class"]
    Virtual_Override_Final_Abstract --> class["class"]
    Virtual_Override_Final_Abstract --> RAII["RAII"]
    Virtual_Override_Final_Abstract --> virtual["virtual"]
    Virtual_Override_Final_Abstract --> override["override"]
    style ROOT fill:#8b5cf6,color:#fff
    style A    fill:#3b82f6,color:#fff
```


---

## :material-memory: Quick Definitions Table

| Term | Meaning |
|------|---------|
| `class` | _class — key concept for Virtual Override Final Abstract_ |
| `RAII` | _RAII — key concept for Virtual Override Final Abstract_ |
| `virtual` | _virtual — key concept for Virtual Override Final Abstract_ |
| `override` | _override — key concept for Virtual Override Final Abstract_ |
| `unique_ptr` | _unique_ptr — key concept for Virtual Override Final Abstract_ |


---

[← Intuition](01-intuition.md) · [Code Example →](03-example.md)
