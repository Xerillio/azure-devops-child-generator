import * as SDK from "azure-devops-extension-sdk";

void SDK.init({
  applyTheme: true,
  loaded: false,
});

SDK.ready().then(() => {
  window.alert("Feature not yet implemented.");
  SDK.notifyLoadSucceeded();
}).catch((error: unknown) => {
  console.error("Child Item Generator menu action failed to initialize.", error);
  window.alert("Feature not yet implemented.");
});
