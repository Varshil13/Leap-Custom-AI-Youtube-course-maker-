import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { db } from '@/services/db';
import { Certificates, UserProgress, CourseDetails } from '@/services/schema';
import { getServerSession } from "next-auth/next";
import { and, eq } from 'drizzle-orm';

// Helper to check eligibility (same logic as checkEligibility API)
async function checkCourseCompletion(userId: string, courseId: string) {
  // Get user progress
  const progress = await db
    .select()
    .from(UserProgress)
    .where(
      and(
        eq(UserProgress.userId, userId),
        eq(UserProgress.courseId, courseId)
      )
    );
  
  const progressMap: Record<string, boolean> = {};
  progress.forEach((item) => {
    const lessonKey = `${item.chapterTitle}__${item.subtopicName}`;
    progressMap[lessonKey] = item.isWatched || false;
  });
  
  const completedLessons = Object.values(progressMap).filter(Boolean).length;
  
  // Get total lessons from course roadmap
  const courseRows = await db
    .select()
    .from(CourseDetails)
    .where(eq(CourseDetails.courseId, courseId));
  
  if (!courseRows.length) {
    throw new Error('Course not found');
  }
  
  let totalLessons = 0;
  try {
    const roadmap = typeof courseRows[0].roadmap === 'string' ? 
      JSON.parse(courseRows[0].roadmap) : courseRows[0].roadmap;
    totalLessons = roadmap?.reduce((sum: number, ch: { subtopics?: { length: number }[] }) => 
      sum + (ch.subtopics?.length || 0), 0) || 0;
  } catch {
    totalLessons = 0;
  }
  
  if (!totalLessons) {
    throw new Error('Course has no lessons');
  }
  
  const percentCompleted = Math.round((completedLessons / totalLessons) * 100);
  return percentCompleted === 100;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(); const userId = session?.user?.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, courseName, userName, userEmail } = await request.json();

    // 🔒 CHECK ELIGIBILITY FIRST
    const isEligible = await checkCourseCompletion(userId, courseId);
    if (!isEligible) {
      return NextResponse.json({ 
        error: 'Certificate not available. Please complete all course lessons first.' 
      }, { status: 403 });
    }

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 landscape for better proportions
    const { width, height } = page.getSize();

    // Load fonts
    const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const nameFont = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
    const elegantFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    // Elegant color palette
    const deepBlue = rgb(0.1, 0.2, 0.4);      // Professional deep blue
    const elegantGold = rgb(0.8, 0.6, 0.2);   // Sophisticated gold
    const softGray = rgb(0.4, 0.4, 0.4);      // Subtle gray
    const black = rgb(0, 0, 0);
    const lightBlue = rgb(0.9, 0.95, 1);      // Very light blue background

    // Elegant background gradient effect (simulated with rectangles)
    for (let i = 0; i < 20; i++) {
      const alpha = 0.02 - (i * 0.001);
      page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: height,
        color: rgb(0.9 + (i * 0.005), 0.95 + (i * 0.0025), 1),
        opacity: alpha,
      });
    }

    // Ornate border design
    // Outer border
    page.drawRectangle({
      x: 40,
      y: 40,
      width: width - 80,
      height: height - 80,
      borderColor: deepBlue,
      borderWidth: 4,
    });

    // Inner decorative border
    page.drawRectangle({
      x: 60,
      y: 60,
      width: width - 120,
      height: height - 120,
      borderColor: elegantGold,
      borderWidth: 2,
    });

    // Corner decorative elements
    const cornerSize = 40;
    // Top-left corner decoration
    page.drawRectangle({
      x: 80,
      y: height - 100,
      width: cornerSize,
      height: 2,
      color: elegantGold,
    });
    page.drawRectangle({
      x: 80,
      y: height - 100,
      width: 2,
      height: cornerSize,
      color: elegantGold,
    });

    // Top-right corner decoration
    page.drawRectangle({
      x: width - 120,
      y: height - 100,
      width: cornerSize,
      height: 2,
      color: elegantGold,
    });
    page.drawRectangle({
      x: width - 82,
      y: height - 100,
      width: 2,
      height: cornerSize,
      color: elegantGold,
    });

    // Bottom-left corner decoration
    page.drawRectangle({
      x: 80,
      y: 98,
      width: cornerSize,
      height: 2,
      color: elegantGold,
    });
    page.drawRectangle({
      x: 80,
      y: 80,
      width: 2,
      height: cornerSize,
      color: elegantGold,
    });

    // Bottom-right corner decoration
    page.drawRectangle({
      x: width - 120,
      y: 98,
      width: cornerSize,
      height: 2,
      color: elegantGold,
    });
    page.drawRectangle({
      x: width - 82,
      y: 80,
      width: 2,
      height: cornerSize,
      color: elegantGold,
    });

    // Helper function to center text
    const centerText = (text: string, font: any, size: number) => {
      const textWidth = font.widthOfTextAtSize(text, size);
      return (width - textWidth) / 2;
    };

    // LEAP Logo/Brand area (top center)
    const brandText = 'LEAP';
    page.drawText(brandText, {
      x: centerText(brandText, titleFont, 24),
      y: height - 120,
      size: 24,
      font: titleFont,
      color: deepBlue,
    });
    
    page.drawText('LEARNING PLATFORM', {
      x: centerText('LEARNING PLATFORM', bodyFont, 12),
      y: height - 140,
      size: 12,
      font: bodyFont,
      color: softGray,
    });

    // Main title with elegant styling
    const mainTitle = 'CERTIFICATE OF COMPLETION';
    page.drawText(mainTitle, {
      x: centerText(mainTitle, elegantFont, 36),
      y: height - 200,
      size: 36,
      font: elegantFont,
      color: deepBlue,
    });

    // Decorative line under title
    const lineWidth = 200;
    page.drawRectangle({
      x: (width - lineWidth) / 2,
      y: height - 220,
      width: lineWidth,
      height: 3,
      color: elegantGold,
    });

    // Elegant subtitle
    const subtitle = 'This is to proudly certify that';
    page.drawText(subtitle, {
      x: centerText(subtitle, bodyFont, 16),
      y: height - 270,
      size: 16,
      font: bodyFont,
      color: softGray,
    });

    // Student name with decorative underline
    const nameY = height - 320;
    page.drawText(userName, {
      x: centerText(userName, nameFont, 32),
      y: nameY,
      size: 32,
      font: nameFont,
      color: deepBlue,
    });

    // Decorative underline for name
    const nameWidth = nameFont.widthOfTextAtSize(userName, 32);
    const nameUnderlineWidth = nameWidth + 40;
    page.drawRectangle({
      x: (width - nameUnderlineWidth) / 2,
      y: nameY - 10,
      width: nameUnderlineWidth,
      height: 2,
      color: elegantGold,
    });

    // Achievement text
    const achievementText = 'has successfully completed the comprehensive course';
    page.drawText(achievementText, {
      x: centerText(achievementText, bodyFont, 16),
      y: height - 370,
      size: 16,
      font: bodyFont,
      color: black,
    });

    // Course name in elegant box
    const courseNameY = height - 420;
    const courseBoxWidth = Math.max(300, nameFont.widthOfTextAtSize(courseName, 24) + 60);
    const courseBoxHeight = 50;
    
    // Course name background box
    page.drawRectangle({
      x: (width - courseBoxWidth) / 2,
      y: courseNameY - 15,
      width: courseBoxWidth,
      height: courseBoxHeight,
      color: rgb(0.98, 0.98, 1),
      borderColor: elegantGold,
      borderWidth: 2,
    });

    page.drawText(courseName, {
      x: centerText(courseName, nameFont, 24),
      y: courseNameY + 5,
      size: 24,
      font: nameFont,
      color: deepBlue,
    });

    // Date and completion info
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const completionText = `Completed on ${currentDate}`;
    page.drawText(completionText, {
      x: centerText(completionText, bodyFont, 14),
      y: height - 480,
      size: 14,
      font: bodyFont,
      color: softGray,
    });

    // Bottom section with signature and seal areas
    const bottomY = 120;
    
    // Left side - Date
    page.drawText('Date of Completion:', {
      x: 120,
      y: bottomY + 20,
      size: 12,
      font: bodyFont,
      color: softGray,
    });
    
    page.drawText(currentDate, {
      x: 120,
      y: bottomY,
      size: 14,
      font: titleFont,
      color: black,
    });

    // Right side - Authority signature
    const authorityText = 'LEAP Learning Platform';
    page.drawText('Certified by:', {
      x: width - 250,
      y: bottomY + 20,
      size: 12,
      font: bodyFont,
      color: softGray,
    });
    
    page.drawText(authorityText, {
      x: width - 250,
      y: bottomY,
      size: 14,
      font: titleFont,
      color: deepBlue,
    });

    // Signature line
    page.drawRectangle({
      x: width - 250,
      y: bottomY - 15,
      width: 150,
      height: 1,
      color: softGray,
    });



    // Generate PDF
    const pdfBytes = await pdfDoc.save();
    
    // Convert to base64 for storage/sending
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    // Save certificate request to database
    const certificateRecord = await db.insert(Certificates).values({
      userId,
      courseId,
      courseName,
      userName,
      userEmail,
      status: 'pending',
    }).returning();

    return NextResponse.json({
      success: true,
      certificateId: certificateRecord[0].id,
      pdfBase64,
      message: 'Certificate generated successfully!'
    });

  } catch (error) {
    console.error('Certificate generation error:', error);
    return NextResponse.json({
      error: 'Failed to generate certificate'
    }, { status: 500 });
  }
}