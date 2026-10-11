import {
    createAzureDevOpsTemplateReference,
    createEmptyTemplateConfiguration,
    createTemplateFilterClause,
    createTemplateRuleConfiguration,
    normalizeTemplateRuleConfiguration,
    upgradeTemplateConfiguration,
} from "../models/template-config";

describe("createEmptyTemplateConfiguration", () => {
    it("creates an empty project configuration with a timestamp", () => {
        const configuration = createEmptyTemplateConfiguration("project-42");

        expect(configuration.version).toBe(1);
        expect(configuration.projectId).toBe("project-42");
        expect(configuration.configurations).toEqual([]);
        expect(configuration.createdAt).toEqual(expect.any(String));
        expect(configuration.updatedAt).toBe(configuration.createdAt);
    });
});

describe("createTemplateRuleConfiguration", () => {
    it("creates filter clauses and rules with generated defaults when fields are omitted", () => {
        const filter = createTemplateFilterClause("System.State", "equals", "Active");
        const rule = createTemplateRuleConfiguration("Create follow-up task", undefined, {
            description: "Creates a follow-up for active bugs.",
            filters: [filter],
        });

        expect(rule.id).toMatch(/^template-config-/);
        expect(rule.name).toBe("Create follow-up task");
        expect(rule.isEnabled).toBe(true);
        expect(rule.filters).toEqual([filter]);
        expect(rule.templates).toEqual([]);
    });

    it("uses generated defaults when optional rule metadata is missing", () => {
        const rule = createTemplateRuleConfiguration("Default metadata");

        expect(rule.id).toMatch(/^template-config-/);
        expect(rule.description).toBeUndefined();
        expect(rule.isEnabled).toBe(true);
        expect(rule.filters).toEqual([]);
        expect(rule.templates).toEqual([]);
        expect(rule.createdAt).toEqual(expect.any(String));
        expect(rule.updatedAt).toBe(rule.createdAt);
    });

    it("creates unique id when omitted", () => {
        const rule1 = createTemplateRuleConfiguration("Create follow-up task");
        const rule2 = createTemplateRuleConfiguration("Create follow-up task");

        expect(rule1.id).toBeDefined();
        expect(rule2.id).toBeDefined();
        expect(rule1.id).not.toBe(rule2.id);
    });
});

describe("createTemplateFilterClause", () => {
    it("creates filter clause with defaults when fields are omitted", () => {
        const filter = createTemplateFilterClause("System.State", "equals", "Active");

        expect(filter.id).toMatch(/^System.State-/);
        expect(filter.field).toBe("System.State");
        expect(filter.operator).toBe("equals");
        expect(filter.value).toBe("Active");
    });
});

describe("normalizeTemplateRuleConfiguration", () => {
    it("restores safe defaults for empty or partial inputs", () => {
        const normalized = normalizeTemplateRuleConfiguration({
            filters: [
                { value: null },
                { field: "System.Title", operator: "contains", value: "test" },
            ],
            templates: [null, { id: "template-2", name: "Second template" }],
            isEnabled: false,
        });

        expect(normalized.name).toBe("Unnamed configuration");
        expect(normalized.description).toBeUndefined();
        expect(normalized.isEnabled).toBe(false);
        expect(normalized.filters).toHaveLength(2);
        expect(normalized.filters[0]).toMatchObject({
            field: "System.Title",
            operator: "equals",
            value: "",
        });
        expect(normalized.filters[1]).toMatchObject({
            field: "System.Title",
            operator: "contains",
            value: "test",
        });
        expect(normalized.templates).toHaveLength(2);
        expect(normalized.templates[0]?.id).toMatch(/^template-/);
        expect(normalized.templates[0]?.name).toBe("Unnamed template");
        expect(normalized.templates[1]).toMatchObject({
            id: "template-2",
            name: "Second template",
        });
    });

    it("uses defaults when given null", () => {
        const normalized = normalizeTemplateRuleConfiguration(null);

        expect(normalized.id).toMatch(/^template-config-/);
        expect(normalized.name).toBe("Unnamed configuration");
        expect(normalized.description).toBeUndefined();
        expect(normalized.isEnabled).toBe(true);
        expect(normalized.filters).toEqual([]);
        expect(normalized.templates).toEqual([]);
        expect(normalized.createdAt).toEqual(expect.any(String));
        expect(normalized.updatedAt).toEqual(expect.any(String));
    });
});

describe("upgradeTemplateConfiguration", () => {
    it("upgrades a versioned configuration and preserves the project scope", () => {
        const configuration = upgradeTemplateConfiguration(
            {
                version: 1,
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

    it("returns a blank configuration for nullish values and fallback project ids", () => {
        const fallback = upgradeTemplateConfiguration(undefined, "project-fallback");
        const fallbackFromNull = upgradeTemplateConfiguration(null, "project-fallback");
        const unknownProject = upgradeTemplateConfiguration(null);

        expect(fallback).toMatchObject({
            version: 1,
            projectId: "project-fallback",
            configurations: [],
        });
        expect(fallbackFromNull).toEqual(fallback);
        expect(unknownProject).toMatchObject({
            version: 1,
            projectId: "unknown-project",
            configurations: [],
        });
    });

    it("uses fallback values when project metadata is incomplete", () => {
        const normalized = upgradeTemplateConfiguration({
            version: undefined,
            projectId: 123,
            configurations: undefined,
            createdAt: 123,
            updatedAt: 456,
        }, "project-fallback");
        
        expect(normalized.projectId).toBe("project-fallback");
        expect(normalized.configurations).toEqual([]);
        expect(normalized.createdAt).toEqual(expect.any(String));
        expect(normalized.updatedAt).toBe(normalized.createdAt);
    });
    
    it("uses the unknown-project fallback when project metadata is not provided", () => {
        const normalized = upgradeTemplateConfiguration({
            projectId: 123,
            configurations: [{
                name: "Rule with missing project context",
                filters: [{ field: "System.State", operator: "equals", value: "Active" }],
            }],
        });
        
        expect(normalized.projectId).toBe("unknown-project");
        expect(normalized.configurations).toHaveLength(1);
        expect(normalized.createdAt).toEqual(expect.any(String));
        expect(normalized.updatedAt).toBe(normalized.createdAt);
    });
    
    it("throws when not passed an object", () => {
        expect(() => upgradeTemplateConfiguration("not-an-object")).toThrow(
            "Template configuration must be an object.",
        );
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