---
title: "04 — Pitfalls · Day 26"
---

<div class="brain-cluster-banner" data-cluster="projects">
  🟡 &nbsp; **Projects** &nbsp;·&nbsp; Cerebellum
</div>



# :material-alert: 04 — Pitfalls: Mini Project 3 Game Entities

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)

!!! danger "🔴 Red = Crash/Leak/UB — Open every block below!"
    These are **real-world bugs** from production code.
    Open each collapsible, read the explanation, and make sure you understand
    **why** it is dangerous and **how** to fix it.

---

# Pitfalls – Day 26: Mini Project 3: Game Entities

??? pitfall-lobe "⚠️ Pitfall 1: Modifying the Entity Collection During Iteration"
    **Description**  
    Destroying an entity inside the update loop while iterating the entity registry invalidates iterators and causes undefined behaviour.

    **BAD code**

    ``` cpp
    for (auto& [id, comps] : registry.all()) {
        auto* hp = registry.get_component<HealthComponent>(id);
        if (hp && !hp->is_alive()) {
            registry.destroy(id);  // INVALIDATES the iterator mid-loop — UB
        }
    }
    ```

    **Why it fails**  
    `registry.destroy()` erases the entry from the underlying `unordered_map`. Erasing during range-for invalidates the current iterator, so the next iteration step accesses freed memory.

    **GOOD code**

    ``` cpp
    // Collect dead entities first — then destroy after the loop
    std::vector<EntityId> to_destroy;

    for (auto& [id, _] : registry.all()) {
        auto* hp = registry.get_component<HealthComponent>(id);
        if (hp && !hp->is_alive())
            to_destroy.push_back(id);
    }

    for (EntityId dead : to_destroy)
        registry.destroy(dead);
    ```

    **Detection tip**  
    Run tests with AddressSanitizer (`-fsanitize=address`). Iterator invalidation sometimes manifests as heap-use-after-free, which ASan catches immediately.

??? pitfall-lobe "⚠️ Pitfall 2: Frame-Rate-Dependent Update Logic"
    **Description**  
    Updating positions without multiplying by `dt` (delta time) makes the game run faster on high-frame-rate machines and slower on low-end ones.

    **BAD code**

    ``` cpp
    void update(EntityRegistry& reg) {
        for (auto& [id, _] : reg.all()) {
            auto* pos = reg.get_component<PositionComponent>(id);
            auto* vel = reg.get_component<VelocityComponent>(id);
            if (pos && vel) {
                pos->x += vel->dx;  // No dt — speed proportional to FPS
                pos->y += vel->dy;
            }
        }
    }
    ```

    **Why it fails**  
    At 60 FPS, `update()` is called 60 times/second and the entity moves 60 \* dx per second. At 120 FPS it moves 120 \* dx — twice as fast on the same machine with vsync off.

    **GOOD code**

    ``` cpp
    void update(double dt, EntityRegistry& reg) {
        for (auto& [id, _] : reg.all()) {
            auto* pos = reg.get_component<PositionComponent>(id);
            auto* vel = reg.get_component<VelocityComponent>(id);
            if (pos && vel) {
                pos->x += vel->dx * static_cast<float>(dt);
                pos->y += vel->dy * static_cast<float>(dt);
            }
        }
    }
    ```

    **Detection tip**  
    Unit-test the physics system at `dt=1.0/60` and `dt=1.0/30` and assert that two ticks at the lower rate equal one tick at the higher rate (deterministic fixed-step property).

??? danger "⚠️ Pitfall 3: Memory Leak from Unowned Entity Pointers"
    **Description**  
    Handing out raw pointers to components and caching them across frames is dangerous when the registry's internal storage is reallocated or the entity is destroyed.

    **BAD code**

    ``` cpp
    HealthComponent* cached_hp = registry.get_component<HealthComponent>(player_id);

    // ... many frames later ...
    player_id entity may have been destroyed and recreated
    // cached_hp now points to freed or reused memory
    cached_hp->current -= 10;  // use-after-free / wrong entity
    ```

    **Why it fails**  
    The component storage (`std::any` inside `unordered_map`) can be relocated or destroyed. The cached raw pointer becomes a dangling pointer.

    **GOOD code**

    ``` cpp
    // Look up the component fresh each frame — cheap map lookup
    void apply_damage(EntityRegistry& reg, EntityId id, int damage) {
        auto* hp = reg.get_component<HealthComponent>(id);
        if (!hp) return;   // guard: entity may have been destroyed
        hp->current -= damage;
    }
    ```

    **Detection tip**  
    Never store raw component pointers across frame boundaries. Use the entity ID as the stable handle and re-query each time. Valgrind or AddressSanitizer will surface dangling pointer reads as invalid memory access.

