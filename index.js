import express from 'express';
import { EmailService } from './EmailService/emailservice.js';

const app = express();
app.use(express.json());


const emailService = new EmailService({});


const queue = [];
const results = [];


app.post('/send-email', (req, res) => {
  const { to, subject, body } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, body' });
  }

  const email = { to, subject, body, timestamp: Date.now() };

  const emailId = `${to}-${subject}-${body}`;


  if (emailService.sentEmails.has(emailId)) {
    return res.json({ message: 'Email already sent', email });
  }

  queue.push(email);
  console.log('📩 Email queued:', to);
  res.json({ message: 'Email queued successfully', email });
});


app.get('/results', (req, res) => {
  res.json(results);
});

setInterval(async () => {
  if (queue.length === 0) return;

  console.log('🚀 Processing queued emails...');

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
