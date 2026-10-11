export const TEMPLATE_CONFIGURATION_VERSION = 1 as const;

export type TemplateFilterValue = string | number | boolean | null;

export type TemplateFilterOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "greater_than_or_equals"
  | "less_than"
  | "less_than_or_equals"
  | "in"
  | "not_in";

export interface TemplateFilterClause {
    id: string;
    field: string;
    operator: TemplateFilterOperator;
    value: TemplateFilterValue;
}

export interface AzureDevOpsTemplateReference {
    id: string;
    name: string;
}

export interface TemplateRuleConfiguration {
    id: string;
    name: string;
    description?: string;
    isEnabled: boolean;
    filters: TemplateFilterClause[];
    templates: AzureDevOpsTemplateReference[];
    createdAt: string;
    updatedAt: string;
}

export interface TemplateConfigurationV1 {
    version: 1;
    projectId: string;
    configurations: TemplateRuleConfiguration[];
    createdAt: string;
    updatedAt: string;
}

export type TemplateConfiguration = TemplateConfigurationV1;

export function createAzureDevOpsTemplateReference(
    id: string,
    name: string,
): AzureDevOpsTemplateReference {
    return {
        id,
        name,
    };
}

export function createEmptyTemplateConfiguration(projectId: string): TemplateConfiguration {
    const now = new Date().toISOString();

    return {
        version: TEMPLATE_CONFIGURATION_VERSION,
        projectId,
        configurations: [],
        createdAt: now,
        updatedAt: now,
    };
}

export function createTemplateFilterClause(
    field: string,
    operator: TemplateFilterOperator,
    value: TemplateFilterValue,
    id = `${field}-${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`,
): TemplateFilterClause {
    return {
        id,
        field,
        operator,
        value,
    };
}

export function createTemplateRuleConfiguration(
    name: string,
    isEnabled = true,
    overrides: Partial<Omit<TemplateRuleConfiguration, "id" | "name" | "isEnabled" | "filters" | "templates" | "createdAt" | "updatedAt">> & {
        id?: string;
        description?: string;
        filters?: TemplateFilterClause[];
        templates?: AzureDevOpsTemplateReference[];
        createdAt?: string;
        updatedAt?: string;
    } = {},
): TemplateRuleConfiguration {
    const now = new Date().toISOString();

    return {
        id: overrides.id ?? `template-config-${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        description: overrides.description,
        isEnabled,
        filters: overrides.filters ?? [],
        templates: overrides.templates ?? [],
        createdAt: overrides.createdAt ?? now,
        updatedAt: overrides.updatedAt ?? now,
    };
}

function normalizeFilterClause(clause: Partial<TemplateFilterClause>): TemplateFilterClause {
    const field = typeof clause.field === "string" ? clause.field : "System.Title";
    const operator = (
        typeof clause.operator === "string" ? clause.operator : "equals"
    );

    return {
        id:
      typeof clause.id === "string"
          ? clause.id
          : `${field}-${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`,
        field,
        operator,
        value: clause.value ?? "",
    };
}

function normalizeTemplateReference(value: unknown): AzureDevOpsTemplateReference {
    const record = (value ?? {}) as Partial<AzureDevOpsTemplateReference>;

    return {
        id: typeof record.id === "string" ? record.id : `template-${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof record.name === "string" ? record.name : "Unnamed template",
    };
}

export function normalizeTemplateRuleConfiguration(value: unknown): TemplateRuleConfiguration {
    const record = (value ?? {}) as Partial<TemplateRuleConfiguration>;
    const now = new Date().toISOString();

    return {
        id:
      typeof record.id === "string"
          ? record.id
          : `template-config-${Date.now().toString()}-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof record.name === "string" ? record.name : "Unnamed configuration",
        description: typeof record.description === "string" ? record.description : undefined,
        isEnabled: record.isEnabled !== false,
        filters: Array.isArray(record.filters)
            ? record.filters.map((clause) => normalizeFilterClause(clause as Partial<TemplateFilterClause>))
            : [],
        templates: Array.isArray(record.templates)
            ? record.templates.map((template) => normalizeTemplateReference(template))
            : [],
        createdAt: typeof record.createdAt === "string" ? record.createdAt : now,
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : now,
    };
}

export function upgradeTemplateConfiguration(
    value: unknown,
    fallbackProjectId?: string,
): TemplateConfiguration {
    if (value === undefined || value === null) {
        return createEmptyTemplateConfiguration(fallbackProjectId ?? "unknown-project");
    }

    if (typeof value !== "object" || Array.isArray(value)) {
        throw new TypeError("Template configuration must be an object.");
    }

    const record = value as Partial<TemplateConfiguration> & {
        templates?: unknown[];
        configurations?: unknown[];
    };
    const version = (record.version as number | undefined) ?? TEMPLATE_CONFIGURATION_VERSION;

    if (version !== TEMPLATE_CONFIGURATION_VERSION) {
        throw new Error(`Unsupported template configuration version: ${version.toString()}`);
    }

    const projectId = typeof record.projectId === "string" ? record.projectId : fallbackProjectId ?? "unknown-project";
    const configurations = Array.isArray(record.configurations)
        ? record.configurations.map((configuration) => normalizeTemplateRuleConfiguration(configuration))
        : [];
    const createdAt = typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString();
    const updatedAt = typeof record.updatedAt === "string" ? record.updatedAt : createdAt;

    return {
        version: TEMPLATE_CONFIGURATION_VERSION,
        projectId,
        configurations,
        createdAt,
        updatedAt,
    };
}
