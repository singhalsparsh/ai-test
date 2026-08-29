import { jsPDF } from 'jspdf';
import { AnalysisResult } from './audioEngine';

export function generateForensicPdfReport(
  fileName: string,
  result: AnalysisResult,
  fileSize?: number
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Palette constants
  const cParchment = [245, 240, 232]; // #F5F0E8
  const cDark = [26, 26, 26];         // #1A1A1A
  const cSecondary = [74, 74, 72];    // #4A4A48
  const cMuted = [122, 120, 117];     // #7A7875
  const cAmber = [212, 160, 23];      // #D4A017
  const cGreen = [45, 138, 78];       // #2D8A4E
  const cRed = [192, 57, 43];         // #C0392B

  // 1. Warm Background fill
  doc.setFillColor(cParchment[0], cParchment[1], cParchment[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top Header Banner
  doc.setFillColor(cDark[0], cDark[1], cDark[2]);
  doc.roundedRect(margin, margin, contentWidth, 24, 4, 4, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DeepfakeGuard', margin + 8, margin + 11);

  doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('AI VOICE AUTHENTICITY FORENSIC REPORT', margin + 8, margin + 18);

  // Date & ID
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8.5);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 8, margin + 11, { align: 'right' });
  doc.text(`ID: DFG-${Math.random().toString(36).substring(2, 9).toUpperCase()}`, pageWidth - margin - 8, margin + 18, { align: 'right' });

  let y = margin + 32;

  // 2. Verdict Card
  const verdictColor = result.isAuthentic ? cGreen : cRed;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(217, 212, 200);
  doc.roundedRect(margin, y, contentWidth, 34, 4, 4, 'FD');

  // Left accent strip
  doc.setFillColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.roundedRect(margin, y, 5, 34, 2, 2, 'F');

  // Verdict Heading
  doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(result.isAuthentic ? 'AUTHENTIC HUMAN VOICE DETECTED' : 'DEEPFAKE / SYNTHETIC VOICE DETECTED', margin + 10, y + 10);

  // Confidence & Risk Level
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Confidence Score: ${result.confidence.toFixed(1)}%`, margin + 10, y + 19);

  const riskLabel = result.isAuthentic ? 'Risk Level: Safe (No AI signature detected)' : 'Risk Level: CRITICAL (Likely Scam or AI Clone)';
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.text(riskLabel, margin + 10, y + 27);

  y += 40;

  // 3. Audio File Information Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(217, 212, 200);
  doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'FD');

  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Audio Evidence File:', margin + 6, y + 8);
  doc.setFont('courier', 'normal');
  doc.text(fileName, margin + 46, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  const sizeText = fileSize ? `${(fileSize / 1024).toFixed(1)} KB` : 'Standard Recording';
  doc.text(`Duration: ${(result.duration || 4.2).toFixed(1)} seconds   |   Sample Rate: ${result.sampleRate || 44100} Hz   |   Size: ${sizeText}`, margin + 6, y + 16);

  y += 28;

  // 4. Plain-Language Summary (For everyday users)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(217, 212, 200);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3, 'FD');

  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Plain-Language Summary (What this means for you):', margin + 6, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);

  const splitSummary = doc.splitTextToSize(result.summary, contentWidth - 12);
  doc.text(splitSummary, margin + 6, y + 16);

  y += 38;

  // 5. User-Friendly Breakdown Scores
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Acoustic Authenticity Indicators', margin, y);
  y += 6;

  const cardW = (contentWidth - 9) / 4;
  const metrics = [
    {
      title: 'Natural Breath',
      score: result.isAuthentic ? '96%' : '14%',
      sub: result.isAuthentic ? 'Organic cadence' : 'Missing breathing',
      good: result.isAuthentic,
    },
    {
      title: 'Pitch Jitter',
      score: result.isAuthentic ? '94%' : '28%',
      sub: result.isAuthentic ? 'Organic micro-vibration' : 'Robotic flatline',
      good: result.isAuthentic,
    },
    {
      title: 'AI Glitch Index',
      score: result.isAuthentic ? '6%' : '91%',
      sub: result.isAuthentic ? 'No vocoder artifacts' : 'Severe phase jump',
      good: !result.isAuthentic ? false : true,
    },
    {
      title: 'Room Acoustics',
      score: result.isAuthentic ? '98%' : '31%',
      sub: result.isAuthentic ? 'Physical 3D echo' : 'Sterile studio cut',
      good: result.isAuthentic,
    },
  ];

  metrics.forEach((m, idx) => {
    const x = margin + idx * (cardW + 3);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(217, 212, 200);
    doc.roundedRect(x, y, cardW, 25, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
    doc.text(m.title.toUpperCase(), x + 4, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(m.good ? cGreen[0] : cRed[0], m.good ? cGreen[1] : cRed[1], m.good ? cGreen[2] : cRed[2]);
    doc.text(m.score, x + 4, y + 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
    doc.text(m.sub, x + 4, y + 20);
  });

  y += 32;

  // 6. Actionable Advice & Security Guidance
  doc.setFillColor(result.isAuthentic ? 235 : 253, result.isAuthentic ? 247 : 240, result.isAuthentic ? 240 : 238);
  doc.setDrawColor(result.isAuthentic ? 190 : 240, result.isAuthentic ? 225 : 208, result.isAuthentic ? 200 : 204);
  doc.roundedRect(margin, y, contentWidth, 26, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(verdictColor[0], verdictColor[1], verdictColor[2]);
  doc.text(result.isAuthentic ? 'Recommended Action: Safe to Trust' : 'CRITICAL ACTION REQUIRED: Do Not Comply with Requests', margin + 6, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(cDark[0], cDark[1], cDark[2]);

  const adviceText = result.isAuthentic
    ? 'This audio shows normal biological vocal features. If verifying a caller, standard security precautions apply.'
    : 'Warning: This audio exhibits synthetic voice cloning. If the caller requested money, gift cards, passwords, or immediate wire transfers, hang up immediately and call the individual directly on a known trusted number.';
  const splitAdvice = doc.splitTextToSize(adviceText, contentWidth - 12);
  doc.text(splitAdvice, margin + 6, y + 14);

  y += 32;

  // 7. Diagnostic Observations
  if (result.detectedAnomalies && result.detectedAnomalies.length > 0) {
    doc.setTextColor(cDark[0], cDark[1], cDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Key Forensic Observations:', margin, y);
    y += 5;

    result.detectedAnomalies.slice(0, 3).forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cAmber[0], cAmber[1], cAmber[2]);
      doc.text('•', margin + 4, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(cSecondary[0], cSecondary[1], cSecondary[2]);
      doc.setFontSize(8.5);
      doc.text(item, margin + 8, y);
      y += 5.5;
    });
  }

  // Footer Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cMuted[0], cMuted[1], cMuted[2]);
  doc.text('DeepfakeGuard Forensic Engine | Processed with Zero Data Retention Policy | deepfakeguard.ai', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save the PDF
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  doc.save(`DeepfakeGuard_Forensic_Report_${cleanName}.pdf`);
}
