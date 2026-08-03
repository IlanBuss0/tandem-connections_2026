import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import MiniGame from "./MiniGame";

describe("Drag Word phrases", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders one visual group per word and no space tile", () => {
    render(
      <MiniGame
        gameType="drag-word"
        gameData={{ dragRounds: [{ image: "🍎", correct: "manzana roja", letters: [] }] }}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getByText("Frase de 2 palabras")).toBeInTheDocument();
    expect(screen.getAllByTestId("drag-word-group")).toHaveLength(2);
    expect(screen.getAllByRole("button")).toHaveLength(11);
  });

  it("completes a multi-word answer without asking for a space", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const onFinish = vi.fn();
    render(
      <MiniGame
        gameType="drag-word"
        gameData={{ dragRounds: [{ image: "", correct: "a b", letters: [] }] }}
        onFinish={onFinish}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "a" }));
    act(() => vi.advanceTimersByTime(300));
    fireEvent.click(screen.getByRole("button", { name: "b" }));
    act(() => vi.advanceTimersByTime(300));

    expect(onFinish).toHaveBeenCalledOnce();
    expect(onFinish).toHaveBeenCalledWith(100);
  });

  it("ignores configured space tiles from legacy content", () => {
    render(
      <MiniGame
        gameType="drag-word"
        gameData={{ dragRounds: [{ image: "", correct: "a b", letters: ["a", " ", "b"] }] }}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
