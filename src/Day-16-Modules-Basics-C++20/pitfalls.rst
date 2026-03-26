Pitfalls — Day 16: C++20 Modules
=================================

Pitfall 1 — Putting ``#include`` After ``export module``
---------------------------------------------------------

**Problem:** Including a legacy header after the module declaration causes the
header's macros and declarations to be treated as part of the module interface,
potentially polluting importers and triggering ODR issues.

**BAD:**

.. code-block:: cpp

  export module logger;

  #include <cstdio>          // WRONG — included inside the module interface
  #include "platform_defs.h" // macros from this header now affect importers

  export void log(const char* msg) { std::printf("%s\n", msg); }

**Why it fails:** Any ``#define`` in ``platform_defs.h`` silently leaks into
every translation unit that does ``import logger;``. The standard says macros
do not escape modules, but ``#include`` after ``export module`` is still parsed
as text and its macros are visible within the same translation unit during
compilation — leading to confusing, non-portable behaviour.

**GOOD:**

.. code-block:: cpp

  module;                    // global module fragment — macros stay here
  #include <cstdio>
  #include "platform_defs.h"

  export module logger;      // clean module interface starts here

  export void log(const char* msg) { std::printf("%s\n", msg); }

**Detection tip:** Enable ``-Winclude-after-module`` (Clang) or equivalent.
Review any ``#include`` that appears after an ``export module`` declaration.

Pitfall 2 — Exporting a ``using namespace`` Declaration
--------------------------------------------------------

**Problem:** Re-exporting an entire namespace with ``export using namespace``
forces all names from that namespace onto every importer, recreating the
worst problem of ``using namespace std;`` in headers.

**BAD:**

.. code-block:: cpp

  export module utils;

  export using namespace std;   // WRONG — dumps entire std into importers

  export void process(vector<int>& v);   // OK syntactically but terrible

**Why it fails:** Any file that does ``import utils;`` now has every standard
library name injected into its global namespace, causing ambiguity errors and
defeating the purpose of qualified names.

**GOOD:**

.. code-block:: cpp

  export module utils;

  import std;   // or #include <vector> in global module fragment

  export void process(std::vector<int>& v);   // use qualified names

**Detection tip:** Search your module interface units for
``export using namespace`` — it is almost always a mistake.

Pitfall 3 — Missing ``export`` on a Type Used in an Exported Function
----------------------------------------------------------------------

**Problem:** Exporting a function that references a non-exported type.
Importers can call the function but cannot name or construct the type.

**BAD:**

.. code-block:: cpp

  export module shapes;

  struct Point { double x, y; };       // NOT exported — internal

  export double distance(Point a, Point b);   // exported, but Point isn't

**Why it fails:** A caller does ``import shapes; Point p{1,2};`` and gets a
compile error because ``Point`` is not part of the exported interface. The
function declaration is reachable but unusable without the type.

**GOOD:**

.. code-block:: cpp

  export module shapes;

  export struct Point { double x, y; };       // exported with the function

  export double distance(Point a, Point b) {
      auto dx = a.x - b.x, dy = a.y - b.y;
      return std::sqrt(dx*dx + dy*dy);
  }

**Detection tip:** Compile a small consumer TU that uses every exported
function and verify it can also construct all parameter/return types directly.

Pitfall 4 — Forgetting That Module Partitions Cannot Be Imported Externally
---------------------------------------------------------------------------

**Problem:** Treating a module partition like a sub-module that external code
can import directly.

**BAD:**

.. code-block:: cpp

  // consumer.cpp
  import shapes:circle;   // WRONG — partitions are internal to their module

  int main() {
      Circle c{{0,0}, 1.0};
  }

**Why it fails:** Module partitions (``module shapes:circle``) are only
importable from within the ``shapes`` module itself using ``import :circle;``
(no module name prefix). External consumers must import the primary module.

**GOOD:**

