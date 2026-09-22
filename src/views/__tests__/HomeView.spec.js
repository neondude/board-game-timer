import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeView from "@/views/HomeView.vue";

vi.mock("vue-router", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/composables/useGameTimer", async () => {
  const { ref } = await import("vue");
  return {
    createGame: vi.fn(),
    useActiveGame: () => ({ game: ref(null) }),
  };
});

describe("HomeView", () => {
  beforeEach(() => sessionStorage.clear());

  it("renders the Vue 3 draggable player list", () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: {
            props: ["to"],
            template: "<a><slot /></a>",
          },
        },
      },
    });

    expect(wrapper.findAll(".player-edit-row")).toHaveLength(2);
    expect(
      wrapper.findAll(".player-edit-row > input").map((input) => input.element.value),
    ).toEqual(["Player 1", "Player 2"]);
  });
});