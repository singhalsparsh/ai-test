import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Building,
  AlertCircle,
  CheckCircle2,
  Upload,
  Send,
  ShieldAlert,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    organization: '',
    category: 'emergency_scam',
    urgency: 'high',
    subject: '',
    message: '',
  });

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    id: string;
    timestamp: string;
    category: string;
    email: string;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || !formData.message) {
      alert('Please fill in your name, email, and description of the incident.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const ticketId = `DFG-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket({
        id: ticketId,
        timestamp: new Date().toLocaleString(),
        category: formData.category,
        email: formData.email,
      });
    }, 800);
  };

  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      organization: '',
      category: 'emergency_scam',
      urgency: 'high',
      subject: '',
      message: '',
    });
    setAttachedFile(null);
    setSubmittedTicket(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto px-4 pt-6 pb-20 space-y-10"
    >
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] dark:bg-[#1E1E28] text-white text-xs font-semibold border border-transparent dark:border-white/10 shadow-xs">
          <ShieldAlert className="w-3.5 h-3.5 text-[#D4A017] dark:text-[#F1BE38]" />
          <span>INCIDENT REPORTING & FORENSIC SUPPORT</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
          Contact DeepfakeGuard Forensics
        </h1>
        <p className="text-sm sm:text-base text-[#5A5852] dark:text-[#B8B4AA]">
          Report suspected voice clone extortion, submit deepfake evidence for secondary forensic review, or inquire about dedicated enterprise fraud prevention endpoints.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {submittedTicket ? (
          /* Confirmation State */
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-3xl bg-white dark:bg-[#131319] border border-[#D9D4C8] dark:border-white/10 p-8 sm:p-12 text-center shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-6"
          >
            <div className="w-16 h-16 rounded-full bg-[#2D8A4E]/15 dark:bg-[#2ECC71]/20 text-[#2D8A4E] dark:text-[#2ECC71] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-widest font-mono font-bold text-[#7A7875] dark:text-[#9A968F]">
                Forensic Case Created
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] dark:text-white">
                Case #{submittedTicket.id}
              </h2>
              <p className="text-sm text-[#5A5852] dark:text-[#B8B4AA] max-w-md mx-auto">
                Your incident details and audio evidence have been securely queued with our acoustic triage team. A confirmation has been sent to{' '}
                <span className="font-semibold text-[#1A1A1A] dark:text-white">{submittedTicket.email}</span>.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10 text-left text-xs space-y-2 text-[#4A4A48] dark:text-[#C5C2BA]">
              <div className="flex justify-between">
                <span className="text-[#7A7875] dark:text-[#8E8B84]">Logged At:</span>
                <span className="font-mono font-semibold">{submittedTicket.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7875] dark:text-[#8E8B84]">Response SLA:</span>
                <span className="font-semibold text-[#2D8A4E] dark:text-[#3DE884]">Under 2 hours (Urgent triage)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A7875] dark:text-[#8E8B84]">Zero-Retention:</span>
                <span className="font-semibold text-[#1A1A1A] dark:text-white">Encrypted Memory Isolation</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#1A1A1A] dark:bg-[#F1BE38] text-white dark:text-[#0B0B0E] text-xs sm:text-sm font-semibold hover:bg-black dark:hover:bg-[#FFD25E] transition-all shadow-xs dark:shadow-[0_0_20px_rgba(241,190,56,0.25)] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-[#D4A017] dark:text-[#0B0B0E]" />
                <span>Submit Another Inquiry or Case</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* Working Form */
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white dark:bg-[#131319] border border-[#D9D4C8] dark:border-white/10 p-6 sm:p-10 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-6"
          >
            {/* Row 1: Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                  First Name <span className="text-[#C0392B] dark:text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Jane"
                  className="w-full px-4 py-3 rounded-2xl border border-[#D9D4C8] dark:border-white/15 bg-[#FAF6EE]/50 dark:bg-[#1A1A24] focus:bg-white dark:focus:bg-[#20202D] text-sm text-[#1A1A1A] dark:text-white placeholder-[#9A9895] dark:placeholder-[#6E6B65] focus:outline-hidden focus:ring-2 focus:ring-[#D4A017] dark:focus:ring-[#F1BE38] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                  className="w-full px-4 py-3 rounded-2xl border border-[#D9D4C8] dark:border-white/15 bg-[#FAF6EE]/50 dark:bg-[#1A1A24] focus:bg-white dark:focus:bg-[#20202D] text-sm text-[#1A1A1A] dark:text-white placeholder-[#9A9895] dark:placeholder-[#6E6B65] focus:outline-hidden focus:ring-2 focus:ring-[#D4A017] dark:focus:ring-[#F1BE38] transition-all"
                />
              </div>
            </div>

            {/* Row 2: Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                  Email Address <span className="text-[#C0392B] dark:text-[#EF4444]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7A7875] dark:text-[#8E8B84] absolute left-4 top-3.5" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#D9D4C8] dark:border-white/15 bg-[#FAF6EE]/50 dark:bg-[#1A1A24] focus:bg-white dark:focus:bg-[#20202D] text-sm text-[#1A1A1A] dark:text-white placeholder-[#9A9895] dark:placeholder-[#6E6B65] focus:outline-hidden focus:ring-2 focus:ring-[#D4A017] dark:focus:ring-[#F1BE38] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#7A7875] dark:text-[#8E8B84] absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#D9D4C8] dark:border-white/15 bg-[#FAF6EE]/50 dark:bg-[#1A1A24] focus:bg-white dark:focus:bg-[#20202D] text-sm text-[#1A1A1A] dark:text-white placeholder-[#9A9895] dark:placeholder-[#6E6B65] focus:outline-hidden focus:ring-2 focus:ring-[#D4A017] dark:focus:ring-[#F1BE38] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Organization & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                  Organization / Entity
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-[#7A7875] dark:text-[#8E8B84] absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    placeholder="Financial Services, Enterprise, or Individual"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-[#D9D4C8] dark:border-white/15 bg-[#FAF6EE]/50 dark:bg-[#1A1A24] focus:bg-white dark:focus:bg-[#20202D] text-sm text-[#1A1A1A] dark:text-white placeholder-[#9A9895] dark:placeholder-[#6E6B65] focus:outline-hidden focus:ring-2 focus:ring-[#D4A017] dark:focus:ring-[#F1BE38] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                  Incident Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-[#D9D4C8] dark:border-white/15 bg-[#FAF6EE]/50 dark:bg-[#1A1A24] focus:bg-white dark:focus:bg-[#20202D] text-sm text-[#1A1A1A] dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#D4A017] dark:focus:ring-[#F1BE38] transition-all cursor-pointer"
                >
                  <option value="emergency_scam" className="dark:bg-[#14141B]">Emergency: Active Voice Scam / Extortion Call</option>
                  <option value="executive_clone" className="dark:bg-[#14141B]">Executive / CEO Voice Impersonation</option>
                  <option value="false_positive" className="dark:bg-[#14141B]">False Positive Review on Real Recording</option>
                  <option value="enterprise_api" className="dark:bg-[#14141B]">Enterprise Detection API & Custom Model Setup</option>
                  <option value="research_collaboration" className="dark:bg-[#14141B]">Audio Dataset & AI Research Collaboration</option>
                </select>
              </div>
            </div>

            {/* Urgency Selector */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                Response Priority
              </label>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: 'critical' })}
                  className={`p-3 rounded-2xl font-bold border text-center transition-all cursor-pointer ${
                    formData.urgency === 'critical'
                      ? 'bg-[#C0392B] dark:bg-[#EF4444] text-white border-[#C0392B] dark:border-[#EF4444] shadow-xs'
                      : 'bg-[#FAF6EE] dark:bg-[#1A1A24] text-[#5A5852] dark:text-[#C5C2BA] border-[#D9D4C8] dark:border-white/10 hover:bg-[#F0EBE0] dark:hover:bg-[#222230]'
                  }`}
                >
                  Critical (Within 1 hr)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: 'high' })}
                  className={`p-3 rounded-2xl font-bold border text-center transition-all cursor-pointer ${
                    formData.urgency === 'high'
                      ? 'bg-[#1A1A1A] dark:bg-[#F1BE38] text-white dark:text-[#0B0B0E] border-[#1A1A1A] dark:border-[#F1BE38] shadow-xs'
                      : 'bg-[#FAF6EE] dark:bg-[#1A1A24] text-[#5A5852] dark:text-[#C5C2BA] border-[#D9D4C8] dark:border-white/10 hover:bg-[#F0EBE0] dark:hover:bg-[#222230]'
                  }`}
                >
                  Standard High (24 hrs)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: 'normal' })}
                  className={`p-3 rounded-2xl font-bold border text-center transition-all cursor-pointer ${
                    formData.urgency === 'normal'
                      ? 'bg-[#2D8A4E] dark:bg-[#2ECC71] text-white dark:text-[#0B0B0E] border-[#2D8A4E] dark:border-[#2ECC71] shadow-xs'
                      : 'bg-[#FAF6EE] dark:bg-[#1A1A24] text-[#5A5852] dark:text-[#C5C2BA] border-[#D9D4C8] dark:border-white/10 hover:bg-[#F0EBE0] dark:hover:bg-[#222230]'
                  }`}
                >
                  General Inquiry
                </button>
              </div>
            </div>

            {/* Evidence Audio File Attachment */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                Attach Audio Evidence (Optional)
              </label>
              <label
                htmlFor="contact-file-upload"
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-dashed border-[#D9D4C8] dark:border-white/15 bg-[#FAF6EE]/50 dark:bg-[#1A1A24] hover:bg-[#FAF6EE] dark:hover:bg-[#20202D] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EAE5DA] dark:bg-[#282834] flex items-center justify-center text-[#1A1A1A] dark:text-[#F1BE38]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-semibold text-[#1A1A1A] dark:text-white">
                      {attachedFile ? attachedFile.name : 'Click or drop suspicious audio recording'}
                    </div>
                    <div className="text-[11px] text-[#7A7875] dark:text-[#8E8B84]">
                      WAV, MP3, M4A, OGG up to 25MB
                    </div>
                  </div>
                </div>

                <input
                  id="contact-file-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachedFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>

            {/* Incident Description */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] dark:text-white uppercase tracking-wider mb-2">
                Incident Summary & Context <span className="text-[#C0392B] dark:text-[#EF4444]">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please describe how the call was received, suspicious demands (wires, gift cards, passwords), purported caller identity, and any acoustic oddities you noticed..."
                className="w-full px-4 py-3 rounded-2xl border border-[#D9D4C8] dark:border-white/15 bg-[#FAF6EE]/50 dark:bg-[#1A1A24] focus:bg-white dark:focus:bg-[#20202D] text-sm text-[#1A1A1A] dark:text-white placeholder-[#9A9895] dark:placeholder-[#6E6B65] focus:outline-hidden focus:ring-2 focus:ring-[#D4A017] dark:focus:ring-[#F1BE38] transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-md dark:shadow-[0_0_24px_rgba(241,190,56,0.25)] transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin text-[#D4A017] dark:text-[#0B0B0E]" />
                    <span>Transmitting Encrypted Ticket...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 text-[#D4A017] dark:text-[#0B0B0E]" />
                    <span>Submit Forensic Report & Inquiry</span>
                  </>
                )}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
