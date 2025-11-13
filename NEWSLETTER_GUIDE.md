# Newsletter Guide - Using Resend with ModelAI

This guide explains how to send newsletters to your subscribers using the built-in Resend integration.

## Overview

The newsletter system is fully integrated and includes:
- ✅ **Database schema** - Tracks newsletter subscribers
- ✅ **User subscription UI** - Settings page toggle
- ✅ **Email templates** - Beautiful branded React Email templates
- ✅ **API endpoints** - Admin endpoints to send newsletters
- ✅ **Resend integration** - Configured and ready to use

## How to Send a Newsletter (Admin)

### Method 1: Using the API Directly

Send a POST request to `/api/admin/newsletter/send` with the following payload:

```bash
curl -X POST https://your-app.replit.dev/api/admin/newsletter/send \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "subject": "🚀 ModelAI Updates - December 2024",
    "headline": "What'\''s New at ModelAI",
    "content": "<p>Hello! We'\''re excited to share the latest updates...</p><ul><li>New AI models available</li><li>Improved performance</li><li>Bug fixes and enhancements</li></ul>",
    "ctaText": "Explore New Features",
    "ctaUrl": "https://your-app.replit.dev/models"
  }'
```

**Response:**
```json
{
  "message": "Newsletter sent",
  "totalSubscribers": 25,
  "successCount": 25,
  "failureCount": 0,
  "results": [...]
}
```

### Method 2: Create an Admin UI (Recommended)

Add a newsletter composer to your admin dashboard. Here's a simple example:

```typescript
// Add to client/src/pages/admin.tsx

const [newsletterForm, setNewsletterForm] = useState({
  subject: '',
  headline: '',
  content: '',
  ctaText: '',
  ctaUrl: ''
});

const sendNewsletterMutation = useMutation({
  mutationFn: async (data: typeof newsletterForm) => {
    return await apiRequest("POST", "/api/admin/newsletter/send", data);
  },
  onSuccess: (response: any) => {
    toast({
      title: "Newsletter Sent!",
      description: `Successfully sent to ${response.successCount} subscribers`
    });
    setNewsletterForm({ subject: '', headline: '', content: '', ctaText: '', ctaUrl: '' });
  },
  onError: () => {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to send newsletter"
    });
  }
});

// In your JSX:
<Card>
  <CardHeader>
    <CardTitle>Send Newsletter</CardTitle>
    <CardDescription>Compose and send newsletters to all subscribers</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <Input
      placeholder="Subject line"
      value={newsletterForm.subject}
      onChange={(e) => setNewsletterForm({...newsletterForm, subject: e.target.value})}
    />
    <Input
      placeholder="Headline"
      value={newsletterForm.headline}
      onChange={(e) => setNewsletterForm({...newsletterForm, headline: e.target.value})}
    />
    <Textarea
      placeholder="Content (HTML supported)"
      value={newsletterForm.content}
      onChange={(e) => setNewsletterForm({...newsletterForm, content: e.target.value})}
      rows={8}
    />
    <Input
      placeholder="Call-to-action text (optional)"
      value={newsletterForm.ctaText}
      onChange={(e) => setNewsletterForm({...newsletterForm, ctaText: e.target.value})}
    />
    <Input
      placeholder="Call-to-action URL (optional)"
      value={newsletterForm.ctaUrl}
      onChange={(e) => setNewsletterForm({...newsletterForm, ctaUrl: e.target.value})}
    />
    <Button
      onClick={() => sendNewsletterMutation.mutate(newsletterForm)}
      disabled={sendNewsletterMutation.isPending || !newsletterForm.subject || !newsletterForm.headline || !newsletterForm.content}
    >
      {sendNewsletterMutation.isPending ? "Sending..." : "Send Newsletter"}
    </Button>
  </CardContent>
</Card>
```

## API Endpoints

### Get Subscriber Count
```
GET /api/admin/newsletter/subscribers
```
**Response:**
```json
{
  "count": 25,
  "subscribers": [
    { "email": "user@example.com", "firstName": "John", "lastName": "Doe" },
    ...
  ]
}
```

### Send Newsletter
```
POST /api/admin/newsletter/send
```
**Body:**
```json
{
  "subject": "Newsletter subject",
  "headline": "Main headline",
  "content": "<p>HTML content...</p>",
  "ctaText": "Click Here (optional)",
  "ctaUrl": "https://example.com (optional)"
}
```

## Email Template Features

The built-in newsletter template includes:
- ✅ **Branded header** with ModelAI logo and coral accent (#FF6B4A)
- ✅ **Personalization** using subscriber's first name
- ✅ **HTML content** support with rich formatting
- ✅ **Optional CTA button** for driving actions
- ✅ **Unsubscribe link** (navigates to settings page)
- ✅ **Responsive design** that looks great on all devices
- ✅ **Footer** with branding and current year

## Testing

To test the newsletter functionality:

1. **Subscribe yourself** from the Settings page
2. **Check subscriber count:**
   ```bash
   curl https://your-app.replit.dev/api/admin/newsletter/subscribers \
     -H "Cookie: your-session-cookie"
   ```
3. **Send a test newsletter** with simple content
4. **Check your email** to see the beautifully formatted newsletter

## Rate Limiting

The system includes built-in rate limiting:
- **100ms delay** between each email to avoid hitting Resend's rate limits
- Sends newsletters sequentially to all subscribers
- Reports success/failure count for each batch

## Resend Free Tier Limits

- **3,000 emails per month** on the free tier
- **100 emails per day** sending limit
- If you have 25 subscribers, you can send ~4 newsletters per day

## Best Practices

1. **Test first** - Always send a test to yourself before sending to all subscribers
2. **Keep it concise** - Newsletters should be scannable and focused
3. **Include a CTA** - Give subscribers a clear next action
4. **Monitor results** - Check the success/failure counts after sending
5. **Schedule strategically** - Don't send too frequently (monthly is a good cadence)

## Troubleshooting

**No subscribers?**
- Check that users have toggled the newsletter switch in Settings
- Verify the database: `SELECT COUNT(*) FROM users WHERE newsletter_subscribed = 1`

**Newsletter not sending?**
- Check Resend API key is configured correctly
- Verify you're authenticated as an admin
- Check server logs for error messages

**Emails going to spam?**
- Configure SPF/DKIM records in your Resend dashboard
- Use a verified domain for sending
- Avoid spammy words in subject lines

## Environment Setup

The Resend integration is already configured. You can verify it's working by checking:

```bash
# In your Replit environment
echo $RESEND_API_KEY  # Should show your API key (or empty if using integration)
```

The integration automatically handles:
- API key management
- From email configuration
- Error handling and retries

## Next Steps

Ready to send your first newsletter? Here's a quick start:

1. Log in as an admin (fransantbrid@anglernook.com)
2. Navigate to Settings and subscribe to the newsletter
3. Use the API or add the UI component above
4. Send your first test newsletter!

For more information about the email templates, see `server/email/templates/newsletter.tsx`.
