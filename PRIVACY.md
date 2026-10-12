# Privacy notice

This extension is designed to help Azure DevOps teams define rules for creating child work items from reusable templates. The extension processes only the minimum project configuration data needed to make those rules work.

## What data is processed

The extension stores and reads project-scoped template configuration data, including:

- the Azure DevOps project identifier
- rule names and optional descriptions
- whether a rule is enabled or disabled
- filter conditions used to decide when a rule should apply
- references to Azure DevOps templates already available in the project
- timestamps showing when a configuration was created or updated

This data is not used to profile people or to analyse unrelated project information. It is used only for template configuration and child-item generation.

## Why the data is processed

The extension processes this information to:

- let project administrators define template rules in the project settings page
- evaluate those rules when a work item action is triggered
- store the project’s template configuration for later reuse

## How and where it is processed

The configuration is stored in Azure DevOps project-scoped extension storage and is used only within the Azure DevOps environment in which the extension is installed. The extension does not send this data to external services, analytics tools, or third-party processors.

Only users who have access to the relevant Azure DevOps project can view or change these settings. The extension does not collect unrelated user content or data from work items beyond the configuration metadata needed to match rules and select templates.

## Data sharing and transfers

This extension does not sell, share, or transfer template or configuration data to outside parties. The data remains within the Azure DevOps platform and is not transferred outside the project or organization, except where Azure DevOps itself handles that data as part of its normal platform operation.

## Retention and security

The extension keeps project configuration data only as long as it is needed for the template rules in that Azure DevOps project. Access is limited by Azure DevOps permissions and standard platform security controls.
