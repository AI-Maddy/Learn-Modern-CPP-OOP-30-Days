#include <iostream>
#include <string>
#include <vector>

struct Entity {
    std::string name;
    int hp;
    void tick() { hp -= 1; }
};

int main() {
    std::vector<Entity> entities{{"Player", 10}, {"NPC", 6}};
    for (auto& entity : entities) {
        entity.tick();
    }

    std::cout << "Day 26 - Mini Project Game Entities\n";
    for (const auto& entity : entities) {
        std::cout << entity.name << " hp=" << entity.hp << "\n";
    }
    return 0;
}
