export interface JobListingItem {
  id: string;
  companyName: string;
  companyLogo: string;
  roleTitle: string;
  domain: 'Java & Cloud' | 'Data Science & AI' | 'DevOps & SRE' | 'Full Stack & Core';
  location: string;
  workMode: 'Remote' | 'Hybrid' | 'Onsite';
  salaryRange: string;
  experienceLevel: '0-2 YOE' | '1-3 YOE' | '2-5 YOE' | '4-8 YOE' | string;
  techStack: string[];
  referralAvailable: boolean;
  applyUrl: string;
  postedDate: string;
  description: string;
  requirements: string[];
  mentorName?: string;
  mentorRole?: string;
  source?: string;
}

export const JOBS_DATA: JobListingItem[] = [
  {
    id: 'job_1',
    companyName: 'Amazon Web Services (AWS)',
    companyLogo: 'fa-brands fa-aws',
    roleTitle: 'Software Development Engineer II (SDE 2) - Distributed Systems',
    domain: 'Java & Cloud',
    location: 'Bengaluru / Hybrid',
    workMode: 'Hybrid',
    salaryRange: '₹34 - ₹48 LPA',
    experienceLevel: '2-5 YOE',
    techStack: ['Java 21', 'Spring Boot', 'AWS DynamoDB', 'Kafka', 'Microservices'],
    referralAvailable: true,
    applyUrl: 'https://amazon.jobs',
    postedDate: '1 day ago',
    description: 'Design and build massive scale event-driven backend systems powering AWS cloud infrastructure with 99.999% availability SLAs.',
    requirements: [
      'Strong proficiency in core Java (Java 17/21) & Spring Boot microservices.',
      'Experience with distributed datastores, concurrency, and message brokers (Kafka/SQS).',
      'Solid foundations in system design, CAP theorem, and low-latency API architecture.'
    ],
    mentorName: 'Siddharth Rao',
    mentorRole: 'Senior SDE @ AWS Core Services'
  },
  {
    id: 'job_2',
    companyName: 'Google Cloud Platform',
    companyLogo: 'fa-brands fa-google',
    roleTitle: 'Senior Systems Engineer - AI Infrastructure & RAG Engines',
    domain: 'Data Science & AI',
    location: 'Bengaluru / Remote',
    workMode: 'Remote',
    salaryRange: '₹42 - ₹65 LPA',
    experienceLevel: '4-8 YOE',
    techStack: ['Python 3.12', 'PyTorch', 'Gemini API', 'Kubernetes', 'Vector DB'],
    referralAvailable: true,
    applyUrl: 'https://careers.google.com',
    postedDate: '2 days ago',
    description: 'Architect scalable GenAI vector retrieval engines and semantic search pipelines handling millions of real-time QPS.',
    requirements: [
      'Hands-on expertise in PyTorch, LangChain, vector indexing, and embedding models.',
      'Experience optimizing LLM inference latency and token context pipelines.',
      'Proficiency in distributed training and scalable GPU serving on Kubernetes.'
    ],
    mentorName: 'Ananya Sharma',
    mentorRole: 'Staff AI Engineer @ Google Cloud'
  },
  {
    id: 'job_3',
    companyName: 'Flipkart Scaleup Engine',
    companyLogo: 'fa-solid fa-cart-shopping',
    roleTitle: 'Backend Microservices Engineer - Payments & Checkout',
    domain: 'Java & Cloud',
    location: 'Bengaluru',
    workMode: 'Hybrid',
    salaryRange: '₹22 - ₹32 LPA',
    experienceLevel: '1-3 YOE',
    techStack: ['Java 21', 'Spring Boot 3', 'Redis', 'MySQL Sharding', 'Docker'],
    referralAvailable: true,
    applyUrl: 'https://flipkartcareers.com',
    postedDate: '3 days ago',
    description: 'Build fault-tolerant checkout state machines and high-throughput payment transaction routers during Big Billion Days flash sales.',
    requirements: [
      'Deep understanding of transactional integrity, 2PC, idempotency, and saga patterns.',
      'Proficiency in Java multi-threading, Redis distributed caching, and MySQL query tuning.',
      'Demonstrated experience building RESTful and gRPC microservices.'
    ],
    mentorName: 'Rohit Kulkarni',
    mentorRole: 'Engineering Lead @ Flipkart Payments'
  },
  {
    id: 'job_4',
    companyName: 'Swiggy Tech Labs',
    companyLogo: 'fa-solid fa-utensils',
    roleTitle: 'SDE 1 - High Throughput Order Dispatch Engine',
    domain: 'Full Stack & Core',
    location: 'Remote (India)',
    workMode: 'Remote',
    salaryRange: '₹18 - ₹26 LPA',
    experienceLevel: '0-2 YOE',
    techStack: ['Java', 'Kafka', 'Go', 'Docker', 'PostgreSQL'],
    referralAvailable: true,
    applyUrl: 'https://careers.swiggy.com',
    postedDate: 'Just now',
    description: 'Join the logistics brain team responsible for dynamic spatial batching and automated order-to-delivery partner assignment algorithms.',
    requirements: [
      'Strong algorithmic problem-solving skills (Data Structures & Algorithms).',
      'Experience with backend programming in Java, Go, or Node.js.',
      'Familiarity with Docker containerization and relational database querying.'
    ],
    mentorName: 'Varun Nair',
    mentorRole: 'Senior SDE @ Swiggy Logistics'
  },
  {
    id: 'job_5',
    companyName: 'Microsoft Azure Core',
    companyLogo: 'fa-brands fa-microsoft',
    roleTitle: 'Software Engineer - Distributed Storage & Resilience',
    domain: 'Java & Cloud',
    location: 'Hyderabad / Hybrid',
    workMode: 'Hybrid',
    salaryRange: '₹28 - ₹42 LPA',
    experienceLevel: '2-5 YOE',
    techStack: ['C++', 'Java', 'Azure Kubernetes', 'Distributed Systems', 'Linux'],
    referralAvailable: false,
    applyUrl: 'https://careers.microsoft.com',
    postedDate: '4 days ago',
    description: 'Develop resilient block and blob storage replication primitives across global Azure data centers.',
    requirements: [
      'Experience in systems programming with C++ or Java.',
      'Solid grasp of OS internals, memory management, and network I/O multiplexing (epoll/kqueue).',
      'Knowledge of cloud native container orchestration.'
    ]
  },
  {
    id: 'job_6',
    companyName: 'Atlassian Platform',
    companyLogo: 'fa-brands fa-atlassian',
    roleTitle: 'Site Reliability & Multi-Cloud Infrastructure Engineer',
    domain: 'DevOps & SRE',
    location: 'Bengaluru / Remote',
    workMode: 'Remote',
    salaryRange: '₹32 - ₹46 LPA',
    experienceLevel: '2-5 YOE',
    techStack: ['Terraform', 'Kubernetes', 'AWS', 'Prometheus', 'CI/CD Pipelines'],
    referralAvailable: true,
    applyUrl: 'https://www.atlassian.com/company/careers',
    postedDate: '5 days ago',
    description: 'Automate multi-region AWS/GCP infrastructure provisioning with Terraform and maintain high-fidelity observability pipelines.',
    requirements: [
      'Hands-on expertise in Infrastructure as Code (Terraform) and Kubernetes cluster operations.',
      'Experience building automated GitOps CI/CD deployment pipelines (GitHub Actions/ArgoCD).',
      'Proficiency in Linux system administration and site reliability engineering (SRE) practices.'
    ],
    mentorName: 'Sneha Patel',
    mentorRole: 'Lead SRE @ Atlassian Core'
  },
  {
    id: 'job_7',
    companyName: 'Uber Tech Mobility',
    companyLogo: 'fa-brands fa-uber',
    roleTitle: 'Machine Learning Engineer - Demand Forecasting & Dynamic Pricing',
    domain: 'Data Science & AI',
    location: 'Hyderabad / Hybrid',
    workMode: 'Hybrid',
    salaryRange: '₹36 - ₹52 LPA',
    experienceLevel: '2-5 YOE',
    techStack: ['Python', 'XGBoost', 'TensorFlow', 'Spark', 'MLOps', 'Kafka'],
    referralAvailable: true,
    applyUrl: 'https://www.uber.com/careers',
    postedDate: '2 days ago',
    description: 'Build and deploy real-time marketplace demand forecasting models processing billions of geospatial telemetry events.',
    requirements: [
      'Strong background in statistical modeling, time-series forecasting, and machine learning.',
      'Experience scaling feature stores and real-time inference pipelines with Apache Spark/Flink.',
      'Proficiency in Python data science ecosystems (NumPy, Pandas, Scikit-learn, PyTorch).'
    ],
    mentorName: 'Karthik Menon',
    mentorRole: 'Senior Staff MLE @ Uber Marketplace'
  },
  {
    id: 'job_8',
    companyName: 'Stripe Payments',
    companyLogo: 'fa-brands fa-stripe',
    roleTitle: 'Cloud Infrastructure & Platform Security Engineer',
    domain: 'DevOps & SRE',
    location: 'Bengaluru / Remote',
    workMode: 'Remote',
    salaryRange: '₹40 - ₹60 LPA',
    experienceLevel: '4-8 YOE',
    techStack: ['AWS', 'Kubernetes', 'Ansible', 'Terraform', 'Go', 'Zero Trust TLS'],
    referralAvailable: true,
    applyUrl: 'https://stripe.com/jobs',
    postedDate: '3 days ago',
    description: 'Harden payment gateway boundary infrastructure and enforce zero-trust network segregation across multi-region Kubernetes clusters.',
    requirements: [
      'Deep expertise in cloud security architecture, KMS encryption, and IAM policy automation.',
      'Proficiency in Go, Terraform, and automated security vulnerability scanning in CI/CD.',
      'Experience managing critical high-compliance financial infrastructure.'
    ],
    mentorName: 'Aditya Sen',
    mentorRole: 'Principal Cloud Architect @ Stripe'
  },
  {
    id: 'job_9',
    companyName: 'Zomato Blinkit',
    companyLogo: 'fa-solid fa-bolt',
    roleTitle: 'Associate Software Engineer (Graduate / Entry Level)',
    domain: 'Full Stack & Core',
    location: 'Gurugram / Onsite',
    workMode: 'Onsite',
    salaryRange: '₹14 - ₹20 LPA',
    experienceLevel: '0-2 YOE',
    techStack: ['Java', 'Spring Boot', 'React.js', 'PostgreSQL', 'Docker'],
    referralAvailable: true,
    applyUrl: 'https://www.zomato.com/careers',
    postedDate: 'Just now',
    description: 'Fast-paced 10-minute grocery delivery dispatch backend development with instant inventory reconciliation.',
    requirements: [
      'Proficiency in object-oriented programming (Java/C++) and web basics (React/TypeScript).',
      'Strong understanding of relational SQL databases and API design.',
      'Enthusiastic problem solver with passion for high-scale retail tech.'
    ],
    mentorName: 'Deepak Joshi',
    mentorRole: 'Engineering Manager @ Blinkit Tech'
  },
  {
    id: 'job_10',
    companyName: 'Adobe Creative Cloud',
    companyLogo: 'fa-brands fa-adobe',
    roleTitle: 'Full Stack Engineer - Collaboration & Cloud Documents',
    domain: 'Full Stack & Core',
    location: 'Noida / Hybrid',
    workMode: 'Hybrid',
    salaryRange: '₹24 - ₹36 LPA',
    experienceLevel: '1-3 YOE',
    techStack: ['TypeScript', 'Node.js', 'React', 'WebSockets', 'GraphQL', 'AWS'],
    referralAvailable: true,
    applyUrl: 'https://adobe.wd5.myworkdayjobs.com',
    postedDate: '6 days ago',
    description: 'Power real-time multi-user canvas collaboration and cloud document synchronization across web and desktop apps.',
    requirements: [
      'Strong skills in modern TypeScript, React, and asynchronous state synchronization (CRDTs/OT).',
      'Experience with WebSockets, GraphQL, and serverless cloud architectures on AWS.',
      'Focus on UI performance, sub-50ms latency, and seamless UX.'
    ],
    mentorName: 'Pooja Hegde',
    mentorRole: 'Senior SDE @ Adobe Collaboration'
  }
];
