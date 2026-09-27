import * as SDK from "azure-devops-extension-sdk";
import { createRoot } from "react-dom/client";
import { App } from "./App";

void SDK.init({
  applyTheme: true,
  loaded: false,
});

SDK.ready().then(() => {
  const container = document.getElementById("root");

  if (container) {
    createRoot(container).render(<App />);
  }

  SDK.notifyLoadSucceeded();
}).catch((error: unknown) => {
  const container = document.getElementById("root");

  if (container) {
    container.textContent = "Failed to load";
  }

  console.error("Child Item Generator project settings failed to initialize.", error);
});
