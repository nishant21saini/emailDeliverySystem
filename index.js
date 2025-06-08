import express from 'express';
import { EmailService } from './EmailService/emailservice.js';
import { rateLimit } from 'express-rate-limit';

const app = express();
app.use(express.json());



const sendEmailLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	limit: 5,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
});


const resultsLimiter = rateLimit({
	windowMs: 60 * 1000, 
	limit: 5,
	standardHeaders: 'draft-8',
	legacyHeaders: false,
});


const emailService = new EmailService({});


const queue = [];
const results = [];

app.post('/send-email', sendEmailLimiter, (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }

  const emailId = `${to}-${subject}-${body}`;
  const email = { id: emailId, to, subject, body, timestamp: Date.now() };

  const isDuplicateInQueue = queue.some(queuedEmail => queuedEmail.id === emailId);
  if (isDuplicateInQueue) {
    return res.json({ 
      message: 'Email already queued', 
      email
    });
  }

  if (emailService.sentEmails.has(emailId)) {
    return res.json({ message: 'Email already sent', email });
  }

  queue.push(email);
  console.log('Email queued:', to);
  res.json({ message: 'Email queued successfully', email });
});


app.get('/results',resultsLimiter, (req, res) => {
    if(results.length === 0){
      res.json("No Email are Sent");
    }
  res.json(results);
});

setInterval(async () => {
  if (queue.length === 0) return;

  console.log('Processing queued emails');

  while (queue.length > 0) {
    const email = queue.shift();

    try {
      const result = await emailService.sendEmail(email);

      if (result.exist === 1) {
        results.push({
          email: email.to,
          status: 'Already Sent',
          emailId: result.emailId,
        });
      } else {
        results.push({
          email: email.to,
          status: 'Sent Successfully',
          messageId: result.messageId,
          provider: result.providerId,
        });
      }
    } catch (error) {
      results.push({
        email: email.to,
        status: 'Failed',
        error: error.message,
      });
    }
  }

}, 10000); 


app.listen(3006, () => {
  console.log('Server started on port 3006');
});
