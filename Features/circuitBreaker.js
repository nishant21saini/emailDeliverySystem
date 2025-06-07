export class CircuitBreaker {

    constructor(maxThreshold = 5, resetTime = 60000) {
      this.maxThreshold = maxThreshold;
      this.resetTime = resetTime;
      this.failureCount = 0;
      this.lastFailureTime = null;
      this.state = 'CLOSED'; 
    }
  
    async execute(finalFunction) {
      if (this.state === 'OPEN') {
        if (Date.now() - this.lastFailureTime > this.resetTime) {
          this.state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }
      //if all is ok execute the final function 
      try {
        const result = await finalFunction();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    }
  
    onSuccess() {
      this.failureCount = 0;
      this.state = 'CLOSED';
    }
  
    onFailure() {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      if (this.failureCount >= this.maxThreshold) {
        this.state = 'OPEN';
      }
    }
  
    getState() {
      return {
        state: this.state,
        failureCount: this.failureCount,
        lastFailureTime: this.lastFailureTime
      };
    }
  }