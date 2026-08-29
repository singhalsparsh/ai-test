import React from 'react';
import { FileText, Download, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';

export const TermsPage: React.FC = () => {
  const handleDownloadTermsPdf = () => {
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
    doc.text('DeepfakeGuard — Terms of Service & Forensics Charter', margin + 6, margin + 11);

    doc.setTextColor(212, 160, 23);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Version 2.4.0 | Legal Terms & Disclaimers', margin + 6, margin + 17);

    let y = margin + 30;

    const sections = [
      {
        title: '1. Permitted Use & Authorized Audits',
        text: 'DeepfakeGuard is provided for personal protection, fraud prevention, academic research, and lawful forensic verification. Users agree not to utilize the service to develop adversarial evasion techniques against forensic systems.',
      },
      {
        title: '2. Probabilistic Forensic Nature',
        text: 'Deepfake detection utilizes probabilistic acoustic and deep-learning models. While our models operate at high verified confidence (>95%), acoustic degradation or low-quality microphone clipping may alter scores. DeepfakeGuard reports serve as investigative aids, not sole evidentiary mandates.',
      },
      {
        title: '3. Backend API & Integration Standards',
        text: 'Developers deploying self-hosted Python backends (PyTorch / FastAPI) must adhere to secure TLS communication and ensure client endpoints do not log confidential audio streams.',
      },
      {
        title: '4. Limitation of Liability',
        text: 'DeepfakeGuard and its creators shall not be held liable for damages resulting from reliance upon automated scoring in financial transactions without independent corroboration.',
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

    doc.save('DeepfakeGuard_Official_Terms_of_Service.pdf');
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
            <Scale className="w-3.5 h-3.5 text-[#D4A017] dark:text-[#F1BE38]" />
            <span>TERMS & FORENSIC CHARTER</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7875] dark:text-[#9A968F] mt-1">
            Last Updated: March 2026 • DeepfakeGuard Security & Compliance
          </p>
        </div>

        {/* Download PDF Button */}
        <button
          id="download-terms-pdf-btn"
          onClick={handleDownloadTermsPdf}
          className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 rounded-full bg-[#1A1A1A] dark:bg-[#F1BE38] hover:bg-black dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-xs sm:text-sm font-bold shadow-sm dark:shadow-[0_0_20px_rgba(241,190,56,0.25)] transition-all cursor-pointer group active:scale-95"
        >
          <Download className="w-4 h-4 text-[#D4A017] dark:text-[#0B0B0E] group-hover:translate-y-0.5 transition-transform" />
          <span>Download Terms PDF</span>
        </button>
      </div>

      {/* Main Content Articles */}
      <div className="rounded-3xl bg-white dark:bg-[#131319] border border-[#D9D4C8] dark:border-white/10 p-6 sm:p-10 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-8 text-[#2C2A29] dark:text-[#E2DFD8]">
        {/* Notice Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FAF6EE] dark:bg-[#1E1A14] border border-[#D4A017]/40 dark:border-[#F1BE38]/30 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1A1A1A] dark:text-[#F1BE38]">
            <AlertTriangle className="w-5 h-5 text-[#D4A017] dark:text-[#F1BE38]" />
            <span>Forensic Notice for High-Risk Financial Decisions</span>
          </div>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#C5C2BA] leading-relaxed">
            DeepfakeGuard provides state-of-the-art acoustic and neural forensic indicators to assist in identifying synthetic speech. For wire transfers, executive commands, or emergency funds, always corroborate results with out-of-band communication.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            1. Acceptance of Terms
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            By accessing or using the DeepfakeGuard web application, API integrations, or PDF reports, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must discontinue use immediately.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            2. Permitted & Prohibited Activities
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            You may use DeepfakeGuard to scan voicemail, test audio files for synthetic manipulation, and audit media recordings. You are strictly prohibited from reverse-engineering the detection pipeline to develop deepfake generator bypass techniques or conducting denial-of-service attacks against the infrastructure.
          </p>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            3. Accuracy & Technical Evidentiary Limitations
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            While our deep learning models are trained against state-of-the-art vocoders and audio benchmarks, no automated system can guarantee 100% perfection across severe compression, heavy background noise, or clipped cellular telephony signals. Reports should be considered high-confidence indicators rather than judicial evidence.
          </p>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            4. User-Provided Backend & Custom Models
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            If you connect the DeepfakeGuard frontend to your own Python or PyTorch backend, you are solely responsible for ensuring your local server complies with applicable privacy laws, data protection standards, and server security practices.
          </p>
        </section>

        {/* Section 5 */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-[#1A1A1A] dark:text-white">
            5. Intellectual Property
          </h2>
          <p className="text-xs sm:text-sm text-[#5A5852] dark:text-[#A8A49C] leading-relaxed">
            All algorithms, UI design systems, branding, and forensic visualizer modules are the property of DeepfakeGuard. You retain full ownership and rights over your original audio recordings and generated forensic PDF export reports.
          </p>
        </section>
      </div>
    </motion.div>
  );
};
