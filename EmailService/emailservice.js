import { ServiceProvider } from '../ServiceProvider/serviceprovide.js';
import { RateLimiter } from '../Features/rateLimiter.js';
import { CircuitBreaker } from '../Features/circuitBreaker.js';

export class EmailService {

  constructor(config = {}) {
    this.config = {
      maxtry: config.maxtry || 3,
      startingDelay: config.startingDelay || 1000,
      maximumDelay: config.maximumDelay || 10000,
      maximumRequest: config.maximumRequest || 100,
      timeWindow: config.timeWindow || 60000,
      circuitThresholdValue: config.circuitThresholdValue || 5,
      circuitTimeoutValue: config.circuitTimeoutValue || 60000,
    };

    this.Providers = [
      new ServiceProvider('Provider1', 0.7, 3000),//service provider 1
    
      new ServiceProvider('Provider2', 0.8, 2000),//service provider 2
    ];

    this.rateLimiter = new RateLimiter(
      this.config.maximumRequest,
      this.config.timeWindow
    );

    this.circuitBreakers = new Map();

    this.Providers.forEach((provider) => {
      this.circuitBreakers.set(
        provider.name,
        new CircuitBreaker(this.config.circuitThresholdValue, this.config.circuitTimeoutValue)
      );
    });

    this.sentEmails = new Map(); // idempotency if email already sent
    this.emailStatus = new Map(); // for status checking if email is pending or sent
  }

  getEmailStatus(emailId) {
    return this.emailStatus.get(emailId) || null;
  }

  async sendEmail(email) {
    
    const generateEmailId = (email) => {
       return `${email.to}-${email.subject}-${email.body}`;
    }

    const emailId = generateEmailId(email);

    // Check if email already sent (idempotency)
    if (this.sentEmails.has(emailId) || this.emailStatus.has(emailId)) {
      return {
        exist: 1,
        emailId: emailId
      };
    }

    if (!this.rateLimiter.canRequest()) {
      throw new Error('Rate Limit Exceeded');
    }
  ///just set current state of email in emailStatus
    this.emailStatus.set(emailId, {
      status: 'pending',
      attempts: 0,
      errors: [],
      startTime: Date.now(),
    });

    try {
      this.rateLimiter.recordRequest();

      const result = await this.tryallProviders(email, emailId);
      

      // Add emailId to the result
      result.emailId = emailId;
      
      this.sentEmails.set(emailId, result);

      this.emailStatus.set(emailId, {
        ...this.emailStatus.get(emailId),
        status: 'sent',
        result,
        endTime: Date.now(),
      });

      return result;
    } catch (error) {
      this.emailStatus.set(emailId, {
        ...this.emailStatus.get(emailId),
        status: 'failed',
        finalError: error.message,
        endTime: Date.now(),
      });

      throw error;
    }
  }

  async tryallProviders(email, emailId) {
    let lastError;

    for (const provider of this.Providers) {

        //ciruitBreaker of given service provider 
      const circuitBreaker = this.circuitBreakers.get(provider.name);
      
      // if circuit Breaker is in open we can't procceed with this provider 
      if (circuitBreaker.getState().state === 'OPEN') {
        continue;
      }

      try {
        const result = await this.tryProviderWithRetries(provider, emailId, email);
        return result;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error('All email providers failed');
  }

  async tryProviderWithRetries(provider, emailId, email) {
    let attempt = 0;
    let delay = this.config.startingDelay;// start with 1sec delay 
    const maxtry = this.config.maxtry;// number of times we try to send the email using this provider 

    while (attempt <= maxtry) {
      try {
        const status = this.emailStatus.get(emailId);
        if (status) {
          status.attempts = attempt + 1;
        }

        const result = await this.sendWithProvider(provider, emailId, email);
        return result;
      } catch (error) {
        attempt = attempt + 1;
        const status = this.emailStatus.get(emailId);
        if (status) {
          status.errors.push({
            attempt,
            error: error.message,
            timestamp: Date.now(),
          });
        }

        if (attempt > maxtry) throw error;

        await this._sleep(delay);
        delay = Math.min(delay * 2, this.config.maximumDelay);
      }
    }
  }

  async sendWithProvider(provider, emailId, email) {
    // Get the circuit breaker of given  provider  
    const circuitBreaker = this.circuitBreakers.get(provider.name);
    
    // Check for circuit breaker 
    return circuitBreaker.execute(  async () => {
      const result = await provider.deliverEmail(email);
      return result;
    });
  }

  // Function to generate increasing delay 
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      totalSent: this.sentEmails.size,
      totalStatus: this.emailStatus.size,
      providerStats: this.Providers.map(p => p.getStats()),
    };
  }
}