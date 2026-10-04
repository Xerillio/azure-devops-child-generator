import { type ComponentProps, type ElementType, useEffect, useState } from "react";
import { webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components";

export type RootComponentProps = {
  /** Fluent theme to render with, matching the host Azure DevOps theme. */
  theme?: Theme;
};

export type RootProps<TComponent extends ElementType> = {
  /** The component to render in the Root component */
  Component: TComponent;
  /**
   * Additional props to forward to {@link RootProps.Component Component},
   * apart from the theme
   */
  componentProps?: Omit<ComponentProps<TComponent>, "theme">;
};

export function resolveHostTheme(): Theme {
  const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--background-color")
    .trim();

  if (!backgroundColor) {
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
      ? webDarkTheme
      : webLightTheme;
  }

  const probe = document.createElement("span");
  probe.style.color = backgroundColor;
  document.body.appendChild(probe);
  const [r, g, b] = getComputedStyle(probe)
    .color.match(/\d+(?:\.\d+)?/g)
    ?.map(Number) ?? [255, 255, 255];
  probe.remove();

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5 ? webDarkTheme : webLightTheme;
}

export function Root<TComponent extends ElementType>({
  Component,
  componentProps,
}: Readonly<RootProps<TComponent>>) {
  const [theme, setTheme] = useState<Theme>(resolveHostTheme);

  useEffect(() => {
    const handleThemeApplied = () => setTheme(resolveHostTheme());

    window.addEventListener("themeApplied", handleThemeApplied);

    return () => window.removeEventListener("themeApplied", handleThemeApplied);
  }, []);

  const mergedProps = {
    ...(componentProps ?? {}),
    theme,
  } as Record<string, unknown>;

  const ResolvedComponent = Component as ElementType;

  return <ResolvedComponent {...mergedProps} />;
}
