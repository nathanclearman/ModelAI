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

interface UsageAlertEmailProps {
  username: string;
  usagePercent: number;
  messageQuota: number;
  messagesUsed: number;
  subscriptionTier: string;
}

export const UsageAlertEmail = ({
  username = 'User',
  usagePercent = 80,
  messageQuota = 100,
  messagesUsed = 80,
  subscriptionTier = 'Free',
}: UsageAlertEmailProps) => {
  const isNearLimit = usagePercent >= 90;
  const color = isNearLimit ? '#DC2626' : '#F59E0B';
  
  return (
    <Html>
      <Head />
      <Preview>You've used {usagePercent}% of your monthly quota</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={{...h1, color}}>
            {isNearLimit ? '⚠️ Quota Almost Reached' : '📊 Usage Alert'}
          </Heading>
          <Text style={text}>Hi {username},</Text>
          <Text style={text}>
            You've used <strong>{messagesUsed} of {messageQuota}</strong> messages ({usagePercent}%) 
            on your {subscriptionTier} plan this month.
          </Text>
          {isNearLimit ? (
            <Section style={{...alert, backgroundColor: '#FEE2E2'}}>
              <Text style={{...alertText, color: '#991B1B'}}>
                You're close to reaching your monthly limit. Consider upgrading to continue uninterrupted service.
              </Text>
            </Section>
          ) : (
            <Text style={text}>
              Keep an eye on your usage to avoid interruptions. Upgrade anytime for higher limits.
            </Text>
          )}
          <Section style={stats}>
            <Text style={statLabel}>Messages remaining:</Text>
            <Text style={statValue}>{messageQuota - messagesUsed}</Text>
          </Section>
          <Section style={buttonContainer}>
            <Button style={button} href="https://modelhub.app/pricing">
              View Plans
            </Button>
          </Section>
          <Text style={footer}>
            Your quota resets at the end of your billing period.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default UsageAlertEmail;

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif', padding: '20px' };
const container = { margin: '0 auto', padding: '20px 0 48px', maxWidth: '560px', backgroundColor: '#ffffff', borderRadius: '8px' };
const h1 = { fontSize: '24px', fontWeight: '700', padding: '0', margin: '20px 0' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px', margin: '16px 0' };
const alert = { padding: '16px', borderRadius: '6px', margin: '24px 0' };
const alertText = { fontSize: '15px', lineHeight: '24px', margin: '0' };
const stats = { backgroundColor: '#F3F4F6', padding: '20px', borderRadius: '6px', margin: '24px 0', textAlign: 'center' as const };
const statLabel = { color: '#6B7280', fontSize: '14px', margin: '0 0 8px 0' };
const statValue = { color: '#FF6B4A', fontSize: '32px', fontWeight: 'bold', margin: '0' };
const buttonContainer = { textAlign: 'center' as const, margin: '32px 0' };
const button = { backgroundColor: '#FF6B4A', borderRadius: '6px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'inline-block', padding: '12px 32px' };
const footer = { color: '#8898aa', fontSize: '14px', lineHeight: '24px', marginTop: '32px', textAlign: 'center' as const };
