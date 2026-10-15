import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LevelMenu } from "./LevelMenu";

describe("LevelMenu", () => {
  it("shows the first page of 15 levels", () => {
    render(<LevelMenu onPlay={() => {}} onDaily={() => {}} />);
    expect(screen.getAllByRole("button", { name: /^Level \d+,/ })).toHaveLength(15);
    expect(screen.getByRole("button", { name: /^Level 1,/ })).toBeInTheDocument();
  });

  it("plays the chosen level", () => {
    const onPlay = vi.fn();
    render(<LevelMenu onPlay={onPlay} onDaily={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /^Level 4,/ }));
    expect(onPlay).toHaveBeenCalledWith(4);
  });

  it("pages forward to later levels", () => {
    render(<LevelMenu onPlay={() => {}} onDaily={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByRole("button", { name: /^Level 16,/ })).toBeInTheDocument();
  });

  it("starts the daily level", () => {
    const onDaily = vi.fn();
    render(<LevelMenu onPlay={() => {}} onDaily={onDaily} />);
    fireEvent.click(screen.getByRole("button", { name: /daily level/ }));
    expect(onDaily).toHaveBeenCalled();
  });
});
