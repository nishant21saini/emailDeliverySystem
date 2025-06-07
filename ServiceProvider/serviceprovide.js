export class ServiceProvider {
    
    constructor(name, selectionRate = 0.8, latency = 1000) {
        this.name = name;
        this.selectionRate = selectionRate;
        this.latency = latency;
        this.requestCount = 0;
        this.successCount = 0;
    }

    async deliverEmail(email) {
        this.requestCount++;
        
        // Just for delay
        await new Promise(resolve => setTimeout(resolve, this.latency));

        if (Math.random() > this.selectionRate) {
            throw new Error(`${this.name} provider failed - network error`);
        }

        this.successCount++;
        return {
            providerId: this.name,
            messageId: `${this.name}_${Date.now()}_${Math.random().toString(36)}`,
            timestamp: new Date().toISOString(),
            status: 'delivered'
        };
    }

    getStats() {
        return {
            name: this.name,
            requestCount: this.requestCount,
            
        };
    }
}
