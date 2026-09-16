export interface Course {
  id: string;
  title: string;
  slug: string;
  category: 'java' | 'genai' | 'web';
  badge: string;
  duration: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  rating: number;
  enrolledStudents: number;
  highlights: string[];
  modules: {
    title: string;
    topics: string[];
  }[];
}

export interface AlumniCaseStudy {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  targetRole: string;
  hiringCompany: string;
  companyCategory: 'Fintech' | 'Enterprise GCC' | 'High-Growth Product' | 'SaaS';
  previousRole: string;
  previousCompany: string;
  previousSalary: string;
  newSalary: string;
  hikePercentage: string;
  timelineMonths: number;
  cohortTrack: string;
  capstoneProject: string;
  capstoneTech: string[];
  interviewFocus: string[];
  storyQuote: string;
  verifiedBatch: string;
  imageUrl?: string;
}

export interface CapstoneShowcase {
  id: string;
  title: string;
  subtitle: string;
  track: string;
  architectureHighlight: string;
  techStack: string[];
  metrics: string[];
  difficulty: 'Intermediate' | 'Advanced' | 'Enterprise Scale';
}

export interface TransparencyFAQ {
  question: string;
  answer: string;
  category: 'Placement' | 'Eligibility' | 'Mentorship' | 'Refund & Support';
}

export interface InternshipTrack {
  id: string;
  title: string;
  duration: string;
  stipend: string;
  capstoneProject: string;
  technologies: string[];
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface CohortGalleryItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  description: string;
  tag: string;
  icon: string;
  accentColor: string;
  details: string[];
  statNumber: string;
  statLabel: string;
  imageUrl?: string;
  highlightPill?: string;
  [key: string]: any;
}

