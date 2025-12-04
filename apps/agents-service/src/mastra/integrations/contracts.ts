import type { Buffer } from 'node:buffer';

/**
 * Schedules workflows and tracks execution
 */
export interface WorkflowScheduler {
  triggerAssetUnwind(assetId: string, reason: string): Promise<string>;
  triggerValuationCycle(quarter: string, year: number): Promise<string>;
  triggerStressTest(
    scenarios: Array<{ name: string; parameters: Record<string, number> }>
  ): Promise<string>;
  triggerKYC(
    investorId: string,
    documents: Array<{ type: string; url: string }>
  ): Promise<string>;
  getWorkflowStatus(workflowId: string): Promise<{
    status: string;
    result?: unknown;
    error?: string;
  }>;
  signalWorkflow(workflowId: string, signalName: string, args?: unknown[]): Promise<void>;
}

/**
 * Provides document storage and retrieval
 */
export interface DocumentStorage {
  uploadDocument(
    key: string,
    content: Buffer | string,
    contentType?: string,
    metadata?: Record<string, string>
  ): Promise<string>;
  downloadDocument(key: string): Promise<Buffer>;
  uploadDuckDBSnapshot(snapshotId: string, dbPath: string): Promise<string>;
  listDocuments(prefix: string): Promise<string[]>;
  getPresignedUrl(key: string, expiresIn?: number): Promise<string>;
}

/**
 * Handles mem0 memory operations
 */
export interface MemoryStore {
  searchMemories(
    query: string,
    limit?: number,
    entityTypes?: string[]
  ): Promise<Array<{ content: string; score: number; metadata?: Record<string, unknown> }>>;
  storeMemory(content: string, entityIds?: string[], metadata?: Record<string, unknown>): Promise<string>;
  getAgentContext(
    agentName: string,
    query: string,
    includeMemories?: boolean,
    includeRAG?: boolean
  ): Promise<{
    memories: Array<{ content: string; score: number }>;
    documents?: Array<{ content: string; score: number }>;
  }>;
  storeAgentDecision(
    agentName: string,
    situation: string,
    action: string,
    outcome?: string,
    metadata?: Record<string, unknown>
  ): Promise<string>;
}

/**
 * Manages event subscriptions and routing
 */
export interface EventRouter {
  subscribeToEvents(
    callback: (payload: { eventType: string; new: Record<string, unknown>; old?: Record<string, unknown> }) => Promise<void>
  ): void;
  subscribeToAssets(
    callback: (payload: { eventType: string; new: Record<string, unknown>; old?: Record<string, unknown> }) => Promise<void>
  ): void;
  subscribeToFlows(
    callback: (payload: { eventType: string; new: Record<string, unknown>; old?: Record<string, unknown> }) => Promise<void>
  ): void;
  routeEventToAgent(eventType: string, payload: Record<string, unknown>): Promise<void>;
}

/**
 * Aggregated integrations exposed to agents
 */
export interface AgentIntegrations {
  workflowScheduler: WorkflowScheduler;
  documentStorage: DocumentStorage;
  memoryStore: MemoryStore;
  eventRouter: EventRouter;
}

