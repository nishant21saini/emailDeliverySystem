
export class RateLimiter{

    constructor (maxRequest = 100 , timeWindow = 60000){
        this.maxRequest = maxRequest;
        this.timeWindow = timeWindow;
        this.requests = [];

    }
        canRequest(){
          const presentDate = Date.now();

          this.requests = this.requests.filter((time) => presentDate - time <= this.timeWindow );

          // return true or faslse 
          return this.requests.length < this.maxRequest;
        }

        recordRequest() {
             this.requests.push(Date.now());
        }



    }
