export interface CapstoneSpecification {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  passMark: number;
  requiredTechnologies: string[];
  mismatchedTechnologies?: { tech: string; reason: string }[];
  requiredComponents: string[];
  requiredFeatures: string[];
  mandatoryCategoryIds: string[];
  rubric: {
    id: string;
    name: string;
    category: string;
    maxScore: number;
    staticMax: number;
    runtimeMax: number;
    description: string;
  }[];
}

export const CAPSTONE_SPECIFICATIONS: Record<string, CapstoneSpecification> = {
  PAYMENT_ENGINE_001: {
    id: 'PAYMENT_ENGINE_001',
    title: 'High-Throughput Distributed Payment Engine',
    category: 'Backend Microservices',
    difficulty: 'Production Grade',
    passMark: 75,
    requiredTechnologies: [
      'Java 21 / 17',
      'Spring Boot 3',
      'MySQL / MariaDB',
      'Redis',
      'Docker / Docker Compose'
    ],
    mismatchedTechnologies: [
      { tech: 'PostgreSQL', reason: 'Capstone requires MySQL row-level locking semantics' },
      { tech: 'MongoDB', reason: 'Relational ACID persistence with row locks required' },
      { tech: 'Express/NodeJS', reason: 'Spring Boot Java enterprise backend required' }
    ],
    requiredComponents: [
      'Payment REST API Controller (/api/payments)',
      'Payment Business Processing Service',
      'Redis Distributed Lock Manager',
      'MySQL ACID Persistence & Row-Level Locking',
      'Idempotency Key Deduplication Filter/Aspect',
      'Global Exception Handler (@RestControllerAdvice)'
    ],
    requiredFeatures: [
      'Idempotent payment transaction processing (deduplicate duplicate keys)',
      'Concurrency safety (thread-safe operations under load)',
      'Distributed mutex locking using Redis',
      'Pessimistic row locking (SELECT FOR UPDATE / @Lock(PESSIMISTIC_WRITE))',
      'Comprehensive automated test suite'
    ],
    mandatoryCategoryIds: [
      'build_structure',
      'docker_config',
      'rest_apis',
      'payment_processing',
      'idempotency',
      'concurrency',
      'redis_locking',
      'mysql_locking'
    ],
    rubric: [
      { id: 'build_structure', name: 'Build & Project Structure', category: 'Build', maxScore: 10, staticMax: 5, runtimeMax: 5, description: 'Maven/Gradle build file, standard Java project layout, and compilation verification.' },
      { id: 'docker_config', name: 'Docker Containerization', category: 'DevOps', maxScore: 10, staticMax: 5, runtimeMax: 5, description: 'Dockerfile and valid multi-service docker-compose manifest.' },
      { id: 'rest_apis', name: 'Required Payment REST APIs', category: 'API', maxScore: 10, staticMax: 4, runtimeMax: 6, description: 'POST /api/payments, GET /api/payments/{id} endpoint mapping and request handling.' },
      { id: 'payment_processing', name: 'Payment Processing Logic', category: 'Business Logic', maxScore: 15, staticMax: 5, runtimeMax: 10, description: 'Domain payment service, gateway abstraction, and transaction state machine.' },
      { id: 'idempotency', name: 'Idempotency Key Handling', category: 'Reliability', maxScore: 10, staticMax: 3, runtimeMax: 7, description: 'Idempotency-Key header inspection and duplicate request prevention.' },
      { id: 'concurrency', name: 'Concurrency & Thread Safety', category: 'Performance', maxScore: 15, staticMax: 4, runtimeMax: 11, description: 'Thread safety, mutex synchronization, and high-concurrency burst handling.' },
      { id: 'redis_locking', name: 'Redis Distributed Locking', category: 'Distributed Systems', maxScore: 10, staticMax: 3, runtimeMax: 7, description: 'Redis distributed mutex lock acquisition, TTL, and contention resolution.' },
      { id: 'mysql_locking', name: 'MySQL Persistence & Row Locking', category: 'Database', maxScore: 10, staticMax: 3, runtimeMax: 7, description: 'Relational schema persistence and pessimistic row-level locking.' },
      { id: 'validation_error', name: 'Validation & Error Handling', category: 'Reliability', maxScore: 5, staticMax: 2, runtimeMax: 3, description: 'Global exception handler and input validation constraint checks.' },
      { id: 'tests_quality', name: 'Automated Tests & Quality', category: 'Testing', maxScore: 5, staticMax: 2, runtimeMax: 3, description: 'Automated test execution, test count, and domain test coverage.' }
    ]
  },
  AGENTIC_RAG_002: {
    id: 'AGENTIC_RAG_002',
    title: 'Agentic RAG Code Auditor & Docker Runner',
    category: 'Generative AI & LLMs',
    difficulty: 'Advanced AI',
    passMark: 75,
    requiredTechnologies: ['Python 3.11+', 'FastAPI', 'Vector DB', 'Docker Engine API', 'LLM Provider'],
    requiredComponents: ['RAG Pipeline', 'Vector Store Ingestion', 'Docker Runner API', 'Code Auditor Agent'],
    requiredFeatures: ['Multi-file repository AST parsing', 'Ephemeral container test execution', 'Auto-remediation'],
    mandatoryCategoryIds: ['build_structure', 'docker_config', 'rag_pipeline', 'testing_suite'],
    rubric: [
      { id: 'build_structure', name: 'Build & Project Structure', category: 'Build', maxScore: 20, staticMax: 10, runtimeMax: 10, description: 'Python virtualenv/requirements, pyproject.toml, standard package layout.' },
      { id: 'docker_config', name: 'Docker Containerization', category: 'DevOps', maxScore: 20, staticMax: 10, runtimeMax: 10, description: 'Container definitions for FastAPI agent and ephemeral Docker test sandbox.' },
      { id: 'rag_pipeline', name: 'Agentic RAG & Vector Engine', category: 'AI Architecture', maxScore: 35, staticMax: 15, runtimeMax: 20, description: 'Vector embeddings, chunking, retrieval augmentations, and LLM reasoning.' },
      { id: 'testing_suite', name: 'Automated Test Suite', category: 'Testing', maxScore: 25, staticMax: 10, runtimeMax: 15, description: 'Pytest test cases and agent execution benchmarks.' }
    ]
  },
  EVENT_STREAM_003: {
    id: 'EVENT_STREAM_003',
    title: 'Real-Time Event Stream & Analytics Pipeline',
    category: 'Distributed Systems',
    difficulty: 'Enterprise Scale',
    passMark: 75,
    requiredTechnologies: ['Apache Kafka', 'Java / Spring Cloud Stream / Python', 'Prometheus', 'Grafana', 'Docker'],
    requiredComponents: ['Kafka Producer Ingestion', 'Partitioned Consumer Groups', 'Dead Letter Queue', 'Prometheus Metrics'],
    requiredFeatures: ['50k events/sec burst handling', 'Partition rebalancing', 'DLQ retry policies', 'Telemetry dashboards'],
    mandatoryCategoryIds: ['build_structure', 'docker_config', 'stream_pipeline', 'testing_suite'],
    rubric: [
      { id: 'build_structure', name: 'Build & Project Structure', category: 'Build', maxScore: 20, staticMax: 10, runtimeMax: 10, description: 'Build configuration and modular streaming pipeline structure.' },
      { id: 'docker_config', name: 'Docker / Kafka Orchestration', category: 'DevOps', maxScore: 20, staticMax: 10, runtimeMax: 10, description: 'Docker compose topology for Kafka brokers, Zookeeper/KRaft, and workers.' },
      { id: 'stream_pipeline', name: 'Stream Processing & DLQ Resilience', category: 'Streaming', maxScore: 35, staticMax: 15, runtimeMax: 20, description: 'Consumer group partition handling, idempotency, and dead-letter retry logic.' },
      { id: 'testing_suite', name: 'Automated Test Suite', category: 'Testing', maxScore: 25, staticMax: 10, runtimeMax: 15, description: 'Integration tests for consumer lag, partition failovers, and throughput.' }
    ]
  }
};

export function getCapstoneSpec(titleOrId?: string): CapstoneSpecification {
  if (!titleOrId) return CAPSTONE_SPECIFICATIONS.PAYMENT_ENGINE_001;
  
  const query = titleOrId.toLowerCase();
  for (const key of Object.keys(CAPSTONE_SPECIFICATIONS)) {
    const spec = CAPSTONE_SPECIFICATIONS[key];
    if (spec.id.toLowerCase() === query || spec.title.toLowerCase() === query || query.includes(spec.id.toLowerCase())) {
      return spec;
    }
  }

  if (query.includes('payment')) return CAPSTONE_SPECIFICATIONS.PAYMENT_ENGINE_001;
  if (query.includes('rag') || query.includes('ai') || query.includes('auditor')) return CAPSTONE_SPECIFICATIONS.AGENTIC_RAG_002;
  if (query.includes('stream') || query.includes('kafka') || query.includes('event')) return CAPSTONE_SPECIFICATIONS.EVENT_STREAM_003;

  return CAPSTONE_SPECIFICATIONS.PAYMENT_ENGINE_001;
}
