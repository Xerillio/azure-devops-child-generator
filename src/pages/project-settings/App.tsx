import React from "react";
import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  FluentProvider,
  OverlayDrawer,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  MessageBarActions,
  webLightTheme,
  type Theme,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";

interface IAppProps {
  /** Fluent theme to render with, matching the host Azure DevOps theme. */
  theme?: Theme;
}

interface IAppState {
  errorMessage: string;
  isPanelOpen: boolean;
}

export class App extends React.Component<IAppProps, IAppState> {
  static readonly defaultProps: IAppProps = {
    theme: webLightTheme
  };

  constructor(props: IAppProps) {
    super(props);

    this.state = {
      errorMessage: "",
      isPanelOpen: false,
    };
  }

  override render(): React.ReactNode {
    const { errorMessage } = this.state;

    return <FluentProvider theme={this.props.theme} style={{ height: "100%", padding: "16px" }}>
      {errorMessage.length > 0 ? (
        <MessageBar intent="error" >
          <MessageBarBody>
            <MessageBarTitle>Error:</MessageBarTitle>
            {errorMessage}
          </MessageBarBody>
          <MessageBarActions
            containerAction={
              <Button
                appearance="transparent"
                aria-label="Dismiss"
                icon={<Dismiss24Regular/>}
                onClick={() => this.setState({ errorMessage: "" })}/>
            } />
        </MessageBar>
      ) : null}

      <Button appearance="primary" onClick={() => this.setState({ isPanelOpen: true })}>
        Configure existing template
      </Button>

      <OverlayDrawer
        position="end"
        size="medium"
        open={this.state.isPanelOpen}
        onOpenChange={(_, data) => this.setState({ isPanelOpen: data.open })}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss24Regular />}
                onClick={() => this.setState({ isPanelOpen: false })}
              />
            }
          >
            Choose a template
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div aria-label="Template configuration panel content" />
        </DrawerBody>
      </OverlayDrawer>
    </FluentProvider>;
  }
}