.. code-block:: cpp

  // shapes.cppm — primary interface re-exports all partitions
  export module shapes;
  export import :circle;
  export import :rectangle;

  // consumer.cpp
  import shapes;    // correct — sees everything re-exported by the primary

  int main() {
      Circle c{{0,0}, 1.0};
  }

**Detection tip:** The error message usually says "cannot import partition
from outside its module." Check that all consumer code imports the primary
module name, not the colon-partition syntax.

Pitfall 5 — Redefining the Same Module Name in Two Interface Units
------------------------------------------------------------------

**Problem:** Two ``.cppm`` files both declare ``export module foo;``, creating
two competing interface units for the same module.

**BAD:**

.. code-block:: cpp

  // foo_a.cppm
  export module foo;
  export int alpha();

  // foo_b.cppm
  export module foo;      // WRONG — second interface unit for module foo
  export int beta();

**Why it fails:** A named module can have exactly one interface unit. The
linker or module scanner will report a duplicate module name error.

**GOOD:** Either merge into one interface unit, use partitions, or use
implementation units:

.. code-block:: cpp

  // foo.cppm — single interface unit
  export module foo;
  export int alpha();
  export int beta();

  // foo_impl.cpp — implementation unit (no export keyword)
  module foo;
  int alpha() { return 1; }
  int beta()  { return 2; }

**Detection tip:** Build system module-dependency scanners (CMake 3.28) will
report this immediately. Keep a one-to-one mapping: one module name, one
interface ``.cppm`` file.

Pitfall 6 — Using Modules With an Incompatible CMake Version
-------------------------------------------------------------

**Problem:** Adding module source files to a CMake project that predates 3.28,
then wondering why the build either fails silently or requires manual flags.

**BAD:**

.. code-block:: cmake

  cmake_minimum_required(VERSION 3.25)   # too old for native module support
  add_executable(app main.cpp math.cppm) # cppm treated as ordinary source

**Why it fails:** CMake < 3.28 does not scan for module dependencies. The
build may partially work (Ninja with ``-fmodule-file=`` set manually) but
lacks automatic dependency tracking — a change to ``math.cppm`` won't trigger
recompilation of all importers.

**GOOD:**

.. code-block:: cmake

  cmake_minimum_required(VERSION 3.28)
  project(App CXX)
  set(CMAKE_CXX_STANDARD 20)

  add_executable(app main.cpp)
  target_sources(app
    PRIVATE
      FILE_SET CXX_MODULES FILES math.cppm
  )

**Detection tip:** Check the CMake version with ``cmake --version``. If you
must support older CMake, use the ``CMakeDependentOption`` or a prebuilt BMI
strategy, but prefer upgrading the build system.

Pitfall 7 — Assuming Modules Eliminate All ODR Issues
-----------------------------------------------------

**Problem:** Believing that switching to modules completely removes the risk of
One Definition Rule violations.

**BAD assumption:**

.. code-block:: cpp

  // Version A: module compiled in Debug build
  export module config;
  export struct Options { int level = 1; bool verbose = true; };

  // Version B: same module in Release build (different struct layout assumed)
  export module config;
  export struct Options { int level = 1; };   // verbose removed

**Why it fails:** Modules prevent the classic textual ODR violation caused by
differing headers, but they do not prevent ODR violations that arise from
compiling the *same* module with different preprocessor definitions (e.g.,
``-DNDEBUG`` removing a data member). The linker may silently pick one
definition and produce wrong behaviour.

**GOOD:** Ensure all translation units that import a module are compiled with
the same flags that affect the module's exported type layout. Use ``static
assert`` guards or versioned module names to catch mismatches.

.. code-block:: cpp

  export module config;

  export struct Options {
      int level = 1;
      bool verbose = true;
      static_assert(sizeof(Options) == 8, "Recompile all TUs if layout changes");
  };

**Detection tip:** UBSan with ``-fsanitize=undefined`` and link-time ODR
detection (``-Wodr`` on GCC, ``/Zc:inline`` on MSVC) catch these at
build/test time.
