import { vi } from 'vitest';
import { beforeEach, afterEach } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.MEM0_BASE_URL = 'https://api.mem0.test';
process.env.MEM0_API_KEY = 'test-mem0-key';
process.env.LANGFUSE_SECRET_KEY = 'test-langfuse-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.TEMPORAL_ADDRESS = 'localhost:7233';
process.env.TEMPORAL_NAMESPACE = 'test';
process.env.TEMPORAL_TASK_QUEUE = 'test-queue';

// Global test setup
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Cleanup after each test
  vi.restoreAllMocks();
});

