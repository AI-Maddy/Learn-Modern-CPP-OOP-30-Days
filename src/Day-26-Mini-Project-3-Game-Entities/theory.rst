Day 26 – Mini Project 3: Game Entities
=======================================

Motivation
----------

Game development stress-tests every OOP skill: performance matters,
objects are created and destroyed rapidly, behaviour combinations are
unpredictable, and systems must communicate without tight coupling.

This day introduces four foundational game-engine patterns:

* **Entity-Component System (ECS)** — favour composition over deep inheritance.
* **Game loop** — a deterministic fixed-timestep update cycle.
* **Observer / Event system** — decoupled communication between systems.
* **CRTP** — zero-overhead static polymorphism for entity types.

You will also glimpse spatial partitioning (a performance concept used in
collision detection) to motivate the next layer of game-engine study.

The Problem with Deep Inheritance in Games
------------------------------------------

A naive OOP approach leads to an explosion of types:

.. code-block:: text

    Entity
    ├── Actor
    │   ├── Player
    │   │   ├── ArmedPlayer
    │   │   └── FlyingPlayer
    │   └── Enemy
    │       ├── FlyingEnemy
    │       └── ArmedFlyingEnemy   ← combinatorial explosion!
    └── Projectile

Adding "swimming" ability to some but not all entities requires inserting a
new layer in the hierarchy. With ECS, "swimming" is just a ``SwimComponent``
that you attach to any entity at runtime.

The Entity-Component System (ECS)
----------------------------------

An *Entity* is just an ID. All data lives in *Components*. *Systems* iterate
over entities that have a specific set of components.

.. code-block:: cpp

    #include <any>
    #include <cstdint>
    #include <functional>
    #include <memory>
    #include <string>
    #include <typeindex>
    #include <unordered_map>
    #include <vector>

    using EntityId = std::uint32_t;

    // ---- Components (plain data, no behaviour) ----

    struct PositionComponent {
        float x{0.f}, y{0.f};
    };

    struct VelocityComponent {
        float dx{0.f}, dy{0.f};
    };

    struct HealthComponent {
        int current{100}, max{100};
        bool is_alive() const { return current > 0; }
    };

    struct RenderComponent {
        std::string sprite_name;
        float       scale{1.f};
    };

    // ---- Entity Registry ----

    class EntityRegistry {
    public:
        EntityId create() {
            EntityId id = next_id_++;
            components_[id];  // insert empty map for this entity
            return id;
        }

        template<typename T>
        void add_component(EntityId id, T component) {
            components_[id][std::type_index(typeid(T))] =
                std::make_any<T>(std::move(component));
        }

        template<typename T>
        T* get_component(EntityId id) {
            auto entity_it = components_.find(id);
            if (entity_it == components_.end()) return nullptr;
            auto comp_it = entity_it->second.find(std::type_index(typeid(T)));
            if (comp_it == entity_it->second.end()) return nullptr;
            return std::any_cast<T>(&comp_it->second);
        }

        template<typename T>
        bool has_component(EntityId id) const {
            auto entity_it = components_.find(id);
            if (entity_it == components_.end()) return false;
            return entity_it->second.count(std::type_index(typeid(T))) > 0;
        }

        void destroy(EntityId id) { components_.erase(id); }

        // Iterate all entities
        const auto& all() const { return components_; }

    private:
        EntityId next_id_{1};
        std::unordered_map<
            EntityId,
            std::unordered_map<std::type_index, std::any>
        > components_;
    };

The Game Loop Pattern
---------------------

A *fixed timestep* loop ensures physics and game logic advance by the same
``dt`` regardless of frame rate. Variable-rate rendering interpolates between
logic ticks for smooth visuals.

