// Email service for sending transactional emails via Resend
import { createElement } from 'react';
import { render } from '@react-email/components';
import { getResendClient } from './client';
import WelcomeEmail from './templates/welcome';
import UsageAlertEmail from './templates/usage-alert';
import NewsletterEmail from './templates/newsletter';

export async function sendWelcomeEmail(to: string, username: string, subscriptionTier: string) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const emailHtml = await render(
      createElement(WelcomeEmail, { username, subscriptionTier })
    );
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: 'Welcome to ModelHub!',
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }

    console.log('Welcome email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

export async function sendUsageAlertEmail(
  to: string,
  username: string,
  usagePercent: number,
  messageQuota: number,
  messagesUsed: number,
  subscriptionTier: string
) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const emailHtml = await render(
      createElement(UsageAlertEmail, {
        username,
        usagePercent,
        messageQuota,
        messagesUsed,
        subscriptionTier,
      })
    );
    
    const subject = usagePercent >= 90 
      ? '⚠️ You\'ve used ' + usagePercent + '% of your quota'
      : '📊 Usage Alert: ' + usagePercent + '% quota used';
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send usage alert email:', error);
      return { success: false, error };
    }

    console.log('Usage alert email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending usage alert email:', error);
    return { success: false, error };
  }
}

export async function sendSubscriptionConfirmationEmail(
  to: string,
  username: string,
  planName: string,
  price: number
) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject: `Subscription Confirmed: ${planName} Plan`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #FF6B4A;">Subscription Confirmed! 🎉</h1>
          <p>Hi ${username},</p>
          <p>Your subscription to the <strong>${planName}</strong> plan has been confirmed.</p>
          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 6px; margin: 24px 0;">
            <p style="margin: 0; color: #6B7280; font-size: 14px;">Monthly Price</p>
            <p style="margin: 8px 0 0 0; color: #FF6B4A; font-size: 32px; font-weight: bold;">$${price}</p>
          </div>
          <p>You now have access to all ${planName} features. Your billing will renew automatically each month.</p>
          <p style="margin-top: 32px;"><a href="https://modelhub.app/settings" style="background-color: #FF6B4A; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">Manage Subscription</a></p>
          <p style="color: #8898aa; font-size: 14px; margin-top: 32px;">Questions? Reply to this email for support.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send subscription confirmation email:', error);
      return { success: false, error };
    }

    console.log('Subscription confirmation email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error);
    return { success: false, error };
  }
}

export async function sendNewsletter(
  to: string,
  username: string,
  subject: string,
  headline: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string
) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const emailHtml = await render(
      createElement(NewsletterEmail, {
        username,
        subject,
        headline,
        content,
        ctaText,
        ctaUrl,
      })
    );
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to,
      subject,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send newsletter:', error);
      return { success: false, error };
    }

    console.log('Newsletter sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return { success: false, error };
  }
}

export async function sendNewsletterToSubscribers(
  subscribers: Array<{ email: string; firstName: string | null; lastName: string | null }>,
  subject: string,
  headline: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string
) {
  const results = [];
  
  for (const subscriber of subscribers) {
    const username = subscriber.firstName || subscriber.email.split('@')[0];
    const result = await sendNewsletter(
      subscriber.email,
      username,
      subject,
      headline,
      content,
      ctaText,
      ctaUrl
    );
    results.push({ email: subscriber.email, ...result });
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
