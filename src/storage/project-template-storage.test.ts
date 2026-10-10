import {
  createAzureDevOpsTemplateReference,
  createTemplateFilterClause,
  createTemplateRuleConfiguration,
  upgradeTemplateConfiguration,
} from "../models/template-config";
import {
  AzureDevOpsProjectTemplateStorage,
  getProjectScopedTemplateStorageKey,
} from "./project-template-storage";

describe("template configuration model", () => {
  it("upgrades a versioned configuration and preserves the project scope", () => {
    const configuration = upgradeTemplateConfiguration(
      {
        version: 1,
        projectId: "project-42",
        configurations: [
          createTemplateRuleConfiguration("Create follow-up task", true, {
            id: "rule-1",
            description: "Create a follow-up when a bug is active.",
            filters: [
              createTemplateFilterClause("System.State", "equals", "Active"),
              createTemplateFilterClause("System.WorkItemType", "equals", "Bug"),
            ],
            templates: [
              createAzureDevOpsTemplateReference("task-template-1", "Task template"),
            ],
          }),
        ],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      "project-42",
    );

    expect(configuration.version).toBe(1);
    expect(configuration.projectId).toBe("project-42");
    expect(configuration.configurations).toHaveLength(1);
    expect(configuration.configurations[0]?.filters).toHaveLength(2);
    expect(configuration.configurations[0]?.templates[0]?.id).toBe("task-template-1");
  });

  it("throws for unsupported versions", () => {
    expect(() =>
      upgradeTemplateConfiguration({
        version: 99,
        projectId: "project-42",
        configurations: [],
      }, "project-42"),
    ).toThrow("Unsupported template configuration version: 99");
  });
});

describe("project template storage", () => {
  it("persists template configurations within a project-scoped storage key and supports CRUD operations", async () => {
    const store = new Map<string, unknown>();
    const storage = new AzureDevOpsProjectTemplateStorage(
      {
        async getValue<T>(key: string): Promise<T | undefined> {
          return store.has(key) ? (store.get(key) as T) : undefined;
        },
        async setValue<T>(key: string, value: T): Promise<void> {
          store.set(key, value);
        },
        async deleteValue(key: string): Promise<void> {
          store.delete(key);
        },
      },
      "project-42",
    );

    const key = getProjectScopedTemplateStorageKey("project-42");
    expect(key).toBe("child-generator/project-templates/project-42");

    const created = await storage.addConfiguration(
      createTemplateRuleConfiguration("Create subtask", true, {
        id: "rule-1",
        filters: [
          createTemplateFilterClause("System.WorkItemType", "equals", "Bug"),
        ],
        templates: [
          createAzureDevOpsTemplateReference("task-template-1", "Child task template"),
          createAzureDevOpsTemplateReference("task-template-2", "Second child task template"),
        ],
      }),
    );

    expect(created.id).toBe("rule-1");
    expect((await storage.listConfigurations())).toHaveLength(1);

    const updated = await storage.updateConfiguration(created.id, {
      name: "Create follow-up task",
      description: "Adds follow-up tasks when a bug is active.",
    });

    expect(updated.name).toBe("Create follow-up task");
    expect((await storage.load()).configurations[0]?.description).toBe("Adds follow-up tasks when a bug is active.");

    const deleted = await storage.deleteConfiguration(updated.id);
    expect(deleted).toBe(true);
    expect((await storage.listConfigurations())).toHaveLength(0);
  });
});