export const SITE_DATA = {
  company: {
    name: 'Education Algorithm',
    tagline: 'Enterprise EdTech & Engineering Accelerator',
    description: 'Master modern software engineering, distributed system design, data science, and Generative AI with hands-on production practice.',
    supportEmail: 'support@educationalgorithm.com',
    supportPhone: '+91 98765 43210',
    address: 'Education Algorithm Tower, Tech Park, HSR Layout, Bengaluru, KA - 560102',
  },
  stats: {
    placementRate: '89.2%',
    placementRateSubtext: 'of students completing >=80% capstones placed within 180 days',
    activeEngineers: '12,500+',
    codeSubmissions: '1.2M+',
    medianPackage: '₹12.8 LPA',
    averagePackage: '₹14.2 LPA',
    highestPackage: '₹42.5 LPA',
    studentRating: '4.9 ★',
    averageHike: '148%',
  },
  salaryBands: [
    {
      tier: 'Freshers & Tier-3 Grads',
      experience: '0 - 1 Years',
      salaryRange: '₹5.5 - ₹10.5 LPA',
      medianCTC: '₹7.2 LPA',
      commonRoles: ['Associate Software Engineer', 'Junior Backend Developer', 'QA Automation Engineer'],
      colorScheme: 'from-blue-600 to-cyan-600',
    },
    {
      tier: 'Service-to-Product Switchers',
      experience: '1 - 3 Years',
      salaryRange: '₹9.0 - ₹18.0 LPA',
      medianCTC: '₹13.5 LPA',
      commonRoles: ['SDE-1 (Java/Spring Boot)', 'Full Stack Engineer', 'Cloud Microservices Dev'],
      colorScheme: 'from-indigo-600 to-purple-600',
    },
    {
      tier: 'Senior & Specialist Transitions',
      experience: '3 - 6 Years',
      salaryRange: '₹18.0 - ₹34.0 LPA',
      medianCTC: '₹22.5 LPA',
      commonRoles: ['SDE-2 (Distributed Systems)', 'AI/GenAI Engineer', 'DevOps & SRE Specialist'],
      colorScheme: 'from-emerald-600 to-teal-600',
    },
  ],
  hiringPartnerCategories: [
    {
      category: 'Fintech & Digital Banking',
      description: 'High-throughput transactional systems & secure payment gateways',
      partners: [
        { name: 'Razorpay', icon: 'fa-solid fa-credit-card' },
        { name: 'PhonePe', icon: 'fa-solid fa-mobile-screen-button' },
        { name: 'Pine Labs', icon: 'fa-solid fa-calculator' },
        { name: 'Groww', icon: 'fa-solid fa-chart-line' },
        { name: 'CRED', icon: 'fa-solid fa-shield-halved' },
      ],
    },
    {
      category: 'Enterprise GCCs & Global Tech Centers',
      description: 'Mission-critical distributed architectures & cloud infrastructure',
      partners: [
        { name: 'Cisco India', icon: 'fa-solid fa-network-wired' },
        { name: 'ServiceNow', icon: 'fa-solid fa-cloud' },
        { name: 'Bosch Global', icon: 'fa-solid fa-microchip' },
        { name: 'Target Tech India', icon: 'fa-solid fa-bullseye' },
        { name: 'Societe Generale', icon: 'fa-solid fa-building-columns' },
      ],
    },
    {
      category: 'High-Growth Product Companies & Startups',
      description: 'Rapidly scaling platforms, modern microservices & GenAI tooling',
      partners: [
        { name: 'Swiggy', icon: 'fa-solid fa-utensils' },
        { name: 'Meesho', icon: 'fa-solid fa-bag-shopping' },
        { name: 'Zepto', icon: 'fa-solid fa-bolt' },
        { name: 'Urban Company', icon: 'fa-solid fa-wrench' },
        { name: 'Postman', icon: 'fa-solid fa-paper-plane' },
      ],
    },
  ],
  alumniCaseStudies: [
    {
      id: 'cs_1',
      name: 'Rohan Sharma',
      initials: 'RS',
      avatarBg: 'from-indigo-600 to-blue-700',
      targetRole: 'SDE-2 (Backend)',
      hiringCompany: 'Cisco Systems',
      companyCategory: 'Enterprise GCC',
      previousRole: 'Systems Engineer',
      previousCompany: 'Infosys',
      previousSalary: '₹4.8 LPA',
      newSalary: '₹17.5 LPA',
      hikePercentage: '264%',
      timelineMonths: 5,
      cohortTrack: 'Java Full Stack & Distributed Systems',
      capstoneProject: 'Distributed Multi-Node Rate Limiter with Redis & Token Bucket Algorithm',
      capstoneTech: ['Java 21', 'Spring Boot 3', 'Redis Sentinel', 'Docker'],
      interviewFocus: ['Low-Level Design (LLD)', 'Concurrency & Thread Locks', 'Kafka Event Streaming'],
      storyQuote: 'I had 2.5 years of experience in maintenance projects with zero exposure to high-scale microservices. Building real concurrent lock engines and having mentors review my code line-by-line gave me the exact architecture confidence I needed.',
      verifiedBatch: 'Cohort Q4 2025 • Verified Offer Letter',
    },
    {
      id: 'cs_2',
      name: 'Priya Nair',
      initials: 'PN',
      avatarBg: 'from-purple-600 to-pink-600',
      targetRole: 'GenAI Solutions Engineer',
      hiringCompany: 'Pine Labs',
      companyCategory: 'Fintech',
      previousRole: 'Associate Software Engineer (QA)',
      previousCompany: 'Accenture',
      previousSalary: '₹4.2 LPA',
      newSalary: '₹14.0 LPA',
      hikePercentage: '233%',
      timelineMonths: 4,
      cohortTrack: 'Data Science, GenAI & Agentic Systems',
      capstoneProject: 'Autonomous Financial Document RAG & Compliance Verification Multi-Agent Pipeline',
      capstoneTech: ['Python 3.11', 'FastAPI', 'LangChain', 'ChromaDB', 'Gemini Flash'],
      interviewFocus: ['Vector Retrieval & Hybrid Search', 'Prompt Caching & LLM Evaluation', 'FastAPI Microservice APIs'],
      storyQuote: 'Transitioning from manual QA to GenAI seemed nearly impossible until I started building actual multi-agent systems with vector search. The mock interviews simulated real fintech machine coding tests perfectly.',
      verifiedBatch: 'Cohort Q1 2026 • Verified Offer Letter',
    },
    {
      id: 'cs_3',
      name: 'Aditya Verma',
      initials: 'AV',
      avatarBg: 'from-emerald-600 to-teal-700',
      targetRole: 'Backend Engineer - Payments',
      hiringCompany: 'Razorpay',
      companyCategory: 'Fintech',
      previousRole: 'Campus Fresher (Tier-3 B.Tech)',
      previousCompany: 'Off-Campus Candidate',
      previousSalary: '₹3.6 LPA',
      newSalary: '₹16.5 LPA',
      hikePercentage: '358%',
      timelineMonths: 6,
      cohortTrack: 'Java Full Stack & System Design',
      capstoneProject: 'Idempotent Payment Settlement Engine with Two-Phase Commit & Dead Letter Queues',
      capstoneTech: ['Java 21', 'Spring Security 6', 'Apache Kafka', 'PostgreSQL', 'Kubernetes'],
      interviewFocus: ['DSA & Dynamic Programming', 'Database Sharding & ACID Guarantees', 'Idempotency in REST APIs'],
      storyQuote: 'My college campus only had 3.5 LPA mass recruitment drives. Building an idempotent payment processing engine and deploying it on a live Kubernetes cluster set my resume apart from thousands of generic applicants.',
      verifiedBatch: 'Cohort Q3 2025 • Verified Offer Letter',
    },
    {
      id: 'cs_4',
      name: 'Ananya Deshmukh',
      initials: 'AD',
      avatarBg: 'from-amber-600 to-orange-700',
      targetRole: 'SRE / Cloud Infrastructure Engineer',
      hiringCompany: 'Swiggy',
      companyCategory: 'High-Growth Product',
      previousRole: 'IT Support Engineer',
      previousCompany: 'Cognizant',
      previousSalary: '₹5.5 LPA',
      newSalary: '₹18.0 LPA',
      hikePercentage: '227%',
      timelineMonths: 5,
      cohortTrack: 'DevOps, Kubernetes & Cloud Architecture',
      capstoneProject: 'GitOps Continuous Deployment Platform with ArgoCD, Helm & Prometheus Observability',
      capstoneTech: ['Kubernetes', 'Terraform', 'Prometheus & Grafana', 'GitHub Actions', 'AWS EKS'],
      interviewFocus: ['Linux Kernel & Networking', 'Zero-Downtime Blue/Green Deployments', 'Distributed Tracing with Jaeger'],
      storyQuote: 'I spent 3 years doing repetitive server tickets. This cohort taught me real Infrastructure as Code and cloud-native observability. During my Swiggy technical rounds, I live-debugged a Kubernetes crashloop backoff scenario flawlessly.',
      verifiedBatch: 'Cohort Q4 2025 • Verified Offer Letter',
    },
    {
      id: 'cs_5',
      name: 'Vikram Choudhury',
      initials: 'VC',
      avatarBg: 'from-cyan-600 to-blue-800',
      targetRole: 'Full Stack Engineer',
      hiringCompany: 'ServiceNow',
      companyCategory: 'SaaS',
      previousRole: 'Frontend Developer',
      previousCompany: 'Mid-sized IT Agency',
      previousSalary: '₹6.0 LPA',
      newSalary: '₹19.5 LPA',
      hikePercentage: '225%',
      timelineMonths: 5,
      cohortTrack: 'Java Full Stack & Modern Frontend',
      capstoneProject: 'Collaborative Real-Time Workspace Canvas with WebSockets, CRDTs & Spring WebFlux',
      capstoneTech: ['Next.js 14', 'Spring WebFlux', 'Redis Pub/Sub', 'PostgreSQL', 'Docker'],
      interviewFocus: ['Event-Driven Reactive Streams', 'State Management & Optimistic UI', 'System Scalability'],
      storyQuote: 'I only knew React UI and wanted to become a true Full-Stack engineer capable of writing high-throughput reactive Java backends. The curriculum bridged that backend gap completely.',
      verifiedBatch: 'Cohort Q1 2026 • Verified Offer Letter',
    },
    {
      id: 'cs_6',
      name: 'Neha Patel',
      initials: 'NP',
      avatarBg: 'from-rose-600 to-red-700',
      targetRole: 'Data Engineer / Analytics SDE',
      hiringCompany: 'Bosch Global Software',
      companyCategory: 'Enterprise GCC',
      previousRole: 'SQL Data Analyst',
      previousCompany: 'TCS',
      previousSalary: '₹4.5 LPA',
      newSalary: '₹13.5 LPA',
      hikePercentage: '200%',
      timelineMonths: 4,
      cohortTrack: 'Data Science, GenAI & Agentic Systems',
      capstoneProject: 'Real-Time IoT Telemetry Stream Ingestion Pipeline with Apache Spark & ClickHouse',
      capstoneTech: ['Python', 'Apache Spark', 'Kafka', 'ClickHouse', 'Docker'],
      interviewFocus: ['Stream Ingestion & Partitioning', 'Complex SQL & Indexing', 'Data Pipeline Fault Tolerance'],
      storyQuote: 'The jump from simple SQL dashboards to real streaming data engineering happened because I built and benchmarked a real ClickHouse telemetry pipeline handling 50k events/sec.',
      verifiedBatch: 'Cohort Q2 2025 • Verified Offer Letter',
    },
  ] as AlumniCaseStudy[],
  capstoneShowcases: [
    {
      id: 'cap_1',
      title: 'Distributed Rate Limiter & Token Bucket Engine',
      subtitle: 'Protects microservices against traffic spikes with sub-millisecond latency',
      track: 'Java Full Stack & Distributed Systems',
      architectureHighlight: 'Redis Sentinel clustering with Lua scripts for atomic token deductions and distributed lock synchronization.',
      techStack: ['Java 21', 'Spring Boot 3', 'Redis', 'Docker Compose', 'JMeter'],
      metrics: ['Sub-2ms response time', '50,000 requests/sec load tested', 'Zero race conditions'],
      difficulty: 'Advanced',
    },
    {
      id: 'cap_2',
      title: 'Autonomous Financial Multi-Agent RAG System',
      subtitle: 'Processes unstructured 200+ page SEC filings and balance sheets with verifiable citations',
      track: 'Data Science & GenAI Systems',
      architectureHighlight: 'Hybrid BM25 + dense vector embeddings with LangGraph cyclical agent validation loops.',
      techStack: ['Python 3.11', 'FastAPI', 'LangChain', 'ChromaDB', 'Gemini API'],
      metrics: ['98.4% retrieval accuracy', 'Automated source chunk citations', 'Sub-3s end-to-end response'],
      difficulty: 'Enterprise Scale',
    },
    {
      id: 'cap_3',
      title: 'Idempotent Payment Settlement & Event Reconciliation',
      subtitle: 'Handles duplicate webhook events, network partitions, and guaranteed ledger consistency',
      track: 'Java Full Stack & Microservices',
      architectureHighlight: 'Kafka transactional producer-consumer with optimistic locking and dead-letter retry queues.',
      techStack: ['Java 21', 'Spring Data JPA', 'PostgreSQL', 'Apache Kafka', 'Kubernetes'],
      metrics: ['100% ACID idempotency', 'Automatic dead-letter retries', 'Audited transaction ledger'],
      difficulty: 'Enterprise Scale',
    },
  ] as CapstoneShowcase[],
  transparencyFaqs: [
    {
      category: 'Placement',
      question: 'Do you offer a "100% Placement Guarantee"?',
      answer: 'No authentic tech academy can guarantee a job without you writing code and mastering problem-solving. What we guarantee is industry-standard curriculum, 1-on-1 code reviews from senior engineers, real-world portfolio capstones, and direct internal hiring referrals. Students who complete >=80% of our code challenges and mock interviews achieve an 89.2% placement rate within 180 days.',
    },
    {
      category: 'Eligibility',
      question: 'I am from a non-CS background, tier-3 college, or service company. Can I switch?',
      answer: 'Yes. Over 74% of our enrolled engineers come from IT service companies (Infosys, TCS, Wipro, Accenture) or non-CS degrees. Product companies evaluate proof-of-work: your GitHub microservices, concurrency understanding, and live problem solving—not your college pedigree.',
    },
    {
      category: 'Mentorship',
      question: 'How does 1-on-1 mentor guidance and doubt resolution work?',
      answer: 'Every student is assigned access to experienced SDE mentors. You have daily live doubt resolution windows, dedicated line-by-line pull request (PR) reviews on your capstone projects, and rigorous 1-on-1 mock interview drills (DSA, LLD Machine Coding, and System Design).',
    },
    {
      category: 'Refund & Support',
      question: 'What is your refund policy if the cohort is not suitable for me?',
      answer: 'We provide a 100% No-Questions-Asked 7-Day Money-Back Guarantee from the cohort start date. If you feel the curriculum or pace does not match your career goals, you receive a full refund promptly.',
    },
  ] as TransparencyFAQ[],
  internships: [
    {
      id: 'int_1',
      title: 'Java Microservices & Cloud Backend Internship',
      duration: '3 Months (Live Production Work)',
      stipend: '₹15,000 - ₹25,000 / month',
      capstoneProject: 'High-Throughput Real-Time Order Processing Engine with Kafka & Redis',
      technologies: ['Java 21', 'Spring Boot 3', 'Apache Kafka', 'PostgreSQL', 'Docker'],
    },
    {
      id: 'int_2',
      title: 'GenAI & Autonomous Agent Systems Internship',
      duration: '3 Months (Live Production Work)',
      stipend: '₹18,000 - ₹30,000 / month',
      capstoneProject: 'Enterprise Document Intelligence & RAG Retrieval Microservice',
      technologies: ['Python', 'FastAPI', 'LangChain', 'ChromaDB', 'Gemini Flash'],
    },
    {
      id: 'int_3',
      title: 'Cloud DevOps & Site Reliability Engineering Internship',
      duration: '3 Months (Live Production Work)',
      stipend: '₹15,000 - ₹25,000 / month',
      capstoneProject: 'Automated Multi-Cluster Kubernetes Deployment with Prometheus Tracing',
      technologies: ['Kubernetes', 'Terraform', 'Prometheus', 'Grafana', 'GitHub Actions'],
    },
  ] as InternshipTrack[],
  faqs: [
    {
      question: 'How are the cohorts structured?',
      answer: 'Each cohort is a 4-6 month intensive program featuring live weekend architecture lectures, daily hands-on coding challenges in real Docker sandboxes, 1-on-1 mentor code reviews, and direct interview preparation.',
    },
    {
      question: 'Do I get access to real-time coding sandboxes?',
      answer: 'Yes, Education Algorithm features an integrated Code Arena with automated test cases, real-time Docker container execution, and instant complexity feedback.',
    },
    {
      question: 'What is the refund guarantee?',
      answer: 'We offer a 100% money-back guarantee within 7 days of cohort kickoff if you find the pace or format unsuitable.',
    },
    {
      question: 'How does the hiring portal and referral network work?',
      answer: 'Graduates receive exclusive access to internal talent drives and direct employee referrals across 780+ active engineering openings at verified partner companies.',
    },
  ] as FAQItem[],
  courses: [
    {
      id: 'crs_1',
      title: 'Java Full Stack & System Design Masterclass',
      slug: 'java-fullstack-system-design',
      category: 'java',
      badge: 'Flagship Cohort',
      duration: '6 Months',
      description: 'Master Java 21 Core, Spring Boot 3, Microservices Architecture, Distributed Systems, System Design (LLD & HLD), Kafka, Redis, and DevOps Deployment.',
      originalPrice: 49999,
      discountedPrice: 24999,
      rating: 4.9,
      enrolledStudents: 6800,
      highlights: [
        '120+ Hours of High-Definition Live & Recorded Video Lessons',
        'Real-Time Automated Code Sandbox & Test Case Evaluation',
        'Live 1-on-1 Mentor Doubts Resolution & Code Reviews',
        '10 Real-World Enterprise Microservice Capstone Projects'
      ],
      modules: [
        {
          title: 'Module 1: Java 21 Core, Concurrency & OOP Fundamentals',
          topics: [
            'JVM Internal Memory Layout, Garbage Collection & ClassLoaders',
            'Multithreading, Virtual Threads (Project Loom) & Executor Service',
            'Generics, Collections Framework, Functional Programming & Stream API',
            'Data Structures & Algorithms in Java (Arrays, Trees, Graphs, DP)'
          ]
        },
        {
          title: 'Module 2: Spring Boot 3 & Enterprise Microservices Architecture',
          topics: [
            'RESTful Web Services, Spring Data JPA & Hibernate ORM',
            'Spring Security 6 with OAuth2, JWT Authentication & RBAC',
            'Microservices Communication (Feign Clients, RestTemplate, WebClient)',
            'Event-Driven Architecture with Apache Kafka & RabbitMQ Messaging'
          ]
        },
        {
          title: 'Module 3: System Design, Scalability & Low-Level Design (LLD)',
          topics: [
            'Gang of Four Design Patterns (Factory, Builder, Singleton, Observer)',
            'Database Sharding, Replication, Indexing & Query Optimization',
            'Distributed Caching Strategies with Redis & Memcached',
            'High Availability, Load Balancing, API Gateways & Rate Limiting'
          ]
        },
        {
          title: 'Module 4: Cloud Deployment, DevOps & CI/CD Pipelines',
          topics: [
            'Containerization with Docker & Multi-stage Dockerfiles',
            'Orchestration with Kubernetes (Pods, Services, Deployments, Helm)',
            'CI/CD Automation with GitHub Actions & Jenkins Pipelines',
            'Monitoring & Observability (Prometheus, Grafana, Jaeger Tracing)'
          ]
        }
      ]
    },
    {
      id: 'crs_2',
      title: 'Data Science, GenAI & Agentic Systems',
      slug: 'datascience-genai-agentic-systems',
      category: 'genai',
      badge: 'New Release',
      duration: '5 Months',
      description: 'Master Python, Data Science, Neural Networks, Retrieval-Augmented Generation (RAG), Vector DBs, LangChain, AutoGen, and AI Agent Architectures.',
      originalPrice: 59999,
      discountedPrice: 29999,
      rating: 4.95,
      enrolledStudents: 4200,
      highlights: [
        'Hands-on LLM Fine-Tuning & Vector DBs (Chroma / Pinecone)',
        'Production Retrieval-Augmented Generation (RAG) Architecture',
        '5 Production Capstone AI Agentic Systems',
        'Google Gemini API & LangChain Agent Orchestration'
      ],
      modules: [
        {
          title: 'Module 1: Python Data Science & Machine Learning Foundations',
          topics: [
            'NumPy, Pandas & Matplotlib Data Wrangling & Feature Engineering',
            'Scikit-Learn Supervised & Unsupervised Learning Algorithms',
            'Statistical Analysis, Hypothesis Testing & Model Evaluation Metrics'
          ]
        },
        {
          title: 'Module 2: Deep Learning & PyTorch Neural Networks',
          topics: [
            'Artificial Neural Networks (ANN), Backpropagation & Gradient Descent',
            'Convolutional Neural Networks (CNN) for Computer Vision',
            'Recurrent Neural Networks (RNN/LSTM) & Transformer Architectures'
          ]
        },
        {
          title: 'Module 3: Generative AI & Enterprise RAG Architectures',
          topics: [
            'Vector Embeddings & Semantic Similarity Search',
            'Vector Databases (Pinecone, ChromaDB, Weaviate)',
            'Retrieval Augmented Generation (RAG) & Chunking Strategies',
            'Prompt Engineering, Output Parsers & LangChain Framework'
          ]
        },
        {
          title: 'Module 4: Autonomous Multi-Agent AI Systems & Fine-Tuning',
          topics: [
            'Building Multi-Agent Workflows with AutoGen & LangGraph',
            'PEFT, LoRA & QLoRA Fine-Tuning of Open-Source LLMs (Llama 3/Mistral)',
            'Deploying AI Microservices with FastAPI, Docker & Cloud GPUs'
          ]
        }
      ]
    }
  ] as Course[],
  hiringPartners: [
    { name: 'Razorpay', logo: 'fa-solid fa-credit-card' },
    { name: 'PhonePe', logo: 'fa-solid fa-mobile-screen-button' },
    { name: 'Cisco Systems', logo: 'fa-solid fa-network-wired' },
    { name: 'ServiceNow', logo: 'fa-solid fa-cloud' },
    { name: 'Swiggy', logo: 'fa-solid fa-utensils' },
    { name: 'Bosch Global', logo: 'fa-solid fa-microchip' },
  ],
  testimonials: [
    {
      id: 't_1',
      name: 'Rohan Sharma',
      role: 'SDE-2',
      company: 'Cisco Systems',
      previousCompany: 'Infosys (Systems Engineer)',
      cohortTrack: 'Java Full Stack & System Design Masterclass',
      initials: 'RS',
      rating: 5,
      content: 'The System Design & Java 21 Microservices cohort completely transformed my engineering capabilities. Building distributed systems capstones with Kafka and Redis gave me immense confidence during system design rounds!',
      salaryIncrease: '264% Hike (4.8 LPA ➔ 17.5 LPA)'
    },
    {
      id: 't_2',
      name: 'Priya Nair',
      role: 'AI / ML Engineer',
      company: 'Pine Labs',
      previousCompany: 'Accenture (QA Engineer)',
      cohortTrack: 'Data Science, GenAI & Agentic Systems',
      initials: 'PN',
      rating: 5,
      content: 'The GenAI & Agentic Systems track is the most practical curriculum available. Building production RAG pipelines, vector searches with ChromaDB, and multi-agent workflows directly helped me clear product interview loops.',
      salaryIncrease: '233% Hike (4.2 LPA ➔ 14.0 LPA)'
    },
    {
      id: 't_3',
      name: 'Aditya Verma',
      role: 'Backend Engineer - Payments',
      company: 'Razorpay',
      previousCompany: 'Tier-3 Campus Placement Offer',
      cohortTrack: 'Java Full Stack & Distributed Systems',
      initials: 'AV',
      rating: 5,
      content: 'Coming from a tier-3 college with a 3.6 LPA campus offer, Education Algorithm was a life-changer. The 1-on-1 mentor code reviews and real-time Docker sandbox helped me master concurrency and lock-free data structures to crack Razorpay.',
      salaryIncrease: '358% Hike (3.6 LPA ➔ 16.5 LPA)'
    },
    {
      id: 't_4',
      name: 'Ananya Deshmukh',
      role: 'SRE / Cloud Infrastructure',
      company: 'Swiggy',
      previousCompany: 'Cognizant (IT Support)',
      cohortTrack: 'DevOps, Kubernetes & Cloud Architecture',
      initials: 'AD',
      rating: 5,
      content: 'I was stuck in infrastructure maintenance for 3 years. The deep-dive modules into Kubernetes networking, Helm charts, and Prometheus observability gave me the exact hands-on architecture skills needed for Swiggy production scale.',
      salaryIncrease: '227% Hike (5.5 LPA ➔ 18.0 LPA)'
    },
  ],
};
