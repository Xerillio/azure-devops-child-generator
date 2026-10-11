import {
    createAzureDevOpsTemplateReference,
    createTemplateFilterClause,
    createTemplateRuleConfiguration,
} from "../models/template-config";
import {
    AzureDevOpsProjectTemplateStorage,
    getProjectScopedTemplateStorageKey,
} from "./project-template-storage";

describe("getProjectScopedTemplateStorageKey", () => {
    it("creates a project-scoped storage key for a valid project id", () => {
        expect(getProjectScopedTemplateStorageKey("project-42")).toBe("child-generator/project-templates/project-42");
    });

    it("throws when a project id is blank", () => {
        expect(() => getProjectScopedTemplateStorageKey("   ")).toThrow(
            "A project identifier is required for project-scoped template storage.",
        );
    });
});

describe("AzureDevOpsProjectTemplateStorage", () => {
    const mockDataService = () => {
        const store = new Map<string, unknown>();

        return {
            store,
            service: {
                getValue<T>(key: string): Promise<T | undefined> {
                    return Promise.resolve(store.has(key) ? (store.get(key) as T) : undefined);
                },
                setValue(key: string, value: unknown): Promise<void> {
                    return Promise.resolve().then(() => { store.set(key, value); });
                },
                deleteValue(key: string): Promise<void> {
                    return Promise.resolve().then(() => { store.delete(key); });
                },
            },
        };
    };

    describe("#ctor", () => {
        it("throws when a project id is blank", () => {
            expect(() => new AzureDevOpsProjectTemplateStorage(mockDataService().service, "  ")).toThrow(
                "A project identifier is required for project-scoped template storage.",
            );
        });

        it("creates a storage instance", () => {
            const storage = new AzureDevOpsProjectTemplateStorage(mockDataService().service, "project-99");
    
            expect(storage.projectId).toBe("project-99");
            expect(storage.storageKey).toBe("child-generator/project-templates/project-99");
        });
    });


    describe("#addConfiguration", () => {
        it("adds a configuration and persists it to the project-scoped storage key", async() => {
            const { service, store } = mockDataService();
            const storage = new AzureDevOpsProjectTemplateStorage(service, "project-42");
            const rule = createTemplateRuleConfiguration("Create subtask", true, {
                id: "rule-1",
                filters: [createTemplateFilterClause("System.WorkItemType", "equals", "Bug")],
                templates: [
                    createAzureDevOpsTemplateReference("task-template-1", "Child task template"),
                    createAzureDevOpsTemplateReference("task-template-2", "Second child task template"),
                ],
            });
    
            const created = await storage.addConfiguration(rule);
    
            expect(created.id).toBe("rule-1");
            // expect((await storage.listConfigurations())).toEqual([expect.objectContaining({ id: "rule-1" })]);
            expect(store.get(getProjectScopedTemplateStorageKey("project-42"))).toBeDefined();
        });

        it("throws when adding a duplicate configuration id", async() => {
            const { service } = mockDataService();
            const storage = new AzureDevOpsProjectTemplateStorage(service, "project-42");
            const rule = createTemplateRuleConfiguration("Create subtask", true, {
                id: "rule-1",
                filters: [createTemplateFilterClause("System.WorkItemType", "equals", "Bug")],
                templates: [createAzureDevOpsTemplateReference("task-template-1", "Child task template")],
            });

            await storage.addConfiguration(rule);

            await expect(storage.addConfiguration({ ...rule, id: "rule-1" })).rejects.toThrow(
                "A configuration with the id \"rule-1\" already exists.",
            );
        });
    });

    describe("#updateConfiguration", () => {
        it("updates an existing configuration without replacing its filters or templates when omitted", async() => {
            const { service } = mockDataService();
            const storage = new AzureDevOpsProjectTemplateStorage(service, "project-42");
            await storage.addConfiguration(createTemplateRuleConfiguration("Create subtask", true, {
                id: "rule-1",
                filters: [createTemplateFilterClause("System.WorkItemType", "equals", "Bug")],
                templates: [createAzureDevOpsTemplateReference("task-template-1", "Child task template")],
            }));
    
            const updated = await storage.updateConfiguration("rule-1", {
                name: "Create follow-up task",
                description: "Adds follow-up tasks when a bug is active.",
            });
    
            expect(updated.name).toBe("Create follow-up task");
            expect(updated.description).toBe("Adds follow-up tasks when a bug is active.");
            expect(updated.filters).toHaveLength(1);
            expect(updated.filters[0]?.field).toBe("System.WorkItemType");
            expect(updated.templates).toHaveLength(1);
            expect(updated.templates[0]?.name).toBe("Child task template");
        });

        it("replaces the filters and templates when update values are provided", async() => {
            const { service } = mockDataService();
            const storage = new AzureDevOpsProjectTemplateStorage(service, "project-42");
            await storage.addConfiguration(createTemplateRuleConfiguration("Create subtask", true, {
                id: "rule-1",
                filters: [createTemplateFilterClause("System.WorkItemType", "equals", "Bug")],
                templates: [createAzureDevOpsTemplateReference("task-template-1", "Child task template")],
            }));
    
            const updated = await storage.updateConfiguration("rule-1", {
                filters: [createTemplateFilterClause("System.State", "equals", "Active")],
                templates: [createAzureDevOpsTemplateReference("task-template-3", "Replacement template")],
            });
    
            expect(updated.name).toBe("Create subtask");
            expect(updated.filters[0]?.field).toBe("System.State");
            expect(updated.templates[0]?.name).toBe("Replacement template");
            expect((await storage.load()).configurations[0]).toMatchObject({
                filters: [expect.objectContaining({ field: "System.State" })],
                templates: [expect.objectContaining({ name: "Replacement template" })],
            });
        });

        it("updates only the configuration with matching id", async() => {
            const { service } = mockDataService();
            const storage = new AzureDevOpsProjectTemplateStorage(service, "project-42");
            await storage.addConfiguration(createTemplateRuleConfiguration("First rule", true, {
                id: "rule-1",
                filters: [],
                templates: [],
            }));
            await storage.addConfiguration(createTemplateRuleConfiguration("Second rule", true, {
                id: "rule-2",
                filters: [],
                templates: [],
            }));
    
            const updated = await storage.updateConfiguration("rule-2", {
                name: "New second rule",
                description: "Second rule description"
            });
    
            expect(updated.name).toBe("New second rule");
            expect(updated.description).toBe("Second rule description");
            expect((await storage.load()).configurations).toMatchObject([
                {
                    name: "First rule",
                },
                {
                    name: "New second rule",
                    description: "Second rule description",
                }
            ]);
        });

        it("throws when updating a missing configuration id", async() => {
            const { service } = mockDataService();
            const storage = new AzureDevOpsProjectTemplateStorage(service, "project-42");

            await expect(storage.updateConfiguration("missing-rule", { name: "Missing rule" })).rejects.toThrow(
                "A configuration with the id \"missing-rule\" does not exist.",
            );
        });
    });

    describe("#deleteConfiguration", () => {
        it("deletes an existing configuration", async() => {
            const { service } = mockDataService();
            const storage = new AzureDevOpsProjectTemplateStorage(service, "project-42");
            await storage.addConfiguration(createTemplateRuleConfiguration("Create subtask", true, {
                id: "rule-1",
                filters: [createTemplateFilterClause("System.WorkItemType", "equals", "Bug")],
                templates: [createAzureDevOpsTemplateReference("task-template-1", "Child task template")],
            }));
    
            const deleted = await storage.deleteConfiguration("rule-1");
    
            expect(deleted).toBe(true);
            await expect(storage.listConfigurations()).resolves.toEqual([]);
        });

        it("returns false when deleting a missing configuration id", async() => {
            const { service } = mockDataService();
            const storage = new AzureDevOpsProjectTemplateStorage(service, "project-42");

            await expect(storage.deleteConfiguration("missing-rule")).resolves.toBe(false);
        });
    });
});
