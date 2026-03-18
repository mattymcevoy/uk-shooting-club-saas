import { Html, Head, Body, Container, Section, Text, Heading, Link } from '@react-email/components';
import { Resend } from 'resend';

// Use a placeholder if no key is provided in development
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const isDevelopment = !process.env.RESEND_API_KEY;

type EmailOptions = {
    to: string;
    subject: string;
    react: React.ReactElement;
};

export const sendEmail = async ({ to, subject, react }: EmailOptions) => {
    if (isDevelopment) {
        console.log('\n=============================================');
        console.log('📧 DEVELOPMENT MODE: EMAIL INTERCEPTED');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('Email Body HTML rendering suppressed in console.');
        console.log('Add RESEND_API_KEY to .env to send real emails.');
        console.log('=============================================\n');
        return { success: true, fake: true };
    }

    try {
        const data = await resend.emails.send({
            from: 'UK Shooting Club <noreply@ukshootingclub.com>', // Replace with verified domain later
            to: [to],
            subject: subject,
            react: react,
        });
        return { success: true, data };
    } catch (error) {
        console.error('Failed to send email:', error);
        return { success: false, error };
    }
};

// ==========================================
// TEMPLATES
// ==========================================

export const BookingConfirmationEmail = ({
    name,
    eventName,
    dateStr,
    totalTickets,
    totalPaid,
    squadDetails, // e.g. [{ name: 'Squad 1', startTime: '10:00 AM' }]
}: {
    name: string;
    eventName: string;
    dateStr: string;
    totalTickets: number;
    totalPaid: number;
    squadDetails: any[];
}) => (
    <Html>
        <Head />
        <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5', padding: '20px' }}>
            <Container style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '0 auto', borderTop: '4px solid #10b981' }}>
                <Heading style={{ color: '#111827', fontSize: '24px', margin: '0 0 20px 0' }}>Booking Confirmed</Heading>
                <Text style={{ color: '#4b5563', fontSize: '16px', lineHeight: '24px' }}>
                    Hi {name},
                </Text>
                <Text style={{ color: '#4b5563', fontSize: '16px', lineHeight: '24px' }}>
                    Your tickets for <strong>{eventName}</strong> on {dateStr} have been confirmed.
                </Text>

                <Section style={{ backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
                    <Text style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280' }}>ORDER SUMMARY</Text>
                    <Text style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#111827' }}>Tickets: {totalTickets}</Text>
                    <Text style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#111827' }}>Total Paid: £{(totalPaid / 100).toFixed(2)}</Text>
                </Section>

                {squadDetails.length > 0 && (
                    <Section style={{ margin: '20px 0' }}>
                        <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', marginBottom: '10px' }}>Squad Assignments</Text>
                        {squadDetails.map((sq, i) => (
                            <Text key={i} style={{ margin: '0 0 5px 0', color: '#4b5563' }}>
                                • {sq.name}
                                {sq.startTime && <span style={{ color: '#10b981' }}> (Registration: {sq.startTime})</span>}
                            </Text>
                        ))}
                    </Section>
                )}

                <Text style={{ color: '#4b5563', fontSize: '14px', marginTop: '30px' }}>
                    Please have your Member QR code ready when arriving at the club to streamline your check-in.
                </Text>
                <Link href={`${process.env.NEXTAUTH_URL}/dashboard`} style={{ display: 'inline-block', backgroundColor: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', marginTop: '20px' }}>
                    View QR Code in Dashboard
                </Link>
            </Container>
        </Body>
    </Html>
);

export const WalletTopUpEmail = ({
    name,
    amountStr,
    newBalanceStr
}: {
    name: string;
    amountStr: string;
    newBalanceStr: string;
}) => (
    <Html>
        <Head />
        <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f4f4f5', padding: '20px' }}>
            <Container style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '0 auto', borderTop: '4px solid #10b981' }}>
                <Heading style={{ color: '#111827', fontSize: '24px', margin: '0 0 20px 0' }}>Digital Wallet Top-up</Heading>
                <Text style={{ color: '#4b5563', fontSize: '16px', lineHeight: '24px' }}>
                    Hi {name},
                </Text>
                <Text style={{ color: '#4b5563', fontSize: '16px', lineHeight: '24px' }}>
                    We have successfully added <strong>{amountStr}</strong> to your Digital Wallet.
                </Text>
                <Text style={{ color: '#4b5563', fontSize: '16px', lineHeight: '24px', fontWeight: 'bold' }}>
                    New Available Balance: {newBalanceStr}
                </Text>
                <Text style={{ color: '#4b5563', fontSize: '14px', marginTop: '30px', fontStyle: 'italic' }}>
                    Your wallet balance can be used to purchase clays, lessons, or event entry fees instantly without incurring additional transaction charges.
                </Text>
            </Container>
        </Body>
    </Html>
);