??? pitfall-lobe "⚠️ Pitfall 4: CRTP Base with Virtual Destructor"
    **Description**  
    Adding a virtual destructor to a CRTP base negates its zero-overhead purpose and introduces a vtable. Deleting through a base pointer is also wrong because CRTP bases are intended for static dispatch only.

    **BAD code**

    ``` cpp
    template<typename Derived>
    class EntityBase {
    public:
        virtual ~EntityBase() = default;  // Adds vtable — defeats CRTP purpose
        void update(double dt) {
            static_cast<Derived*>(this)->do_update(dt);
        }
    };

    EntityBase<Player>* p = new Player{};
    delete p;  // Undefined behaviour regardless — wrong ownership model for CRTP
    ```

    **Why it fails**  
    CRTP bases are never meant to be held by base pointers. A virtual destructor signals "delete through base pointer is safe" — a contract CRTP cannot honour (you would need a common non-template base for that).

    **GOOD code**

    ``` cpp
    template<typename Derived>
    class EntityBase {
    protected:
        ~EntityBase() = default;  // protected non-virtual: cannot delete through base

    public:
        void update(double dt) {
            static_cast<Derived*>(this)->do_update(dt);
        }
    };

    // For runtime polymorphism, use a separate non-CRTP base:
    class IEntity {
    public:
        virtual ~IEntity() = default;
        virtual void update(double dt) = 0;
    };
    ```

    **Detection tip**  
    Enforce the rule: if a base class is a CRTP base, its destructor must be `protected`. Add this to your code-review checklist.

??? danger "⚠️ Pitfall 5: Event Bus Listener Capturing Dangling References"
    **Description**  
    A lambda subscribed to the event bus that captures `this` by reference remains registered after the subscribing object is destroyed, causing a dangling reference when the event fires.

    **BAD code**

    ``` cpp
    class AudioSystem {
    public:
        AudioSystem(EventBus& bus) {
            // Captures 'this' by reference — dangerous if AudioSystem is destroyed
            // before the bus
            bus.subscribe<EntityDiedEvent>([this](const EntityDiedEvent& e) {
                play_sound("death", e.id);  // 'this' may be dangling
            });
        }
        void play_sound(const std::string& name, EntityId id) { /* ... */ }
        // No unsubscribe on destruction!
    };
    ```

    **Why it fails**  
    If `AudioSystem` is destroyed before the event bus, the lambda still holds a pointer to the destroyed object. Firing `EntityDiedEvent` later calls `play_sound` through a dangling `this`.

    **GOOD code**

    ``` cpp
    // Use a shared_ptr + weak_ptr to protect against dangling
    class AudioSystem : public std::enable_shared_from_this<AudioSystem> {
    public:
        void subscribe(EventBus& bus) {
            auto weak = weak_from_this();
            bus.subscribe<EntityDiedEvent>([weak](const EntityDiedEvent& e) {
                if (auto self = weak.lock())  // check alive before calling
                    self->play_sound("death", e.id);
            });
        }
    };
    ```

    **Detection tip**  
    Always audit event-bus subscriptions that capture `this`. Use `std::weak_ptr` or an explicit lifetime token (a boolean `alive_` flag) to guard against dangling. Valgrind/ASan catches the crash.


---

## :material-clipboard-check: Pre-Commit Checklist

Use this before pushing code from Day 26:

- [ ] No raw `new`/`delete` — using smart pointers?
- [ ] All overriding methods marked `override`?
- [ ] Base class destructor marked `virtual`?
- [ ] No dangling references returned?
- [ ] `std::move` only used on objects no longer needed?
- [ ] Move constructor/assignment marked `noexcept`?
- [ ] No implicit type conversions hiding bugs?

---

[← Code Example](03-example.md) · [Flashcards →](05-flashcards.md)
