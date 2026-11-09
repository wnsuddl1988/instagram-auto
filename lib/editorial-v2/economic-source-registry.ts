import registryData from "./economic-source-registry-data.json";
import type { EvidenceKind } from "./editorial-cutline";

export const SOURCE_REGISTRY_VERSION = "1.0.0";

export type PublisherTier = "T1" | "T2" | "T3";

export type ConnectorStatus = "implemented" | "planned" | "blocked";

export type PublisherEntry = {
  name: string;
  domains: readonly string[];
};

export type ConnectorEntry = {
  id: string;
  label: string;
  publisherName: string | null;
  evidenceKind: EvidenceKind;
  envKeys: readonly string[];
  status: ConnectorStatus;
  blockedReason?: string;
  approvedAt?: string;
};

export type TopicDomainEntry = {
  id: string;
  label: string;
  enabled: boolean;
  blockedReason?: string;
  newsKeywords: readonly string[];
  connectors: readonly string[];
};

export type SourceRegistry = {
  version: string;
  publishers: Record<"T1" | "T2", readonly PublisherEntry[]>;
  connectors: readonly ConnectorEntry[];
  topicDomains: readonly TopicDomainEntry[];
  properNounDictionary: {
    programs: readonly string[];
    institutions: readonly string[];
  };
};

export class SourceRegistryError extends Error {
  constructor(message: string) {
    super(`economic source registry invalid: ${message}`);
    this.name = "SourceRegistryError";
  }
}

const EVIDENCE_KINDS: readonly EvidenceKind[] = [
  "news",
  "statistic",
  "policy",
  "background",
];

const CONNECTOR_STATUSES: readonly ConnectorStatus[] = [
  "implemented",
  "planned",
  "blocked",
];

function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new SourceRegistryError(`${field} must be a non-empty string`);
  }
  return value;
}

function requireStringArray(value: unknown, field: string, allowEmpty = false): string[] {
  if (!Array.isArray(value)) {
    throw new SourceRegistryError(`${field} must be an array`);
  }
  if (!allowEmpty && value.length === 0) {
    throw new SourceRegistryError(`${field} must not be empty`);
  }
  return value.map((entry, index) =>
    requireNonEmptyString(entry, `${field}[${index}]`),
  );
}

function parsePublishers(value: unknown, tier: "T1" | "T2"): PublisherEntry[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new SourceRegistryError(`publishers.${tier} must be a non-empty array`);
  }
  return value.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new SourceRegistryError(`publishers.${tier}[${index}] must be an object`);
    }
    const e = entry as Record<string, unknown>;
    return {
      name: requireNonEmptyString(e.name, `publishers.${tier}[${index}].name`),
      domains: requireStringArray(e.domains, `publishers.${tier}[${index}].domains`),
    };
  });
}

/**
 * Fails closed: unknown connector ids, duplicate ids, or a malformed entry throw
 * rather than degrading into a registry that silently trusts fewer sources.
 */
