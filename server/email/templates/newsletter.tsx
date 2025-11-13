import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface NewsletterEmailProps {
  username: string;
  subject: string;
  headline: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
}

export const NewsletterEmail = ({
  username = 'User',
  subject = 'ModelAI Newsletter',
  headline = 'What\'s New at ModelAI',
  content = '',
  ctaText,
  ctaUrl,
}: NewsletterEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>ModelAI</Heading>
            <Text style={tagline}>AI Model Management Platform</Text>
          </Section>
          
          <Heading style={h1}>{headline}</Heading>
          
          <Text style={greeting}>Hi {username},</Text>
          
          <Section style={contentSection}>
            <div dangerouslySetInnerHTML={{ __html: content }} />
          </Section>
          
          {ctaText && ctaUrl && (
            <Section style={buttonContainer}>
              <Button style={button} href={ctaUrl}>
                {ctaText}
              </Button>
            </Section>
          )}
          
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this email because you subscribed to the ModelAI newsletter.
            </Text>
            <Text style={footerText}>
              <Link href="https://modelhub.app/settings" style={link}>
                Update preferences
              </Link>
              {' · '}
              <Link href="https://modelhub.app/unsubscribe" style={link}>
                Unsubscribe
              </Link>
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} ModelAI. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default NewsletterEmail;

const main = { 
  backgroundColor: '#f6f9fc', 
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  padding: '20px'
};

const container = { 
  margin: '0 auto', 
  padding: '0', 
  maxWidth: '600px', 
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  overflow: 'hidden'
};

const header = {
  backgroundColor: '#FF6B4A',
  padding: '32px 40px',
  textAlign: 'center' as const
};

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  letterSpacing: '-0.5px'
};

const tagline = {
  color: '#ffe8e3',
  fontSize: '14px',
  margin: '8px 0 0 0'
};

const h1 = { 
  color: '#1a1a1a', 
  fontSize: '24px', 
  fontWeight: '700', 
  padding: '0 40px',
  margin: '32px 0 16px 0',
  lineHeight: '1.4'
};

const greeting = {
  color: '#333',
  fontSize: '16px',
  padding: '0 40px',
  margin: '0 0 24px 0'
};

const contentSection = {
  padding: '0 40px',
  color: '#333',
  fontSize: '16px',
  lineHeight: '1.6'
};

const buttonContainer = { 
  textAlign: 'center' as const, 
  margin: '32px 40px'
};

const button = { 
  backgroundColor: '#FF6B4A', 
  borderRadius: '6px', 
  color: '#fff', 
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none', 
  textAlign: 'center' as const, 
  display: 'inline-block', 
  padding: '14px 32px'
};

const footer = {
  padding: '32px 40px',
  borderTop: '1px solid #e5e7eb',
  marginTop: '40px'
};

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '8px 0',
  textAlign: 'center' as const
};

const link = {
  color: '#FF6B4A',
  textDecoration: 'underline'
};

const footerCopyright = {
  color: '#9ca3af',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '16px'
};
