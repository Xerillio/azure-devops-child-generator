import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the configure existing template button", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "Configure existing template" }),
    ).toBeInTheDocument();
  });

  it("opens and closes the template configuration panel", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Configure existing template" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