export function parseSourceRegistry(raw: unknown): SourceRegistry {
  if (typeof raw !== "object" || raw === null) {
    throw new SourceRegistryError("root must be an object");
  }
  const root = raw as Record<string, unknown>;

  if (root.version !== SOURCE_REGISTRY_VERSION) {
    throw new SourceRegistryError(
      `version mismatch: expected ${SOURCE_REGISTRY_VERSION}, got ${String(root.version)}`,
    );
  }

  const publishersRaw = root.publishers;
  if (typeof publishersRaw !== "object" || publishersRaw === null) {
    throw new SourceRegistryError("publishers must be an object");
  }
  const pub = publishersRaw as Record<string, unknown>;
  const publishers = {
    T1: parsePublishers(pub.T1, "T1"),
    T2: parsePublishers(pub.T2, "T2"),
  };

  const seenDomains = new Map<string, string>();
  for (const tier of ["T1", "T2"] as const) {
    for (const entry of publishers[tier]) {
      for (const domain of entry.domains) {
        const existing = seenDomains.get(domain);
        if (existing) {
          throw new SourceRegistryError(
            `domain ${domain} is claimed by both ${existing} and ${entry.name}`,
          );
        }
        seenDomains.set(domain, entry.name);
      }
    }
  }

  if (!Array.isArray(root.connectors) || root.connectors.length === 0) {
    throw new SourceRegistryError("connectors must be a non-empty array");
  }
  const publisherNames = new Set(
    [...publishers.T1, ...publishers.T2].map((entry) => entry.name),
  );
  const connectorIds = new Set<string>();
  const connectors = root.connectors.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new SourceRegistryError(`connectors[${index}] must be an object`);
    }
    const e = entry as Record<string, unknown>;
    const id = requireNonEmptyString(e.id, `connectors[${index}].id`);
    if (connectorIds.has(id)) {
      throw new SourceRegistryError(`duplicate connector id: ${id}`);
    }
    connectorIds.add(id);

    const evidenceKind = requireNonEmptyString(
      e.evidenceKind,
      `connectors[${index}].evidenceKind`,
    );
    if (!EVIDENCE_KINDS.includes(evidenceKind as EvidenceKind)) {
      throw new SourceRegistryError(
        `connectors[${index}].evidenceKind unknown: ${evidenceKind}`,
      );
    }

    const status = requireNonEmptyString(e.status, `connectors[${index}].status`);
    if (!CONNECTOR_STATUSES.includes(status as ConnectorStatus)) {
      throw new SourceRegistryError(`connectors[${index}].status unknown: ${status}`);
    }
    if (status === "blocked") {
      requireNonEmptyString(e.blockedReason, `connectors[${index}].blockedReason`);
    }

    let publisherName: string | null = null;
    if (e.publisherName !== null && e.publisherName !== undefined) {
      publisherName = requireNonEmptyString(
        e.publisherName,
        `connectors[${index}].publisherName`,
      );
      if (!publisherNames.has(publisherName)) {
        throw new SourceRegistryError(
          `connectors[${index}].publisherName not in publishers: ${publisherName}`,
        );
      }
    }

    return {
      id,
      label: requireNonEmptyString(e.label, `connectors[${index}].label`),
      publisherName,
      evidenceKind: evidenceKind as EvidenceKind,
      envKeys: requireStringArray(e.envKeys, `connectors[${index}].envKeys`, true),
      status: status as ConnectorStatus,
      ...(typeof e.blockedReason === "string"
        ? { blockedReason: e.blockedReason }
        : {}),
      ...(typeof e.approvedAt === "string" ? { approvedAt: e.approvedAt } : {}),
    };
  });

  if (!Array.isArray(root.topicDomains) || root.topicDomains.length === 0) {
    throw new SourceRegistryError("topicDomains must be a non-empty array");
  }
  const domainIds = new Set<string>();
  const topicDomains = root.topicDomains.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new SourceRegistryError(`topicDomains[${index}] must be an object`);
    }
    const e = entry as Record<string, unknown>;
    const id = requireNonEmptyString(e.id, `topicDomains[${index}].id`);
    if (domainIds.has(id)) {
      throw new SourceRegistryError(`duplicate topic domain id: ${id}`);
    }
    domainIds.add(id);

    if (typeof e.enabled !== "boolean") {
      throw new SourceRegistryError(`topicDomains[${index}].enabled must be a boolean`);
    }
    if (!e.enabled) {
      requireNonEmptyString(e.blockedReason, `topicDomains[${index}].blockedReason`);
    }

    const domainConnectors = requireStringArray(
      e.connectors,
      `topicDomains[${index}].connectors`,
    );
    for (const connectorId of domainConnectors) {
      if (!connectorIds.has(connectorId)) {
        throw new SourceRegistryError(
          `topicDomains[${index}] references unknown connector: ${connectorId}`,
        );
      }
    }

    return {
      id,
      label: requireNonEmptyString(e.label, `topicDomains[${index}].label`),
      enabled: e.enabled,
      ...(typeof e.blockedReason === "string"
        ? { blockedReason: e.blockedReason }
        : {}),
      newsKeywords: requireStringArray(
        e.newsKeywords,
        `topicDomains[${index}].newsKeywords`,
      ),
      connectors: domainConnectors,
    };
  });

  const dictRaw = root.properNounDictionary;
  if (typeof dictRaw !== "object" || dictRaw === null) {
    throw new SourceRegistryError("properNounDictionary must be an object");
  }
  const dict = dictRaw as Record<string, unknown>;
  const properNounDictionary = {
    programs: requireStringArray(dict.programs, "properNounDictionary.programs"),
    institutions: requireStringArray(
      dict.institutions,
      "properNounDictionary.institutions",
    ),
  };

  return {
    version: root.version,
    publishers,
    connectors,
    topicDomains,
    properNounDictionary,
  };
}

export function loadSourceRegistry(): SourceRegistry {
  return parseSourceRegistry(registryData);
}

function normalizeHost(rawUrl: string): string | null {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return null;
  }
}

/**
 * Whitelist lookup: anything not registered is T3, which the cutline treats as
 * unusable as evidence. A malformed URL is also T3 rather than an error.
 */
export function resolvePublisherTier(
  registry: SourceRegistry,
  url: string,
): { tier: PublisherTier; publisherName: string | null } {
  const host = normalizeHost(url);
  if (!host) return { tier: "T3", publisherName: null };

  for (const tier of ["T1", "T2"] as const) {
    for (const entry of registry.publishers[tier]) {
      const matched = entry.domains.some(
        (domain) => host === domain || host.endsWith(`.${domain}`),
      );
      if (matched) return { tier, publisherName: entry.name };
    }
  }
  return { tier: "T3", publisherName: null };
}

export function findProperNouns(registry: SourceRegistry, text: string): string[] {
  const { programs, institutions } = registry.properNounDictionary;
  return [...programs, ...institutions].filter((term) => text.includes(term));
}

export function getEnabledTopicDomains(
  registry: SourceRegistry,
): readonly TopicDomainEntry[] {
  return registry.topicDomains.filter((domain) => domain.enabled);
}

export function getTopicDomain(
  registry: SourceRegistry,
  id: string,
): TopicDomainEntry | null {
  return registry.topicDomains.find((domain) => domain.id === id) ?? null;
}

export function getConnector(
  registry: SourceRegistry,
  id: string,
): ConnectorEntry | null {
  return registry.connectors.find((connector) => connector.id === id) ?? null;
}
