#include <iostream>
#include <memory>

class Renderer {
  public:
    virtual ~Renderer() = default;
    virtual void draw() const = 0;
};

class TextRenderer final : public Renderer {
  public:
    void draw() const override { std::cout << "Rendering text\n"; }
};

int main() {
    std::unique_ptr<Renderer> renderer = std::make_unique<TextRenderer>();
    std::cout << "Day 07 - Virtual, Override, Final, Abstract\n";
    renderer->draw();
    return 0;
}
