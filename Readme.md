# Resilient Email Service

A robust Node.js-based email service designed with  patterns including retry logic, circuit breakers, rate limiting, idempotency, and provider fallback mechanisms.

## Features

- **Queue System**: Accepts email requests via API and stores them in an in-memory queue
- **Automatic Processing**: Sends emails from the queue every 10 seconds
- **Retry Logic**: Implements exponential backoff for failed email attempts
- **Provider Fallback**: Automatically switches between multiple email providers
- **Circuit Breaker**: Prevents cascading failures by temporarily disabling unstable providers
- **Rate Limiting**: Controls email sending rate to prevent overwhelming providers
- **Idempotency**: Prevents duplicate email sending using request deduplication




##Installation

1. Clone the repository:

git clone https://github.com/nishant21saini/emailDeliverySystem.git
cd resilient-email-service
```

2. Install dependencies:
npm install


##  Quick Start

### Running the Service

Start the email service server:
node index.js


The service will be available at `http://localhost:3006`

### Running Unit Tests

Execute the test suite with hardcoded data:

node unit.js


## API Endpoints

### Send Email
Send an email request to the queue.

**POST** `/send-email`

**Request Body:**
json
{
  "to": "user@example.com",
  "subject": "Hello",
  "body": "Welcome to the service!"
}


**Response:**
json
{
  "success": true,
  "emailId": "string",
  "status": "queued",
  "message": "Email queued for delivery"
}
```

### Get All Results
Retrieve all email delivery results.

**GET** `/results`

**Response:**
json
[
  {
     "email": "user1@example.com",
        "status": "Sent Successfully",
        "messageId": "Provider1_1749269746974_0.pd6pop5m62",
        "provider": "Provider1"
  },
  {
     "email": "user2@example.com",
        "status": "Sent Successfully",
        "messageId": "Provider1_1749269749976_0.ajx3fgcxkh",
        "provider": "Provider1"
  }
]
```







```

##  Architecture

### Core Components

#### EmailService.js
Main service  with the following key methods:
- `sendEmail(email)`: Queues email for delivery
- `tryAllProviders(email, emailId)`: Attempts delivery across all providers
- `tryProviderWithRetries(provider, emailId, email)`: Handles retries for a specific provider
- `sendWithProvider(provider, emailId, email)`: Executes actual email sending
- `getEmailStatus(emailId)`: Retrieves email delivery status

#### RateLimiter.js
Controls request rate to prevent overwhelming email providers:
- `maxRequests`: Maximum emails allowed in the time window (default: 10)
- `timeWindow`: Time period in milliseconds (default: 60000ms)
- `canMakeRequest()`: Checks if request is within rate limits
- `recordRequest()`: Logs timestamp for rate limit tracking

#### CircuitBreaker.js
Implements circuit breaker pattern for fault tolerance:
- `threshold`: Number of failures before opening circuit (default: 3)
- `timeout`: Cooldown period before retrying (default: 30000ms)
- **States**: CLOSED (normal), OPEN (failing fast), HALF_OPEN (testing)
- `execute(fn)`: Wraps function calls with failure protection
- `getState()`: Returns current circuit breaker state

#### ServiceProvider.js
Simulates email service providers:
- `name`: Provider identifier
- `successRate`: Probability of successful delivery (0-1)
- `latency`: Simulated network delay in milliseconds
- `deliverEmail(email)`: Attempts email delivery with configured behavior

## ⚙️ Configuration

### Default Settings
- **Queue Processing**: Every 10 seconds
- **Rate Limit**: 10 emails per minute
- **Circuit Breaker**: 3 failures trigger, 30-second timeout
- **Max Retries**: 3 attempts per email
- **Providers**: 3 simulated providers with different characteristics

### Customization
Modify configuration in the EmailService constructor:

```javascript
// Custom rate limiter: 20 emails per 2 minutes
this.rateLimiter = new RateLimiter(20, 120000);

// Custom circuit breaker: 5 failures, 60-second timeout
this.circuitBreakers.set(provider.name, new CircuitBreaker(5, 60000));
```

##  Resilience Patterns

### Retry Logic
- Exponential backoff: 2^attempt * 1000ms
- Maximum 3 attempts per email
- Failed emails are requeued automatically

### Circuit Breaker
- Prevents cascading failures
- Automatically recovers after cooldown period
- Per-provider isolation

### Provider Fallback
- Multiple provider support
- Automatic failover on provider failure
- Load distribution across healthy providers

### Rate Limiting
- Sliding window rate limiting
- Prevents provider overload
- Configurable limits per time window

### Idempotency
- Prevents duplicate email sending
- Based on email content hash
- Automatic deduplication


## Testing

### Unit Tests
The service includes comprehensive unit tests covering:
- Email validation and formatting
- Rate limiting functionality
- Circuit breaker state management
- Idempotency checking
- Provider fallback logic
- Queue processing mechanics

Run tests:
```bash
node unit.js
```


## Production Considerations

### Performance
- Consider using Redis for queue persistence
- Implement database storage for email results
- Add metrics collection (Prometheus/Grafana)
- Implement health checks for load balancers

### Security
- Add authentication/authorization
- Implement request signing
- Add rate limiting per user/IP
- Validate and sanitize all inputs

### Scalability
- Implement horizontal scaling
- Add message queue (Redis/RabbitMQ)
- Consider microservices architecture
- Implement caching layers

### Monitoring
- Add application performance monitoring
- Implement alerting for failures
- Track business metrics
- Monitor resource usage