.. code-block:: cpp

    #include <chrono>
    #include <iostream>

    class GameLoop {
    public:
        explicit GameLoop(double fixed_dt_seconds = 1.0 / 60.0)
            : fixed_dt_{fixed_dt_seconds}
        {}

        // Run for a fixed number of ticks (useful in tests / headless mode)
        void run_for(int ticks, EntityRegistry& reg) {
            for (int i = 0; i < ticks; ++i) {
                update(fixed_dt_, reg);
            }
        }

    private:
        double fixed_dt_;

        void update(double dt, EntityRegistry& reg) {
            // Physics system: move every entity with Position + Velocity
            for (auto& [id, _] : reg.all()) {
                auto* pos = reg.get_component<PositionComponent>(id);
                auto* vel = reg.get_component<VelocityComponent>(id);
                if (pos && vel) {
                    pos->x += vel->dx * static_cast<float>(dt);
                    pos->y += vel->dy * static_cast<float>(dt);
                }
            }

            // Health system: destroy dead entities
            std::vector<EntityId> to_destroy;
            for (auto& [id, _] : reg.all()) {
                auto* hp = reg.get_component<HealthComponent>(id);
                if (hp && !hp->is_alive())
                    to_destroy.push_back(id);
            }
            for (EntityId id : to_destroy) reg.destroy(id);
        }
    };

The Observer / Event System
----------------------------

Systems communicate through events to remain decoupled. The ``EventBus``
holds a type-erased list of listeners for each event type.

.. code-block:: cpp

    #include <functional>
    #include <typeindex>
    #include <unordered_map>
    #include <vector>
    #include <any>

    struct EntityDiedEvent { EntityId id; std::string name; };
    struct DamageEvent     { EntityId target; int damage;   };

    class EventBus {
    public:
        template<typename Event>
        using Handler = std::function<void(const Event&)>;

        template<typename Event>
        void subscribe(Handler<Event> handler) {
            auto& vec = listeners_[std::type_index(typeid(Event))];
            vec.push_back([h = std::move(handler)](const std::any& e) {
                h(std::any_cast<const Event&>(e));
            });
        }

        template<typename Event>
        void publish(const Event& event) {
            auto it = listeners_.find(std::type_index(typeid(Event)));
            if (it == listeners_.end()) return;
            for (auto& listener : it->second)
                listener(std::make_any<Event>(event));
        }

    private:
        using AnyHandler = std::function<void(const std::any&)>;
        std::unordered_map<std::type_index, std::vector<AnyHandler>> listeners_;
    };

    // Usage
    EventBus bus;

    bus.subscribe<DamageEvent>([](const DamageEvent& e) {
        std::cout << "Entity " << e.target << " took " << e.damage << " damage\n";
    });

    bus.publish(DamageEvent{42, 25});

CRTP: Zero-Overhead Static Polymorphism
-----------------------------------------

CRTP (Curiously Recurring Template Pattern) gives compile-time polymorphism
with no vtable overhead. Useful for performance-critical entity bases.

.. code-block:: cpp

    // Base class parameterised on the derived type
    template<typename Derived>
    class EntityBase {
    public:
        void update(double dt) {
            // Statically dispatched — no vtable lookup
            static_cast<Derived*>(this)->do_update(dt);
        }

        std::string name() const {
            return static_cast<const Derived*>(this)->do_name();
        }

    protected:
        ~EntityBase() = default;  // protected non-virtual: never delete through base
    };

    class Player : public EntityBase<Player> {
    public:
        void do_update(double dt) {
            x_ += speed_ * static_cast<float>(dt);
        }
        std::string do_name() const { return "Player"; }

    private:
        float x_{0.f}, speed_{100.f};
    };

    class Enemy : public EntityBase<Enemy> {
    public:
        void do_update(double dt) { /* patrol logic */ }
        std::string do_name() const { return "Enemy"; }
    };

    // Template function — works for any EntityBase<T>
    template<typename E>
    void tick(EntityBase<E>& entity, double dt) {
        entity.update(dt);
        std::cout << entity.name() << " updated\n";
    }

**When to use CRTP**: hot paths where virtual dispatch overhead is
measurable, mixin behaviours (add logging, counting), and static interfaces
that must be enforced at compile time.

**When to avoid CRTP**: when you need runtime polymorphism (store mixed
types in one container), or when the template complexity makes the code
harder to understand than the problem it solves.

Spatial Partitioning: Introduction
------------------------------------

