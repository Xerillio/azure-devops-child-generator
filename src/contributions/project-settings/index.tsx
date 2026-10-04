import * as SDK from "azure-devops-extension-sdk";
import { createRoot } from "react-dom/client";
import { Root } from "../../components/Root";
import { App } from "./App";

await SDK.init({ applyTheme: true, loaded: false });
const container = document.getElementById("root");

try {
  if (container) {
    createRoot(container).render(<Root Component={App} />);
    await SDK.notifyLoadSucceeded();
  }
  else {
    await SDK.notifyLoadFailed("Could not locate 'root' element.");
  }
}
catch (err) {
  if (err instanceof Error) {
    await SDK.notifyLoadFailed(err);
  }
  console.error(err);
}
