# 🔧 技术文档 / Technical Documentation

[中文](#中文技术文档) | [English](#english-technical-documentation)

---

## 中文技术文档

### 🏗️ 系统设计理念

#### 设计原则
1. **单一职责原则**: 每个类和模块只负责一个功能
2. **开闭原则**: 对扩展开放，对修改关闭
3. **依赖倒置原则**: 依赖抽象而不是具体实现
4. **接口隔离原则**: 使用多个专门的接口，而不是单一的总接口

#### 架构模式
- **MVC模式**: Model-View-Controller分层架构
- **Repository模式**: 数据访问层抽象
- **Service模式**: 业务逻辑封装
- **DTO模式**: 数据传输对象

### 🔐 安全架构设计

#### JWT认证流程
\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant AuthService
    participant JwtProvider
    participant Database
    
    Client->>Controller: POST /api/auth/login
    Controller->>AuthService: authenticate(credentials)
    AuthService->>Database: findByUsername()
    Database-->>AuthService: User entity
    AuthService->>AuthService: validatePassword()
    AuthService->>JwtProvider: generateToken(user)
    JwtProvider-->>AuthService: JWT token
    AuthService-->>Controller: AuthResponse
    Controller-->>Client: JWT token + user info
\`\`\`

#### 安全配置
\`\`\`java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
\`\`\`

### 📊 数据库设计

#### 核心实体关系图
\`\`\`
User (用户)
├── UserGoal (用户目标) [1:N]
├── DailyLog (日志记录) [1:N]
├── MenstrualCycle (生理周期) [1:N]
├── CommunityPost (社区帖子) [1:N]
└── UserFollow (用户关注) [1:N]

Food (食物)
├── NutritionInfo (营养信息) [1:1]
├── PortionReference (份量参考) [1:N]
└── DailyLog (日志记录) [1:N]

CommunityPost (社区帖子)
├── PostComment (评论) [1:N]
└── User (作者) [N:1]
\`\`\`

#### 关键表结构
\`\`\`sql
-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- 食物表
CREATE TABLE foods (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    barcode VARCHAR(50),
    external_id VARCHAR(100),
    source ENUM('INTERNAL', 'OPENFOODFACTS', 'USDA') DEFAULT 'INTERNAL',
    nutrition_per_100g JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_barcode (barcode),
    INDEX idx_external_id (external_id, source)
);

-- 日志记录表
CREATE TABLE daily_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    food_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    meal_type ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, log_date),
    INDEX idx_food_id (food_id)
);
\`\`\`

### 🚀 性能优化策略

#### 缓存策略
\`\`\`java
@Service
public class FoodService {
    
    // L1缓存：本地缓存，快速访问
    @Cacheable(value = "foods", key = "#foodId")
    public Food getFoodById(Long foodId) {
        return foodRepository.findById(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found"));
    }
    
    // L2缓存：Redis分布式缓存
    @Cacheable(value = "external_foods", key = "#query", unless = "#result.isEmpty()")
    public List<ExternalFoodResult> searchExternalFoods(String query) {
        return compositeExternalFoodService.searchFoods(query);
    }
}
\`\`\`

#### 数据库优化
1. **索引策略**
   - 主键索引：所有表的id字段
   - 唯一索引：username, email, barcode
   - 复合索引：(user_id, log_date), (external_id, source)
   - 全文索引：食物名称搜索

2. **查询优化**
   \`\`\`java
   // 使用JPA Specification进行动态查询
   public Page<DailyLog> findUserLogs(Long userId, LocalDate startDate, 
                                      LocalDate endDate, Pageable pageable) {
       Specification<DailyLog> spec = Specification.where(null);
       
       spec = spec.and((root, query, cb) -> 
           cb.equal(root.get("user").get("id"), userId));
       
       if (startDate != null) {
           spec = spec.and((root, query, cb) -> 
               cb.greaterThanOrEqualTo(root.get("logDate"), startDate));
       }
       
       if (endDate != null) {
           spec = spec.and((root, query, cb) -> 
               cb.lessThanOrEqualTo(root.get("logDate"), endDate));
       }
       
       return dailyLogRepository.findAll(spec, pageable);
   }
   \`\`\`

### 🔄 外部API集成架构

#### 抽象工厂模式
\`\`\`java
public abstract class AbstractExternalFoodService {
    protected final WebClient webClient;
    protected final ApiRateLimiter rateLimiter;
    
    public abstract List<ExternalFoodResult> searchFoods(String query);
    public abstract Optional<ExternalFoodResult> getFoodDetails(String externalId);
    public abstract String getServiceName();
    public abstract int getPriority();
}

@Service
public class OpenFoodFactsService extends AbstractExternalFoodService {
    
    @Override
    public List<ExternalFoodResult> searchFoods(String query) {
        if (!rateLimiter.isAllowed(getServiceName(), 100, Duration.ofHours(1))) {
            throw new RateLimitExceededException("Rate limit exceeded for " + getServiceName());
        }
        
        return webClient.get()
                .uri("/search.json?search_terms={query}&json=true", query)
                .retrieve()
                .bodyToMono(OpenFoodFactsResponse.class)
                .map(this::convertToExternalFoodResults)
                .block();
    }
}
\`\`\`

#### 组合服务模式
\`\`\`java
@Service
public class CompositeExternalFoodService {
    private final List<AbstractExternalFoodService> services;
    
    public CompositeExternalFoodService(List<AbstractExternalFoodService> services) {
        this.services = services.stream()
                .sorted(Comparator.comparing(AbstractExternalFoodService::getPriority))
                .collect(Collectors.toList());
    }
    
    public List<ExternalFoodResult> searchFoods(String query) {
        List<ExternalFoodResult> allResults = new ArrayList<>();
        
        for (AbstractExternalFoodService service : services) {
            try {
                List<ExternalFoodResult> results = service.searchFoods(query);
                allResults.addAll(results);
                
                if (allResults.size() >= 20) { // 限制结果数量
                    break;
                }
            } catch (Exception e) {
                log.warn("Failed to search foods from {}: {}", 
                        service.getServiceName(), e.getMessage());
            }
        }
        
        return allResults.stream()
                .distinct()
                .limit(20)
                .collect(Collectors.toList());
    }
}
\`\`\`

### 🎯 限流算法实现

#### Token Bucket算法
\`\`\`java
@Component
public class TokenBucket {
    private final long capacity;
    private final long refillRate;
    private long tokens;
    private long lastRefillTime;
    
    public TokenBucket(long capacity, long refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefillTime = System.currentTimeMillis();
    }
    
    public synchronized boolean tryConsume(long tokensRequested) {
        refill();
        
        if (tokens >= tokensRequested) {
            tokens -= tokensRequested;
            return true;
        }
        
        return false;
    }
    
    private void refill() {
        long now = System.currentTimeMillis();
        long tokensToAdd = ((now - lastRefillTime) / 1000) * refillRate;
        
        tokens = Math.min(capacity, tokens + tokensToAdd);
        lastRefillTime = now;
    }
}
\`\`\`

### 📱 前端架构设计

#### 组件层次结构
\`\`\`
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Content
├── Pages
│   ├── Dashboard
│   ├── FoodLog
│   ├── Trends
│   ├── Menstrual
│   ├── Community
│   └── Profile
├── Components
│   ├── FoodSearch
│   ├── NutritionChart
│   ├── CycleCalendar
│   └── PostCard
└── Services
    ├── authService
    ├── foodService
    ├── userService
    └── apiClient
\`\`\`

#### 状态管理策略
\`\`\`typescript
// API客户端配置
class ApiClient {
    private axiosInstance: AxiosInstance;
    
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8081/api',
            timeout: 10000,
        });
        
        this.setupInterceptors();
    }
    
    private setupInterceptors() {
        // 请求拦截器：添加认证头
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = authService.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
        
        // 响应拦截器：处理认证错误
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    authService.logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }
}
\`\`\`

### 🐳 容器化架构

#### 多阶段构建策略
\`\`\`dockerfile
# 后端多阶段构建
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup appuser
COPY --from=build /app/target/*.jar app.jar
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
\`\`\`

#### Docker Compose服务编排
\`\`\`yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: nutrition_tracker
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    networks:
      - nutrition-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
    networks:
      - nutrition-network

  backend:
    build: ./nutrition tracker
    environment:
      SPRING_PROFILES_ACTIVE: docker
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/nutrition_tracker
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - nutrition-network

  frontend:
    build: ./nutrition-tracker-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - nutrition-network
\`\`\`

---

## English Technical Documentation

### 🏗️ System Design Philosophy

#### Design Principles
1. **Single Responsibility Principle**: Each class and module is responsible for only one functionality
2. **Open-Closed Principle**: Open for extension, closed for modification
3. **Dependency Inversion Principle**: Depend on abstractions, not concretions
4. **Interface Segregation Principle**: Use multiple specialized interfaces rather than a single general interface

#### Architectural Patterns
- **MVC Pattern**: Model-View-Controller layered architecture
- **Repository Pattern**: Data access layer abstraction
- **Service Pattern**: Business logic encapsulation
- **DTO Pattern**: Data Transfer Objects

### 🔐 Security Architecture Design

#### JWT Authentication Flow
\`\`\`mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant AuthService
    participant JwtProvider
    participant Database
    
    Client->>Controller: POST /api/auth/login
    Controller->>AuthService: authenticate(credentials)
    AuthService->>Database: findByUsername()
    Database-->>AuthService: User entity
    AuthService->>AuthService: validatePassword()
    AuthService->>JwtProvider: generateToken(user)
    JwtProvider-->>AuthService: JWT token
    AuthService-->>Controller: AuthResponse
    Controller-->>Client: JWT token + user info
\`\`\`

#### Security Configuration
\`\`\`java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors().and()
            .csrf().disable()
            .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests(authz -> authz
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/health").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
\`\`\`

### 📊 Database Design

#### Core Entity Relationship Diagram
\`\`\`
User
├── UserGoal [1:N]
├── DailyLog [1:N]
├── MenstrualCycle [1:N]
├── CommunityPost [1:N]
└── UserFollow [1:N]

Food
├── NutritionInfo [1:1]
├── PortionReference [1:N]
└── DailyLog [1:N]

CommunityPost
├── PostComment [1:N]
└── User (Author) [N:1]
\`\`\`

#### Key Table Structures
\`\`\`sql
-- Users table
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    profile_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
);

-- Foods table
CREATE TABLE foods (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    barcode VARCHAR(50),
    external_id VARCHAR(100),
    source ENUM('INTERNAL', 'OPENFOODFACTS', 'USDA') DEFAULT 'INTERNAL',
    nutrition_per_100g JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_barcode (barcode),
    INDEX idx_external_id (external_id, source)
);

-- Daily logs table
CREATE TABLE daily_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    food_id BIGINT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    meal_type ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, log_date),
    INDEX idx_food_id (food_id)
);
\`\`\`

### 🚀 Performance Optimization Strategies

#### Caching Strategy
\`\`\`java
@Service
public class FoodService {
    
    // L1 Cache: Local cache for fast access
    @Cacheable(value = "foods", key = "#foodId")
    public Food getFoodById(Long foodId) {
        return foodRepository.findById(foodId)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found"));
    }
    
    // L2 Cache: Redis distributed cache
    @Cacheable(value = "external_foods", key = "#query", unless = "#result.isEmpty()")
    public List<ExternalFoodResult> searchExternalFoods(String query) {
        return compositeExternalFoodService.searchFoods(query);
    }
}
\`\`\`

#### Database Optimization
1. **Index Strategy**
   - Primary indexes: id fields in all tables
   - Unique indexes: username, email, barcode
   - Composite indexes: (user_id, log_date), (external_id, source)
   - Full-text indexes: food name search

2. **Query Optimization**
   \`\`\`java
   // Dynamic queries using JPA Specification
   public Page<DailyLog> findUserLogs(Long userId, LocalDate startDate, 
                                      LocalDate endDate, Pageable pageable) {
       Specification<DailyLog> spec = Specification.where(null);
       
       spec = spec.and((root, query, cb) -> 
           cb.equal(root.get("user").get("id"), userId));
       
       if (startDate != null) {
           spec = spec.and((root, query, cb) -> 
               cb.greaterThanOrEqualTo(root.get("logDate"), startDate));
       }
       
       if (endDate != null) {
           spec = spec.and((root, query, cb) -> 
               cb.lessThanOrEqualTo(root.get("logDate"), endDate));
       }
       
       return dailyLogRepository.findAll(spec, pageable);
   }
   \`\`\`

### 🔄 External API Integration Architecture

#### Abstract Factory Pattern
\`\`\`java
public abstract class AbstractExternalFoodService {
    protected final WebClient webClient;
    protected final ApiRateLimiter rateLimiter;
    
    public abstract List<ExternalFoodResult> searchFoods(String query);
    public abstract Optional<ExternalFoodResult> getFoodDetails(String externalId);
    public abstract String getServiceName();
    public abstract int getPriority();
}

@Service
public class OpenFoodFactsService extends AbstractExternalFoodService {
    
    @Override
    public List<ExternalFoodResult> searchFoods(String query) {
        if (!rateLimiter.isAllowed(getServiceName(), 100, Duration.ofHours(1))) {
            throw new RateLimitExceededException("Rate limit exceeded for " + getServiceName());
        }
        
        return webClient.get()
                .uri("/search.json?search_terms={query}&json=true", query)
                .retrieve()
                .bodyToMono(OpenFoodFactsResponse.class)
                .map(this::convertToExternalFoodResults)
                .block();
    }
}
\`\`\`

#### Composite Service Pattern
\`\`\`java
@Service
public class CompositeExternalFoodService {
    private final List<AbstractExternalFoodService> services;
    
    public CompositeExternalFoodService(List<AbstractExternalFoodService> services) {
        this.services = services.stream()
                .sorted(Comparator.comparing(AbstractExternalFoodService::getPriority))
                .collect(Collectors.toList());
    }
    
    public List<ExternalFoodResult> searchFoods(String query) {
        List<ExternalFoodResult> allResults = new ArrayList<>();
        
        for (AbstractExternalFoodService service : services) {
            try {
                List<ExternalFoodResult> results = service.searchFoods(query);
                allResults.addAll(results);
                
                if (allResults.size() >= 20) { // Limit result count
                    break;
                }
            } catch (Exception e) {
                log.warn("Failed to search foods from {}: {}", 
                        service.getServiceName(), e.getMessage());
            }
        }
        
        return allResults.stream()
                .distinct()
                .limit(20)
                .collect(Collectors.toList());
    }
}
\`\`\`

### 🎯 Rate Limiting Algorithm Implementation

#### Token Bucket Algorithm
\`\`\`java
@Component
public class TokenBucket {
    private final long capacity;
    private final long refillRate;
    private long tokens;
    private long lastRefillTime;
    
    public TokenBucket(long capacity, long refillRate) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.tokens = capacity;
        this.lastRefillTime = System.currentTimeMillis();
    }
    
    public synchronized boolean tryConsume(long tokensRequested) {
        refill();
        
        if (tokens >= tokensRequested) {
            tokens -= tokensRequested;
            return true;
        }
        
        return false;
    }
    
    private void refill() {
        long now = System.currentTimeMillis();
        long tokensToAdd = ((now - lastRefillTime) / 1000) * refillRate;
        
        tokens = Math.min(capacity, tokens + tokensToAdd);
        lastRefillTime = now;
    }
}
\`\`\`

### 📱 Frontend Architecture Design

#### Component Hierarchy
\`\`\`
App
├── Layout
│   ├── Header
│   ├── Sidebar
│   └── Content
├── Pages
│   ├── Dashboard
│   ├── FoodLog
│   ├── Trends
│   ├── Menstrual
│   ├── Community
│   └── Profile
├── Components
│   ├── FoodSearch
│   ├── NutritionChart
│   ├── CycleCalendar
│   └── PostCard
└── Services
    ├── authService
    ├── foodService
    ├── userService
    └── apiClient
\`\`\`

#### State Management Strategy
\`\`\`typescript
// API client configuration
class ApiClient {
    private axiosInstance: AxiosInstance;
    
    constructor() {
        this.axiosInstance = axios.create({
            baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8081/api',
            timeout: 10000,
        });
        
        this.setupInterceptors();
    }
    
    private setupInterceptors() {
        // Request interceptor: Add auth headers
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = authService.getToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );
        
        // Response interceptor: Handle auth errors
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    authService.logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }
}
\`\`\`

### 🐳 Containerization Architecture

#### Multi-stage Build Strategy
\`\`\`dockerfile
# Backend multi-stage build
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd -g 1001 appgroup && \
    useradd -u 1001 -g appgroup appuser
COPY --from=build /app/target/*.jar app.jar
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
\`\`\`

#### Docker Compose Service Orchestration
\`\`\`yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: nutrition_tracker
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    networks:
      - nutrition-network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
    networks:
      - nutrition-network

  backend:
    build: ./nutrition tracker
    environment:
      SPRING_PROFILES_ACTIVE: docker
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/nutrition_tracker
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - nutrition-network

  frontend:
    build: ./nutrition-tracker-frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - nutrition-network
\`\`\`

### 🔍 监控和日志 / Monitoring and Logging

#### 应用监控配置 / Application Monitoring Configuration
\`\`\`java
@Configuration
public class MonitoringConfig {
    
    @Bean
    public MeterRegistry meterRegistry() {
        return new PrometheusMeterRegistry(PrometheusConfig.DEFAULT);
    }
    
    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }
}

// 在服务方法上添加监控
@Service
public class FoodService {
    
    @Timed(name = "food.search", description = "Time taken to search foods")
    public List<Food> searchFoods(String query) {
        // Implementation
    }
}
\`\`\`

#### 结构化日志 / Structured Logging
\`\`\`xml
<!-- logback-spring.xml -->
<configuration>
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LoggingEventCompositeJsonEncoder">
            <providers>
                <timestamp/>
                <logLevel/>
                <loggerName/>
                <message/>
                <mdc/>
                <arguments/>
                <stackTrace/>
            </providers>
        </encoder>
    </appender>
    
    <root level="INFO">
        <appender-ref ref="STDOUT"/>
    </root>
</configuration>
\`\`\`

### 📈 性能指标 / Performance Metrics

#### 关键性能指标 / Key Performance Indicators
- **响应时间 / Response Time**: < 200ms (95th percentile)
- **吞吐量 / Throughput**: > 1000 requests/second
- **可用性 / Availability**: > 99.9%
- **错误率 / Error Rate**: < 0.1%

#### 缓存命中率 / Cache Hit Rates
- **Redis缓存 / Redis Cache**: > 80%
- **数据库查询缓存 / Database Query Cache**: > 70%
- **外部API缓存 / External API Cache**: > 90%

---

## 🚀 部署和运维 / Deployment and Operations

### 生产环境配置 / Production Configuration
\`\`\`yaml
# docker-compose.prod.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

  backend:
    build: ./nutrition tracker
    environment:
      SPRING_PROFILES_ACTIVE: prod
      JAVA_OPTS: "-Xmx2g -Xms1g"
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
\`\`\`

### 健康检查和监控 / Health Checks and Monitoring
\`\`\`java
@RestController
@RequestMapping("/api/health")
public class HealthController {
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private RedisTemplate<String, String> redisTemplate;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> health = new HashMap<>();
        health.put("status", "UP");
        health.put("timestamp", Instant.now());
        
        // Database health check
        try {
            dataSource.getConnection().close();
            health.put("database", "UP");
        } catch (Exception e) {
            health.put("database", "DOWN");
            health.put("status", "DOWN");
        }
        
        // Redis health check
        try {
            redisTemplate.opsForValue().get("health-check");
            health.put("redis", "UP");
        } catch (Exception e) {
            health.put("redis", "DOWN");
            health.put("status", "DOWN");
        }
        
        return ResponseEntity.ok(health);
    }
}
\`\`\`
