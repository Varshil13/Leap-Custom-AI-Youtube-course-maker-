import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { db } from '@/services/db';
import { Certificates } from '@/services/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from "next-auth/next";
import dns from 'dns';

// Fix for Node 18+ DNS resolution issues with nodemailer
dns.setDefaultResultOrder('ipv4first');

export async function POST(request: NextRequest) {
  let certificateId: number;
  
  try {
    const session = await getServerSession(); const userId = session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { certificateId: certId, pdfBase64, userEmail, userName, courseName } = await request.json();
    certificateId = certId;

    if (!certificateId || !pdfBase64 || !userEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the certificate belongs to this user
    const certRows = await db
      .select()
      .from(Certificates)
      .where(
        and(
          eq(Certificates.id, certificateId),
          eq(Certificates.userId, userId)
        )
      );

    if (!certRows.length) {
      return NextResponse.json({ error: 'Certificate not found or unauthorized' }, { status: 404 });
    }

    // Create Gmail transporter bypassing DNS by using direct IP
    const transporter = nodemailer.createTransport({
      host: '192.178.211.108', // Hardcoded IP for smtp.gmail.com to bypass queryA ETIMEOUT
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false
      }
    });

    // Email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">🎉 Congratulations ${userName}!</h2>

        <p>You have successfully completed the course:</p>

        <h3 style="color: #2d3748; background: #f7fafc; padding: 10px; border-left: 4px solid #3182ce;">
          ${courseName}
        </h3>
        
        <p>Your certificate of completion is attached to this email. You can download and print it for your records.</p>
        
        <p><strong>Achievement Details:</strong></p>
        <ul>
          <li>Course: ${courseName}</li>
          <li>Student: ${userName}</li>
          <li>Issued Date: ${new Date().toLocaleDateString()}</li>
        </ul>
        
        <p>Thank you for choosing LEAP for your learning journey. We hope you found the course valuable and look forward to having you in more courses!</p>
        
        <hr style="margin: 20px 0;">
        <p style="color: #718096; font-size: 14px;">
          Best regards,<br>
          The LEAP <br>
          <em>Empowering learners worldwide</em>
        </p>
      </div>
    `;

    // Send email with certificate attachment
    const info = await transporter.sendMail({
      from: `"LEAP Certificates" <${process.env.GMAIL_USER}>`,
      to: userEmail,
      subject: `🎓 Your Certificate for "${courseName}" - LEAP Platform`,
      html: emailHtml,
      attachments: [
        {
          filename: `LEAP_Certificate_${courseName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          content: pdfBase64,
          encoding: 'base64',
          contentType: 'application/pdf'
        }
      ]
    });

    // Update certificate status in database
    await db.update(Certificates)
      .set({ 
        status: 'sent', 
        sentAt: new Date() 
      })
      .where(eq(Certificates.id, certificateId));

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
      message: 'Certificate sent successfully!'
    });

  } catch (error) {
    console.error('Certificate sending error:', error);
    
    // Update status to failed if certificateId is available
    if (certificateId) {
      try {
        await db.update(Certificates)
          .set({ status: 'failed' })
          .where(eq(Certificates.id, certificateId));
      } catch (dbError) {
        console.error('Failed to update certificate status:', dbError);
      }
    }

    return NextResponse.json({
      error: 'Failed to send certificate: ' + error.message
    }, { status: 500 });
  }
}