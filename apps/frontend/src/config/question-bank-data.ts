export interface QuestionBankItem {
  id: string;
  title: string;
  companyTags: ('Google' | 'Amazon' | 'Microsoft' | 'Meta' | 'Flipkart' | 'Swiggy' | 'Uber')[];
  topic: 'DSA & Algorithms' | 'System Design' | 'Java 21 Concurrency' | 'SQL & Databases' | 'LLD & Design Patterns';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  frequencyScore: number; // 1-100
  executionMode?: 'batch' | 'interactive';
  problemStatement: string;
  javaSolution: string;
  pythonSolution: string;
  systemDesignTips?: string[];
}

export const QUESTION_BANK_DATA: QuestionBankItem[] = [
  {
    id: 'qb_1',
    title: 'Design an LRU Cache with O(1) Time Complexity',
    companyTags: ['Amazon', 'Google', 'Microsoft'],
    topic: 'DSA & Algorithms',
    difficulty: 'Medium',
    frequencyScore: 98,
    problemStatement: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) Cache with get(key) and put(key, value) in O(1) time complexity.',
    javaSolution: `class LRUCache {
    private final int capacity;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    public int get(int key) {
        if (!map.containsKey(key)) return -1;
        Node node = map.get(key);
        remove(node);
        insert(node);
        return node.val;
    }

    public void put(int key, int value) {
        if (map.containsKey(key)) remove(map.get(key));
        if (map.size() == capacity) remove(tail.prev);
        insert(new Node(key, value));
    }

    private void remove(Node node) {
        map.remove(node.key);
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insert(Node node) {
        map.put(node.key, node);
        node.next = head.next;
        node.next.prev = node;
        head.next = node;
        node.prev = head;
    }

    static class Node {
        int key, val;
        Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }
}`,
    pythonSolution: `class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {} # key -> Node

    def get(self, key: int) -> int:
        if key in self.cache:
            self._move_to_front(key)
            return self.cache[key]
        return -1

    def put(self, key: int, value: int) -> None:
        self.cache[key] = value
        self.cache.move_to_end(key)`,
    systemDesignTips: [
        'Combine a Doubly Linked List with a Hash Map.',
        'Always update pointers atomically to prevent concurrency race conditions in multithreaded environments.'
    ]
  },
  {
    id: 'qb_2',
    title: 'High-Throughput Rate Limiter (Token Bucket Algorithm)',
    companyTags: ['Meta', 'Uber', 'Swiggy'],
    topic: 'System Design',
    difficulty: 'Hard',
    frequencyScore: 95,
    problemStatement: 'Architect an API Rate Limiter capable of processing 100k requests/sec using Redis and Lua script to implement Token Bucket algorithm without race conditions.',
    javaSolution: `@Service
public class TokenBucketRateLimiter {
    @Autowired
    private StringRedisTemplate redisTemplate;

    public boolean isAllowed(String apiKey, int maxTokens, int refillRatePerSec) {
        String luaScript = 
            "local key = KEYS[1] " +
            "local limit = tonumber(ARGV[1]) " +
            "local current = tonumber(redis.call('get', key) or '0') " +
            "if current + 1 > limit then return 0 else " +
            "redis.call('INCRBY', key, 1) " +
            "redis.call('EXPIRE', key, 1) return 1 end";
        Long result = redisTemplate.execute(
            new DefaultRedisScript<>(luaScript, Long.class),
            Collections.singletonList("rate:" + apiKey),
            String.valueOf(maxTokens)
        );
        return result != null && result == 1L;
    }
}`,
    pythonSolution: `import redis, time

r = redis.Redis(host='localhost', port=6379, db=0)

def is_allowed(user_id: str, limit: int = 100, window: int = 60) -> bool:
    current_time = int(time.time())
    key = f"rate:{user_id}:{current_time // window}"
    current_requests = r.incr(key)
    if current_requests == 1:
        r.expire(key, window)
    return current_requests <= limit`,
    systemDesignTips: [
        'Use Redis Lua scripts for atomic execution across distributed API gateways.',
        'Consider Sliding Window Counter if traffic spikes at boundary intervals.'
    ]
  },
  {
    id: 'qb_3',
    title: 'Java 21 Virtual Threads vs OS Threads Benchmark',
    companyTags: ['Amazon', 'Google', 'Flipkart'],
    topic: 'Java 21 Concurrency',
    difficulty: 'Medium',
    frequencyScore: 92,
    problemStatement: 'Write a benchmark program comparing thread creation overhead and memory consumption between Platform Threads and Java 21 Virtual Threads (Project Loom).',
    javaSolution: `public class VirtualThreadBenchmark {
    public static void main(String[] args) throws InterruptedException {
        long start = System.currentTimeMillis();
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            IntStream.range(0, 100_000).forEach(i -> {
                executor.submit(() -> {
                    Thread.sleep(1000); // Non-blocking unmount from carrier thread
                    return i;
                });
            });
        } // Auto-close waits for all 100k virtual threads
        long duration = System.currentTimeMillis() - start;
        System.out.println("Finished 100,000 tasks in: " + duration + " ms");
    }
}`,
    pythonSolution: `import asyncio, time

async def worker(i):
    await asyncio.sleep(1)
    return i

async font-mono main():
    start = time.time()
    tasks = [worker(i) for i in range(100_000)]
    await asyncio.gather(*tasks)
    print(f"Finished 100,000 async tasks in: {time.time() - start:.2f} s")

asyncio.run(main())`,
    systemDesignTips: [
        'Virtual threads unmount from Carrier Threads during blocking I/O (sockets, DB queries).',
        'Avoid synchronized blocks around blocking I/O to prevent thread pinning.'
    ]
  },
  {
    id: 'qb_4',
    title: 'SQL Window Functions: 2nd Highest Salary Per Department',
    companyTags: ['Microsoft', 'Amazon', 'Meta'],
    topic: 'SQL & Databases',
    difficulty: 'Easy',
    frequencyScore: 89,
    problemStatement: 'Write a SQL query using Window Functions (DENSE_RANK) to find the 2nd highest salary of employees in each department.',
    javaSolution: `-- SQL Query
WITH RankedSalaries AS (
    SELECT 
        emp_id,
        emp_name,
        dept_name,
        salary,
        DENSE_RANK() OVER (PARTITION BY dept_name ORDER BY salary DESC) as rnk
    FROM employees
)
SELECT emp_id, emp_name, dept_name, salary
FROM RankedSalaries
WHERE rnk = 2;`,
    pythonSolution: `import pandas as pd

df['rnk'] = df.groupby('dept_name')['salary'].rank(method='dense', ascending=False)
second_highest = df[df['rnk'] == 2][['emp_id', 'emp_name', 'dept_name', 'salary']]`,
    systemDesignTips: [
        'Use DENSE_RANK() instead of RANK() when salaries have duplicate ties.',
        'Ensure an index exists on (dept_name, salary DESC) for optimal query performance.'
    ]
  }
];
