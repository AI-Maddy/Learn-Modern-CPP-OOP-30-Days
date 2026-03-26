Day 26: Mini Project 3 – Game Entities
=======================================

Why This Day Matters
--------------------

Game programming is one of the most demanding applications of C++ OOP.
This day introduces four patterns used in professional game engines —
ECS, fixed-step game loop, event bus, and CRTP — in a self-contained
mini-project that you can run and extend. The patterns transfer directly
to robotics, simulation, and real-time systems beyond games.

Learning Outcomes
-----------------

After completing this day you will be able to:

* Explain the Entity-Component System pattern and contrast it with deep
  inheritance for modelling game objects.
* Implement a fixed-timestep game loop that is frame-rate independent.
* Build a type-safe event bus using ``std::function`` and ``std::any`` so
  game systems communicate without compile-time dependencies.
* Apply CRTP to create a zero-overhead static interface for entity types
  and understand when this is preferable to virtual dispatch.
* Describe how a spatial grid reduces collision detection from O(n²) to
  approximately O(n) in typical game scenes.

Key Concepts
------------

* **Entity-Component System** — entities are IDs; behaviour comes from
  composing components at runtime rather than through class hierarchies.
* **Fixed timestep loop** — physics ticks advance by a constant ``dt``
  so simulation is deterministic regardless of rendering frame rate.
* **Observer / EventBus** — systems publish typed events; subscribers
  handle them without knowing the publisher's identity.
* **CRTP** — the derived type is the template parameter of the base,
  enabling compile-time polymorphism with zero vtable overhead.
* **Spatial partitioning** — dividing world space into a grid so collision
  candidates are found in O(1) per entity rather than O(n).

What You Will Build
-------------------

A small headless game simulation with:

* An ``EntityRegistry`` that stores components in a
  ``unordered_map<EntityId, unordered_map<type_index, any>>``.
* ``PositionComponent``, ``VelocityComponent``, ``HealthComponent``, and
  ``RenderComponent`` structs.
* A ``GameLoop`` that runs a physics system and a health-cleanup system for
  a configurable number of ticks.
* An ``EventBus`` supporting ``DamageEvent`` and ``EntityDiedEvent``.
* A ``SpatialGrid`` for querying nearby entities by position.
* A ``main.cpp`` that creates a player and several enemies, runs 120 ticks,
  damages the enemies, and prints surviving entity positions.

Hands-On Task
-------------

Add a ``CollisionSystem`` that:

#. Rebuilds the ``SpatialGrid`` each tick from current entity positions.
#. For every entity, queries nearby entities and checks if any are within
   a ``CollisionComponent::radius`` overlap.
#. Publishes a ``CollisionEvent{id_a, id_b}`` through the ``EventBus``
   when a collision is detected.
#. Subscribes a handler that deals 10 damage to both entities involved.

Suggested Study Order
---------------------

#. **Read theory.rst** (40 min) — work through the ECS registry code until
   you understand the ``type_index`` keyed component map; then study the
   game loop, event bus, and CRTP sections.
#. **Compile and run main.cpp** (15 min) — trace the output; verify entity
   positions change each tick.
#. **Implement CollisionSystem** (40 min) — start with the grid rebuild,
   then add the overlap test, then publish events.
#. **Read pitfalls.rst** (15 min) — check your collision loop for the
   iterator-invalidation pitfall; check your event subscriptions for
   dangling ``this``.
#. **Write one unit test** (20 min) — assert that two overlapping entities
   both take 10 damage after one tick of the collision system.

Build and Run
-------------

.. code-block:: bash

    cmake -S . -B build -G Ninja
    cmake --build build --target day_26
    ./build/src/day_26

Related Days
------------

* **Day 13** — Templates and CRTP foundations.
* **Day 16** — Composition vs inheritance design choice.
* **Day 20** — std::any and type erasure concepts.
* **Day 24** — Mini Project 1 (Bank System) for OOP foundations.
* **Day 25** — Mini Project 2 (Shape Editor) for Visitor and variant.
* **Day 27** — Refactoring Legacy Code (applies directly to game codebases).
