import * as SDK from "azure-devops-extension-sdk";
import { createRoot } from "react-dom/client";
import { useEffect, useState } from "react";
import { webDarkTheme, webLightTheme, type Theme } from "@fluentui/react-components";
import { App } from "./App";

/**
 * Resolves a Fluent theme from the Azure DevOps host's current background color
 * (applied as the `--background-color` CSS variable by `SDK.init({ applyTheme: true })`),
 * so the extension UI matches the surrounding light/dark Azure DevOps theme.
 */
function resolveHostTheme(): Theme {
  const backgroundColor = getComputedStyle(document.documentElement)
    .getPropertyValue("--background-color")
    .trim();

  if (!backgroundColor) {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? webDarkTheme
      : webLightTheme;
  }

  const probe = document.createElement("span");
  probe.style.color = backgroundColor;
  document.body.appendChild(probe);
  const [r, g, b] = getComputedStyle(probe)
    .color.match(/\d+(\.\d+)?/g)
    ?.map(Number) ?? [255, 255, 255];
  probe.remove();

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance < 0.5 ? webDarkTheme : webLightTheme;
}

function Root() {
  const [theme, setTheme] = useState<Theme>(resolveHostTheme);

  useEffect(() => {
    const handleThemeApplied = () => setTheme(resolveHostTheme());

    window.addEventListener("themeApplied", handleThemeApplied);

    return () => window.removeEventListener("themeApplied", handleThemeApplied);
  }, []);

  return <App theme={theme} />;
}

await SDK.init({ applyTheme: true });
const container = document.getElementById("root");

if (container) {
  createRoot(container).render(<Root />);
}
else {
  console.error("Could not locate 'root' element.");
}