A naive collision system checks every pair of entities: O(n²). With 1000
entities that is 500,000 checks per frame. Spatial partitioning divides
space into cells so only nearby entities are tested.

.. code-block:: text

    ┌───┬───┬───┬───┐
    │   │ E │   │   │   E = Enemy (in cell 1,0)
    ├───┼───┼───┼───┤   P = Player (in cell 2,1)
    │   │   │ P │   │
    ├───┼───┼───┼───┤   Only check P against entities in
    │   │   │   │   │   cells (1,0),(2,0),(3,0),
    └───┴───┴───┴───┘        (1,1),(2,1),(3,1),
                              (1,2),(2,2),(3,2)
                             = 9 cells instead of all n

A basic grid spatial hash:

.. code-block:: cpp

    #include <cmath>
    #include <unordered_map>
    #include <vector>

    class SpatialGrid {
    public:
        explicit SpatialGrid(float cell_size) : cell_size_{cell_size} {}

        void insert(EntityId id, float x, float y) {
            int cx = static_cast<int>(std::floor(x / cell_size_));
            int cy = static_cast<int>(std::floor(y / cell_size_));
            grid_[{cx, cy}].push_back(id);
        }

        std::vector<EntityId> query_nearby(float x, float y) const {
            std::vector<EntityId> result;
            int cx = static_cast<int>(std::floor(x / cell_size_));
            int cy = static_cast<int>(std::floor(y / cell_size_));
            for (int dx = -1; dx <= 1; ++dx)
                for (int dy = -1; dy <= 1; ++dy) {
                    auto it = grid_.find({cx + dx, cy + dy});
                    if (it != grid_.end())
                        for (EntityId id : it->second)
                            result.push_back(id);
                }
            return result;
        }

        void clear() { grid_.clear(); }

    private:
        float cell_size_;
        struct PairHash {
            size_t operator()(std::pair<int,int> p) const {
                return std::hash<int>{}(p.first) * 73856093 ^
                       std::hash<int>{}(p.second) * 19349663;
            }
        };
        std::unordered_map<std::pair<int,int>, std::vector<EntityId>, PairHash>
            grid_;
    };

Design Tradeoffs
----------------

* **ECS vs deep inheritance**: ECS excels when entities need arbitrary
  combinations of behaviour (a sword that is also a pickup that can be
  possessed). Pure inheritance cannot express this without an explosion of
  classes. The cost: more complex query code and loss of compile-time
  knowledge about component presence.

* **Observer vs direct calls**: The event bus decouples systems (the physics
  system does not import the audio system's header). The tradeoff is runtime
  overhead and reduced traceability — stepping through an event dispatch in
  a debugger is harder than a direct call.

* **CRTP vs virtual**: CRTP avoids vtable indirection but loses runtime
  polymorphism. You cannot store ``EntityBase<Player>`` and
  ``EntityBase<Enemy>`` in the same ``std::vector`` without type erasure.

Self-Check Questions
--------------------

#. **What problem does the ECS pattern solve compared to deep inheritance?**

   The combinatorial explosion of types when entities can have arbitrary
   combinations of behaviours. ECS separates data (components) from identity
   (entities) and behaviour (systems), allowing any combination at runtime.

#. **Why is a fixed timestep important in the game loop?**

   Variable timestep makes physics results depend on frame rate. A fixed
   timestep guarantees deterministic simulation; the rendering layer
   interpolates between logic ticks for smooth visuals independently.

#. **What is the key difference between Observer and direct calls?**

   Direct calls create a compile-time dependency between caller and callee.
   Observer/EventBus decouples them: the publisher does not know who listens,
   enabling plug-in architectures and easier testing via mock listeners.

#. **When would you choose CRTP over virtual functions?**

   When profiling shows virtual dispatch is a bottleneck (tight inner loops
   updating thousands of entities per frame), or when you need compile-time
   enforcement of an interface without runtime overhead.

#. **Why does the spatial grid use a cell size parameter?**

   Cell size must be tuned to the average entity interaction radius. Too
   large: many false candidates per cell, degrading toward O(n²). Too small:
   many cells with one entity, high memory and traversal cost.
