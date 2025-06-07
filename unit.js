import { EmailService } from './EmailService/emailservice.js';

async function processEmails(emails) {
  const emailService = new EmailService({});
  const results = [];

  for (const email of emails) {
    try {
      const result = await emailService.sendEmail(email);

      if (result.exist === 1) {
        console.log('Already sent:', result.emailId);
        results.push({
          email: email.to,
          status: 'Already Sent',
          emailId: result.emailId,
        });
        continue;
      }

      console.log('Email sent:', result.messageId);
      results.push({
        email: email.to,
        provider: result.providerId,
        status: 'Sent Successfully',
      });
    } catch (error) {
      console.log('Email failed:', error.message);
      results.push({
        email: email.to,
        status: 'Failed',
        errorMessage: error.message,
      });
    }
  }

  const summary = {
    message: 'Emails processed successfully',
    results,
    stats: emailService.getStats(),
  };

  console.log(' Final Result');
  console.log(JSON.stringify(summary, null, 2));
}

const hardcodedEmails = [
  {
    to: 'user1@example.com',
    subject: 'Hardcoded Welcome Email',
    body: 'This is a hardcoded test email',
    timestamp: Date.now(),
  },
  {
    to: 'user2@example.com',
    subject: 'Another One',
    body: 'Another hardcoded email body',
    timestamp: Date.now(),
  },
];

processEmails(hardcodedEmails);
