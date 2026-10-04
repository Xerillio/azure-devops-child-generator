import { fireEvent, render, screen } from "@testing-library/react";
import { webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components";
import { Root, resolveHostTheme } from "./Root";

function setMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

describe("Root", () => {
  beforeEach(() => {
    document.documentElement.style.setProperty("--background-color", "#000000");
    setMatchMedia(false);
  });

  afterEach(() => {
    document.documentElement.style.removeProperty("--background-color");
  });

  it("renders the provided component with the resolved host theme", () => {
    const ThemeProbe = ({ theme, label }: { theme?: Theme; label: string }) => (
      <div>{label}: {theme === webDarkTheme ? "dark" : "light"}</div>
    );

    render(<Root Component={ThemeProbe} componentProps={{ label: "Theme" }} />);

    expect(screen.getByText("Theme: dark")).toBeInTheDocument();
  });

  it("updates the rendered theme when Azure DevOps emits a themeApplied event", () => {
    const ThemeProbe = ({ theme }: { theme?: Theme }) => (
      <div data-testid="theme-probe">{theme === webDarkTheme ? "dark" : "light"}</div>
    );

    render(<Root Component={ThemeProbe} />);

    expect(screen.getByTestId("theme-probe")).toHaveTextContent("dark");

    document.documentElement.style.setProperty("--background-color", "#ffffff");
    fireEvent(window, new Event("themeApplied"));

    expect(screen.getByTestId("theme-probe")).toHaveTextContent("light");
  });

  it("falls back to the browser preference when no host background color is present - dark theme", () => {
    document.documentElement.style.removeProperty("--background-color");
    setMatchMedia(true);

    expect(resolveHostTheme()).toBe(webDarkTheme);
  });

  it("falls back to the browser preference when no host background color is present - light theme", () => {
    document.documentElement.style.removeProperty("--background-color");
    setMatchMedia(false);

    expect(resolveHostTheme()).toBe(webLightTheme);
  });
});
