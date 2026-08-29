import React from 'react';
import { ShieldCheck, Download, Lock, CheckCircle, FileText, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';

export const PrivacyPage: React.FC = () => {
  const handleDownloadPrivacyPdf = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;

    // Warm background
    doc.setFillColor(245, 240, 232);
    doc.rect(0, 0, pageWidth, 297, 'F');

    // Header
    doc.setFillColor(26, 26, 26);
    doc.roundedRect(margin, margin, contentWidth, 22, 3, 3, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('DeepfakeGuard — Privacy Policy & Zero-Retention Charter', margin + 6, margin + 11);

    doc.setTextColor(212, 160, 23);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Effective Date: March 2026 | Version 2.4.0', margin + 6, margin + 17);

    let y = margin + 30;

    const sections = [
      {
        title: '1. Zero Data Retention (ZDR) Commitment',
        text: 'DeepfakeGuard operates strictly under an ephemeral in-memory processing architecture. All uploaded voice recordings and audio streams are processed in transient volatile RAM for spectrogram extraction and acoustic neural inference. Audio waveforms are immediately purged upon analysis completion.',
      },
      {
        title: '2. No Biometric Fingerprinting',
        text: 'We do not generate, store, or sell biometric voiceprints. Our machine learning models evaluate acoustic artifacts (formant continuity, phase glitch, vocoder harmonics) rather than personal speaker identity.',
      },
      {
        title: '3. Data Transmission & Security Standards',
        text: 'All data in transit is encrypted using TLS 1.3 encryption. Backend inference routes do not log audio payloads, user IP addresses, or speaker metadata to permanent disk storage.',
      },
      {
        title: '4. Voluntary Research Contributions',
        text: 'If a user explicitly opts in via the contribution widget, audio is stripped of EXIF and container metadata before benchmark submission.',
      },
    ];

    sections.forEach((sec) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(217, 212, 200);
      doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

      doc.setTextColor(26, 26, 26);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text(sec.title, margin + 6, y + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(74, 74, 72);
      const split = doc.splitTextToSize(sec.text, contentWidth - 12);
      doc.text(split, margin + 6, y + 16);

      y += 44;
    });

    doc.save('DeepfakeGuard_Official_Privacy_Policy.pdf');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-10"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#D9D4C8] dark:border-white/10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] dark:bg-[#1E1E28] text-white text-xs font-semibold mb-2 border border-transparent dark:border-white/10">
            <Lock className="w-3.5 h-3.5 text-[#D4A017] dark:text-[#F1BE38]" />
            <span>ZERO DATA RETENTION POLICY</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7875] dark:text-[#9A968F] mt-1">
            Last Updated: March 2026 • DeepfakeGuard Security & Compliance
          </p>
        </div>

        {/* Download PDF Button */}
        <button
          id="download-privacy-pdf-btn"
          onClick={handleDownloadPrivacyPdf}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 rounded-full bg-[#1A1A1A] dark:bg-[#F1BE38] hover:bg-black dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-xs sm:text-sm font-bold shadow-sm dark:shadow-[0_0_20px_rgba(241,190,56,0.25)] transition-all cursor-pointer group active:scale-95"
        >
          <Download className="w-4 h-4 text-[#D4A017] dark:text-[#0B0B0E] group-hover:translate-y-0.5 transition-transform" />
          <span>Download Policy PDF</span>
        </button>
      </div>

      {/* Main Content Articles */}
      <div className="rounded-3xl bg-white dark:bg-[#131319] border border-[#D9D4C8] dark:border-white/10 p-6 sm:p-10 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-8 text-[#2C2A29] dark:text-[#E2DFD8]">
        {/* Core Pledge Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF6EE] dark:bg-[#102018] border border-[#2D8A4E]/30 dark:border-[#2ECC71]/35 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#2D8A4E] dark:text-[#2ECC71]">
            <ShieldCheck className="w-5 h-5" />
            <span>Our Zero-Retention Commitment to Every User</span>
          </div>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8C8B5] leading-relaxed">
            We believe you should never have to compromise your voice privacy to defend against deepfake scams. DeepfakeGuard does not store, monetize, or harvest your audio files or voice biometric templates.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            1. Processing Architecture & Ephemeral Audio Handling
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            When you upload or stream audio to DeepfakeGuard, the data is decoded strictly within volatile memory for acoustic analysis. As soon as the neural spectrogram extraction and verification algorithms produce their quantitative scores, the audio buffer is wiped from RAM. No copies are written to persistent disks or external data lakes.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            2. Biometric Privacy & Non-Identification
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            Our detection engine is designed to recognize synthetic generative markers (such as vocoder comb filters, unnatural pitch stability, and lack of biological breathing) rather than identifying who is speaking. We do not maintain speaker recognition databases or cross-reference voiceprints.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            3. Self-Hosted & Custom Python Backend Security
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            For users operating their own Python machine learning endpoints (e.g. FastAPI / PyTorch models running Wav2Vec2), all audio requests can be routed directly to local or private enterprise VPC endpoints with no external network exposure.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            4. Voluntary Research Contributions
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            If you voluntarily choose to share an audio sample via the &quot;Help Improve the AI Model&quot; widget, the file is stripped of device metadata and stored strictly for open-source AI defense training with your explicit affirmative consent.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            5. Contact our Privacy & Data Officer
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            If you have questions regarding our privacy practices or wish to submit an audit inquiry, please reach out via our Contact page or at <span className="font-mono text-[#1A1A1A] dark:text-[#F1BE38]">privacy@deepfakeguard.ai</span>.
          </p>
        </section>
      </div>
    </motion.div>
  );
};
