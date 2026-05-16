import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'Liftrz <hey@liftrz.com>';
const APP_URL = process.env.APP_URL || 'https://liftrz.com';

const send = async ({ to, subject, html, text }) => {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY not set. Would send:', { to, subject });
    return { id: 'mock-email-id', mocked: true };
  }
  try {
    const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text });
    console.log('[Email] Sent to', to, '| ID:', result.data?.id);
    return result;
  } catch (error) {
    console.error('[Email] Failed to send to', to, '| Error:', error.message);
    return { error: error.message };
  }
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F19; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .logo { font-size: 24px; font-weight: 900; font-style: italic; color: #F97316; margin-bottom: 32px; }
    .card { background: #151B2B; border: 1px solid #334155; border-radius: 16px; padding: 32px; }
    .heading { font-size: 20px; font-weight: 700; color: #f8fafc; margin-bottom: 16px; }
    .text { font-size: 15px; line-height: 1.7; color: #94a3b8; margin-bottom: 16px; }
    .button { display: inline-block; background: #F97316; color: #fff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-size: 13px; font-weight: 700; margin: 16px 0; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; }
    .highlight { color: #F97316; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Liftrz</div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      Liftrz Pakistan - Verified Trainer Marketplace<br>
      This is an automated notification. Please do not reply to this email.
    </div>
  </div>
</body>
</html>
`;

export const email = {
  send,

  contactMessage: async ({ name, fromEmail, subject, message }) => {
    const emailSubject = `Contact form: ${subject || 'New Liftrz message'}`;
    const html = baseTemplate(`
      <div class="heading">New contact form message</div>
      <div class="text"><strong>Name:</strong> ${name || 'Not provided'}</div>
      <div class="text"><strong>Email:</strong> ${fromEmail || 'Not provided'}</div>
      <div class="text"><strong>Subject:</strong> ${subject || 'General inquiry'}</div>
      <div class="text" style="background:#27272a; padding:16px; border-radius:12px;">${message || 'No message provided.'}</div>
      <a href="${APP_URL}/admin" class="button">Open Admin</a>
    `);
    const text = `New Liftrz contact form message\nName: ${name}\nEmail: ${fromEmail}\nSubject: ${subject}\n\n${message}`;
    return send({ to: 'hey@liftrz.com', subject: emailSubject, html, text });
  },

  // Trainer gets notified of new lead
  newLead: async ({ trainerEmail, trainerName, clientName, clientGoal, clientMessage, leadId }) => {
    const subject = `New lead from ${clientName} - Liftrz`;
    const html = baseTemplate(`
      <div class="heading">You have a new lead, ${trainerName}</div>
      <div class="text"><strong class="highlight">${clientName}</strong> submitted an inquiry through Liftrz.</div>
      <div class="text"><strong>Goal:</strong> ${clientGoal || 'Not specified'}</div>
      <div class="text"><strong>Message:</strong><br>${clientMessage || 'No message provided.'}</div>
      <a href="${APP_URL}/trainer/dashboard" class="button">View in Dashboard</a>
      <div class="text">Responding quickly improves your ranking on Liftrz.</div>
    `);
    const text = `New lead from ${clientName} on Liftrz. Goal: ${clientGoal}. View: ${APP_URL}/trainer/dashboard`;
    return send({ to: trainerEmail, subject, html, text });
  },

  // Client gets notified when payment is verified
  paymentVerified: async ({ clientEmail, clientName, trainerName, packageTitle }) => {
    const subject = `Payment verified - Your trainer contact is unlocked`;
    const html = baseTemplate(`
      <div class="heading">Payment verified, ${clientName}</div>
      <div class="text">Admin has verified your payment for <strong class="highlight">${packageTitle}</strong> with <strong class="highlight">${trainerName}</strong>.</div>
      <div class="text">Your trainer's contact details are now unlocked. You can message them directly through Liftrz.</div>
      <a href="${APP_URL}/client/dashboard" class="button">Open Dashboard</a>
    `);
    const text = `Payment verified for ${packageTitle} with ${trainerName}. View: ${APP_URL}/client/dashboard`;
    return send({ to: clientEmail, subject, html, text });
  },

  // Trainer gets notified when payment is verified
  trainerPaymentVerified: async ({ trainerEmail, trainerName, clientName, packageTitle, payoutAmount }) => {
    const subject = `New booking confirmed - ${clientName}`;
    const html = baseTemplate(`
      <div class="heading">Booking confirmed, ${trainerName}</div>
      <div class="text"><strong class="highlight">${clientName}</strong>'s payment for <strong class="highlight">${packageTitle}</strong> has been verified by admin.</div>
      <div class="text"><strong>Your payout:</strong> <span class="highlight">PKR ${payoutAmount}</span></div>
      <div class="text">The client can now contact you. Respond promptly to maintain your rating.</div>
      <a href="${APP_URL}/trainer/dashboard" class="button">View Booking</a>
    `);
    const text = `Booking confirmed: ${clientName} paid for ${packageTitle}. Payout: PKR ${payoutAmount}. View: ${APP_URL}/trainer/dashboard`;
    return send({ to: trainerEmail, subject, html, text });
  },

  // New message notification
  newMessage: async ({ toEmail, recipientName, senderName, senderRole, bookingTitle, messagePreview }) => {
    const subject = `New message from ${senderName} - Liftrz`;
    const html = baseTemplate(`
      <div class="heading">New message, ${recipientName}</div>
      <div class="text"><strong class="highlight">${senderName}</strong> (${senderRole}) sent a message about <strong class="highlight">${bookingTitle}</strong>.</div>
      <div class="text" style="background:#27272a; padding:16px; border-radius:12px; font-style:italic;">"${messagePreview}"</div>
      <a href="${APP_URL}/${senderRole === 'trainer' ? 'client' : 'trainer'}/dashboard" class="button">Reply</a>
    `);
    const text = `New message from ${senderName} about ${bookingTitle}: "${messagePreview}". Reply: ${APP_URL}/dashboard`;
    return send({ to: toEmail, subject, html, text });
  },

  // Trainer approved
  trainerApproved: async ({ trainerEmail, trainerName }) => {
    const subject = `Your Liftrz profile is live`;
    const html = baseTemplate(`
      <div class="heading">You're approved, ${trainerName}</div>
      <div class="text">Your trainer profile has been verified and is now live on Liftrz.</div>
      <div class="text">Clients can now discover you, view your packages, and submit inquiries.</div>
      <a href="${APP_URL}/trainer/dashboard" class="button">Go to Dashboard</a>
      <div class="text">Tip: Complete your transformation gallery and certifications to rank higher in search.</div>
    `);
    const text = `Your Liftrz profile is now live. View: ${APP_URL}/trainer/dashboard`;
    return send({ to: trainerEmail, subject, html, text });
  },

  // Trainer gets notified when payout is paid
  trainerPayoutPaid: async ({ trainerEmail, trainerName, amount, method, reference, receiptImage }) => {
    const subject = `Payout sent - PKR ${amount.toLocaleString()}`;
    const html = baseTemplate(`
      <div class="heading">Payout processed, ${trainerName}</div>
      <div class="text">Your payout has been sent successfully.</div>
      <div class="text"><strong>Amount:</strong> <span class="highlight">PKR ${amount.toLocaleString()}</span></div>
      <div class="text"><strong>Method:</strong> ${method || 'Bank Transfer'}</div>
      ${reference ? `<div class="text"><strong>Reference:</strong> ${reference}</div>` : ''}
      ${receiptImage ? `<div class="text"><strong>Transaction proof:</strong> <a href="${receiptImage}" class="highlight">View receipt</a></div>` : ''}
      <a href="${APP_URL}/trainer/dashboard" class="button">View Dashboard</a>
      <div class="text">Thank you for being a Liftrz trainer.</div>
    `);
    const text = `Payout of PKR ${amount.toLocaleString()} sent via ${method || 'Bank Transfer'}. Reference: ${reference || 'N/A'}. View: ${APP_URL}/trainer/dashboard`;
    return send({ to: trainerEmail, subject, html, text });
  },

  // Password reset
  passwordReset: async ({ toEmail, token }) => {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;
    const subject = `Reset your Liftrz password`;
    const html = baseTemplate(`
      <div class="heading">Password reset requested</div>
      <div class="text">Click the button below to reset your Liftrz password. This link expires in 1 hour.</div>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <div class="text">If you didn't request this, you can safely ignore this email.</div>
    `);
    const text = `Reset your Liftrz password: ${resetUrl} (expires in 1 hour)`;
    return send({ to: toEmail, subject, html, text });
  }
};
