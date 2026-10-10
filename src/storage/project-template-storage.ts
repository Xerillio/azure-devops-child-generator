import {
  type TemplateConfiguration,
  type TemplateRuleConfiguration,
  normalizeTemplateRuleConfiguration,
  upgradeTemplateConfiguration,
} from "../models/template-config";

export const PROJECT_TEMPLATE_STORAGE_ROOT = "child-generator/project-templates";

export interface ProjectCollectionDataService {
  getValue<T>(key: string): Promise<T | undefined>;
  setValue<T>(key: string, value: T): Promise<void>;
  deleteValue(key: string): Promise<void>;
}

export function getProjectScopedTemplateStorageKey(projectId: string): string {
  const normalizedProjectId = projectId.trim();

  if (!normalizedProjectId) {
    throw new Error("A project identifier is required for project-scoped template storage.");
  }

  return `${PROJECT_TEMPLATE_STORAGE_ROOT}/${encodeURIComponent(normalizedProjectId)}`;
}

export interface ProjectTemplateStorageContract {
  readonly projectId: string;
  readonly storageKey: string;
  load(): Promise<TemplateConfiguration>;
  save(configuration: TemplateConfiguration): Promise<TemplateConfiguration>;
  listConfigurations(): Promise<TemplateRuleConfiguration[]>;
  addConfiguration(configuration: TemplateRuleConfiguration): Promise<TemplateRuleConfiguration>;
  updateConfiguration(id: string, changes: Partial<TemplateRuleConfiguration>): Promise<TemplateRuleConfiguration>;
  deleteConfiguration(id: string): Promise<boolean>;
}

export class AzureDevOpsProjectTemplateStorage implements ProjectTemplateStorageContract {
  public readonly projectId: string;
  public readonly storageKey: string;

  constructor(
    private readonly dataService: ProjectCollectionDataService,
    projectId: string,
  ) {
    this.projectId = projectId.trim();
    this.storageKey = getProjectScopedTemplateStorageKey(this.projectId);
  }

  public async load(): Promise<TemplateConfiguration> {
    const rawConfig = await this.dataService.getValue<unknown>(this.storageKey);
    return upgradeTemplateConfiguration(rawConfig, this.projectId);
  }

  public async save(configuration: TemplateConfiguration): Promise<TemplateConfiguration> {
    const nextConfiguration = upgradeTemplateConfiguration(configuration, this.projectId);
    const hydratedConfiguration: TemplateConfiguration = {
      ...nextConfiguration,
      projectId: this.projectId,
      updatedAt: new Date().toISOString(),
      createdAt: nextConfiguration.createdAt ?? new Date().toISOString(),
    };

    await this.dataService.setValue(this.storageKey, hydratedConfiguration);

    return hydratedConfiguration;
  }

  public async listConfigurations(): Promise<TemplateRuleConfiguration[]> {
    return (await this.load()).configurations;
  }

  public async addConfiguration(configuration: TemplateRuleConfiguration): Promise<TemplateRuleConfiguration> {
    const currentConfiguration = await this.load();
    const normalizedConfiguration = normalizeTemplateRuleConfiguration(configuration);

    if (currentConfiguration.configurations.some((existing) => existing.id === normalizedConfiguration.id)) {
      throw new Error(`A configuration with the id "${normalizedConfiguration.id}" already exists.`);
    }

    const nextConfiguration: TemplateConfiguration = {
      ...currentConfiguration,
      configurations: [...currentConfiguration.configurations, normalizedConfiguration],
      updatedAt: new Date().toISOString(),
    };

    await this.save(nextConfiguration);

    return normalizedConfiguration;
  }

  public async updateConfiguration(
    id: string,
    changes: Partial<TemplateRuleConfiguration>,
  ): Promise<TemplateRuleConfiguration> {
    const currentConfiguration = await this.load();
    const targetConfiguration = currentConfiguration.configurations.find((configuration) => configuration.id === id);

    if (!targetConfiguration) {
      throw new Error(`A configuration with the id "${id}" does not exist.`);
    }

    const updatedConfiguration: TemplateRuleConfiguration = {
      ...targetConfiguration,
      ...changes,
      id: targetConfiguration.id,
      filters: changes.filters ?? targetConfiguration.filters,
      templates: changes.templates ?? targetConfiguration.templates,
      updatedAt: new Date().toISOString(),
    };

    const nextConfiguration: TemplateConfiguration = {
      ...currentConfiguration,
      configurations: currentConfiguration.configurations.map((configuration) =>
        configuration.id === id ? updatedConfiguration : configuration,
      ),
      updatedAt: new Date().toISOString(),
    };

    await this.save(nextConfiguration);

    return updatedConfiguration;
  }

  public async deleteConfiguration(id: string): Promise<boolean> {
    const currentConfiguration = await this.load();
    const hasConfiguration = currentConfiguration.configurations.some((configuration) => configuration.id === id);

    if (!hasConfiguration) {
      return false;
    }

    const nextConfiguration: TemplateConfiguration = {
      ...currentConfiguration,
      configurations: currentConfiguration.configurations.filter((configuration) => configuration.id !== id),
      updatedAt: new Date().toISOString(),
    };

    await this.save(nextConfiguration);

    return true;
  }
}

export function createProjectTemplateStorage(
  dataService: ProjectCollectionDataService,
  projectId: string,
): ProjectTemplateStorageContract {
  return new AzureDevOpsProjectTemplateStorage(dataService, projectId);
}
