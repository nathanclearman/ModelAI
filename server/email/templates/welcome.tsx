import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  username: string;
  subscriptionTier: string;
  verificationToken: string;
}

export const WelcomeEmail = ({
  username = 'User',
  subscriptionTier = 'Free',
  verificationToken = '',
}: WelcomeEmailProps) => {
  // Use the Replit domain or fallback to localhost (with http for dev)
  const domain = process.env.REPLIT_DEV_DOMAIN;
  const protocol = domain ? 'https' : 'http';
  const host = domain || 'localhost:5000';
  const verificationUrl = `${protocol}://${host}/verify-email?token=${verificationToken}`;
  
  return (
    <Html>
      <Head />
      <Preview>Welcome to ModelAI - Verify your email to get started</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to ModelAI! 🎉</Heading>
          <Text style={text}>Hi {username},</Text>
          <Text style={text}>
            Thank you for joining ModelAI, the premier AI model management platform for businesses. 
            We're excited to have you onboard!
          </Text>
          <Text style={text}>
            To get started, please verify your email address by clicking the button below:
          </Text>
          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Verify Email Address
            </Button>
          </Section>
          <Text style={text}>
            Once verified, you'll have access to your <strong>{subscriptionTier}</strong> plan with these features:
          </Text>
          <Section style={features}>
            <Text style={feature}>✨ Create and customize AI models</Text>
            <Text style={feature}>💬 Manage conversations with AI assistants</Text>
            <Text style={feature}>🖼️ Generate AI images with Gemini</Text>
            <Text style={feature}>🔗 Share models in the marketplace</Text>
            <Text style={feature}>👥 Collaborate with team workspaces</Text>
          </Section>
          <Text style={footer}>
            If the button above doesn't work, copy and paste this link into your browser:<br/>
            {verificationUrl}
          </Text>
          <Text style={footer}>
            Need help? Reply to this email or visit our support center.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif', padding: '20px' };
const container = { margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px', backgroundColor: '#ffffff', borderRadius: '8px' };
const h1 = { color: '#FF6B4A', fontSize: '28px', fontWeight: '700', padding: '0', margin: '20px 0' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '16px 0' };
const features = { margin: '24px 0' };
const feature = { color: '#555', fontSize: '15px', lineHeight: '24px', margin: '8px 0' };
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' };
const button = { backgroundColor: '#FF6B4A', borderRadius: '6px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px' };
const footer = { color: '#8898aa', fontSize: '14px', lineHeight: '24px', marginTop: '32px' };
