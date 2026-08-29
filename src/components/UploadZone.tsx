import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileAudio,
  CheckCircle2,
  AlertTriangle,
  Download,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Volume2,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AnalysisResult, analyzeAudioClip } from '../utils/audioEngine';
import { generateForensicPdfReport } from '../utils/pdfExport';

interface UploadZoneProps {
  onAnalyzeComplete: (result: AnalysisResult, fileName: string) => void;
  externalAudioTrigger?: {
    name: string;
    sampleType?: 'ceo' | 'family' | 'bank' | 'clone';
    size: number;
    type: string;
  } | null;
  onClearTrigger?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onAnalyzeComplete,
  externalAudioTrigger,
  onClearTrigger,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | { name: string; size: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [showAdvancedForensics, setShowAdvancedForensics] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle external trigger from sample voice cards
  useEffect(() => {
    if (externalAudioTrigger) {
      handleExternalSample(externalAudioTrigger);
    }
  }, [externalAudioTrigger]);

  const handleExternalSample = async (sample: {
    name: string;
    sampleType?: 'ceo' | 'family' | 'bank' | 'clone';
    size: number;
    type: string;
  }) => {
    setSelectedFile({ name: sample.name, size: sample.size });
    setResult(null);
    setIsAnalyzing(true);
    setProgress(5);
    setStatusText('Loading sample voice signature...');

    try {
      const res = await analyzeAudioClip(sample, (pct, msg) => {
        setProgress(pct);
        setStatusText(msg);
      });
      setResult(res);
      onAnalyzeComplete(res, sample.name);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
      if (onClearTrigger) onClearTrigger();
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Validate audio file
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/m4a', 'audio/x-m4a', 'audio/flac'];
    const validExtensions = ['.wav', '.mp3', '.ogg', '.m4a', '.flac', '.aac'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExt) {
      alert('Please upload a valid audio file (.wav, .mp3, .m4a, .flac, .ogg)');
      return;
    }

    setSelectedFile(file);
    setResult(null);
    setIsAnalyzing(true);
    setProgress(5);
    setStatusText('Ingesting raw audio stream...');

    try {
      const res = await analyzeAudioClip(file, (pct, msg) => {
        setProgress(pct);
        setStatusText(msg);
      });
      setResult(res);
      onAnalyzeComplete(res, file.name);
    } catch (err) {
      console.error(err);
      alert('Error analyzing audio file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setProgress(0);
    setStatusText('');
    setShowAdvancedForensics(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadPdf = () => {
    if (!result || !selectedFile) return;
    try {
      generateForensicPdfReport(
        selectedFile.name,
        result,
        'size' in selectedFile ? selectedFile.size : undefined
      );
      setExportNotice('Forensic PDF Report downloaded successfully!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (e) {
      console.error('PDF export failed:', e);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleDownloadJson = () => {
    if (!result || !selectedFile) return;
    const exportData = {
      app: 'DeepfakeGuard AI',
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      file: {
        name: selectedFile.name,
        sizeBytes: 'size' in selectedFile ? selectedFile.size : undefined,
      },
      verdict: {
        isAuthentic: result.isAuthentic,
        confidencePercent: result.confidence,
        riskLevel: result.riskLevel,
        humanSummary: result.summary,
      },
      humanAcousticIndicators: {
        naturalBreathScore: result.humanBreathScore,
        vocalTremorScore: result.vocalTremorScore,
        robotGlitchScore: result.robotGlitchScore,
        roomAcousticsScore: result.roomAcousticScore,
      },
      engineeringMetrics: {
        spectralArtifactsScore: result.spectralArtifactsScore,
        pitchConsistencyScore: result.pitchConsistencyScore,
        formantJitterScore: result.formantJitterScore,
        acousticCoherenceScore: result.acousticCoherenceScore,
        durationSeconds: result.duration,
        sampleRateHz: result.sampleRate,
        anomalies: result.detectedAnomalies,
        timestamps: result.forensicTimestamps,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepfakeguard-analysis-${selectedFile.name.replace(/\.[^/.]+$/, '')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportNotice('JSON Telemetry exported successfully!');
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div id="audio-upload-zone" className="w-full max-w-4xl mx-auto px-4">
      {/* Upload Drag & Drop Box */}
      {!result && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 border-2 border-dashed ${
            dragActive
              ? 'border-[#D4A017] dark:border-[#F1BE38] bg-[#FAF6EE] dark:bg-[#1C180E] scale-[1.01] shadow-lg dark:shadow-[0_0_30px_rgba(241,190,56,0.15)]'
              : 'border-[#D9D4C8] dark:border-white/15 bg-white/70 dark:bg-[#14141A]/90 hover:bg-white dark:hover:bg-[#181822] hover:border-[#1A1A1A]/40 dark:hover:border-[#F1BE38]/50 shadow-xs hover:shadow-md dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="audio-file-input"
            accept="audio/wav,audio/mp3,audio/mpeg,audio/ogg,audio/m4a,audio/flac,.wav,.mp3,.m4a,.flac"
            className="hidden"
            onChange={handleChange}
          />

          {/* Upload Graphic */}
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#F0EBE0] dark:bg-[#1F1F2B] group-hover:bg-[#FAF6EE] dark:group-hover:bg-[#282837] flex items-center justify-center text-[#1A1A1A] dark:text-[#F1BE38] mb-5 transition-all duration-300 group-hover:scale-105 group-hover:shadow-sm">
            <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-[#1A1A1A] dark:text-[#F1BE38] transition-transform duration-300 group-hover:-translate-y-1" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2 tracking-tight">
            Drop your voice or call recording here
          </h3>
          <p className="text-sm sm:text-base text-[#6B6864] dark:text-[#A8A49C] max-w-md mx-auto mb-6">
            Upload voicemail, suspicious phone calls, voice notes, or MP3s to verify whether they were generated by AI.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-xs sm:text-sm font-semibold transition-all shadow-xs dark:shadow-[0_0_20px_rgba(241,190,56,0.25)]">
            <FileAudio className="w-4 h-4 text-[#D4A017] dark:text-[#0B0B0E]" />
            <span>Select Audio File from Device</span>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-[#8A8680] dark:text-[#7A7770]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] dark:bg-[#F1BE38]" /> Supports WAV, MP3, M4A, FLAC, OGG
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A4E] dark:bg-[#2ECC71]" /> Zero Data Retention Policy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A1A1A] dark:bg-white/60" /> Max 50 MB
            </span>
          </div>
        </motion.div>
      )}

      {/* Analyzing Progress State */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-white dark:bg-[#14141B] p-8 sm:p-12 text-center border border-[#D9D4C8] dark:border-white/10 shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-[#FAF6EE] dark:bg-[#211A0E] border-2 border-[#D4A017] dark:border-[#F1BE38] flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(241,190,56,0.15)]">
            <Activity className="w-8 h-8 text-[#D4A017] dark:text-[#F1BE38] animate-pulse" />
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] dark:text-white mb-2">
            Running Deepfake Acoustic Forensics
          </h3>
          <p className="text-sm text-[#7A7875] dark:text-[#9A968F] mb-6 font-mono">
            {selectedFile?.name}
          </p>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <div className="w-full bg-[#EAE5DA] dark:bg-[#22222E] rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-[#D4A017] dark:bg-[#F1BE38] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeInOut' }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#7A7875] dark:text-[#9A968F] mt-2">
              <span className="font-medium text-[#1A1A1A] dark:text-white">{statusText}</span>
              <span className="font-mono font-semibold">{progress}%</span>
            </div>
          </div>

          {/* Animated Waveform Bars */}
          <div className="flex items-center justify-center gap-1 h-12 max-w-xs mx-auto mt-6">
            {Array.from({ length: 24 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-[#1A1A1A] dark:bg-[#F1BE38] rounded-full"
                animate={{
                  height: [8, Math.random() * 36 + 10, 8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  delay: i * 0.04,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}

      {/* Analysis Results Display */}
      {result && selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-6"
        >
          {/* Main Verdict Card */}
          <div
            className={`rounded-3xl p-6 sm:p-8 border shadow-sm dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)] transition-all duration-300 relative overflow-hidden ${
              result.isAuthentic
                ? 'bg-white dark:bg-[#121217] border-[#2D8A4E]/30 dark:border-[#2ECC71]/35'
                : 'bg-white dark:bg-[#121217] border-[#C0392B]/30 dark:border-[#EF4444]/35'
            }`}
          >
            {/* Top Accent Bar */}
            <div
              className={`absolute top-0 left-0 right-0 h-2 ${
                result.isAuthentic ? 'bg-[#2D8A4E] dark:bg-[#2ECC71]' : 'bg-[#C0392B] dark:bg-[#EF4444]'
              }`}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#EAE5DA] dark:border-white/10">
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
                    result.isAuthentic
                      ? 'bg-[#2D8A4E]/10 dark:bg-[#2ECC71]/15 text-[#2D8A4E] dark:text-[#2ECC71]'
                      : 'bg-[#C0392B]/10 dark:bg-[#EF4444]/15 text-[#C0392B] dark:text-[#EF4444]'
                  }`}
                >
                  {result.isAuthentic ? (
                    <ShieldCheck className="w-8 h-8" />
                  ) : (
                    <ShieldAlert className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                        result.isAuthentic
                          ? 'bg-[#2D8A4E]/15 dark:bg-[#2ECC71]/20 text-[#2D8A4E] dark:text-[#3DE884]'
                          : 'bg-[#C0392B]/15 dark:bg-[#EF4444]/20 text-[#C0392B] dark:text-[#F87171]'
                      }`}
                    >
                      {result.isAuthentic ? 'Verified Authentic' : 'Critical Scam Alert'}
                    </span>
                    <span className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-mono">
                      {selectedFile.name}
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A1A] dark:text-white tracking-tight">
                    {result.isAuthentic
                      ? 'Human Voice Verified'
                      : 'Synthetic AI Voice Detected'}
                  </h2>
                  <p className="text-sm sm:text-base text-[#5A5852] dark:text-[#C5C2BA] mt-1">
                    {result.summary}
                  </p>
                </div>
              </div>

              {/* Confidence Circle / Metric */}
              <div className="flex flex-col items-center md:items-end justify-center bg-[#FAF6EE] dark:bg-[#191922] px-6 py-4 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                <span className="text-xs uppercase tracking-wider font-bold text-[#7A7875] dark:text-[#9A968F]">
                  Certainty
                </span>
                <span
                  className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
                    result.isAuthentic ? 'text-[#2D8A4E] dark:text-[#2ECC71]' : 'text-[#C0392B] dark:text-[#EF4444]'
                  }`}
                >
                  {result.confidence.toFixed(1)}%
                </span>
                <span className="text-[11px] text-[#7A7875] dark:text-[#9A968F]">Forensic Match</span>
              </div>
            </div>

            {/* Plain-Language Practical Guidance */}
            <div
              className={`mt-6 p-4 sm:p-5 rounded-2xl border ${
                result.isAuthentic
                  ? 'bg-[#F2F9F4] dark:bg-[#0D2418] border-[#2D8A4E]/20 dark:border-[#2ECC71]/30 text-[#1E5631] dark:text-[#68D391]'
                  : 'bg-[#FCF2F2] dark:bg-[#260E0E] border-[#C0392B]/20 dark:border-[#EF4444]/30 text-[#8B1E14] dark:text-[#FCA5A5]'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.isAuthentic ? (
                  <CheckCircle2 className="w-5 h-5 text-[#2D8A4E] dark:text-[#2ECC71] shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-[#C0392B] dark:text-[#EF4444] shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm sm:text-base mb-1">
                    {result.isAuthentic
                      ? 'Action Advice: Safe to Proceed'
                      : 'Immediate Action Required: Do Not Comply With Requests'}
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed opacity-90">
                    {result.plainAdvice}
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Easy-To-Understand Human Cards */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#7A7875] dark:text-[#9A968F] mb-3">
                Key Acoustic Authenticity Indicators
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Human Breath */}
                <div className="bg-[#FAF6EE] dark:bg-[#181822] p-3.5 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                  <div className="text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] mb-1">
                    Natural Breathing
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      result.isAuthentic ? 'text-[#2D8A4E] dark:text-[#2ECC71]' : 'text-[#C0392B] dark:text-[#EF4444]'
                    }`}
                  >
                    {result.humanBreathScore}%
                  </div>
                  <div className="text-[11px] text-[#5A5852] dark:text-[#B0ACA4] mt-0.5">
                    {result.isAuthentic
                      ? 'Organic lung pauses'
                      : 'Missing natural breaths'}
                  </div>
                </div>

                {/* 2. Vocal Cord Tremor */}
                <div className="bg-[#FAF6EE] dark:bg-[#181822] p-3.5 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                  <div className="text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] mb-1">
                    Vocal Micro-Jitter
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      result.isAuthentic ? 'text-[#2D8A4E] dark:text-[#2ECC71]' : 'text-[#C0392B] dark:text-[#EF4444]'
                    }`}
                  >
                    {result.vocalTremorScore}%
                  </div>
                  <div className="text-[11px] text-[#5A5852] dark:text-[#B0ACA4] mt-0.5">
                    {result.isAuthentic
                      ? 'Biological vocal cords'
                      : 'Robotic flatline tone'}
                  </div>
                </div>

                {/* 3. AI Glitch Score */}
                <div className="bg-[#FAF6EE] dark:bg-[#181822] p-3.5 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                  <div className="text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] mb-1">
                    AI Glitch Index
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      !result.isAuthentic ? 'text-[#C0392B] dark:text-[#EF4444]' : 'text-[#2D8A4E] dark:text-[#2ECC71]'
                    }`}
                  >
                    {result.robotGlitchScore}%
                  </div>
                  <div className="text-[11px] text-[#5A5852] dark:text-[#B0ACA4] mt-0.5">
                    {result.isAuthentic
                      ? 'No vocoder artifacts'
                      : 'Neural synth artifacts'}
                  </div>
                </div>

                {/* 4. Room Acoustics */}
                <div className="bg-[#FAF6EE] dark:bg-[#181822] p-3.5 rounded-2xl border border-[#EAE5DA] dark:border-white/10">
                  <div className="text-[11px] font-bold text-[#7A7875] dark:text-[#8E8B84] mb-1">
                    Physical Space Acoustics
                  </div>
                  <div
                    className={`text-xl font-bold ${
                      result.isAuthentic ? 'text-[#2D8A4E] dark:text-[#2ECC71]' : 'text-[#C0392B] dark:text-[#EF4444]'
                    }`}
                  >
                    {result.roomAcousticScore}%
                  </div>
                  <div className="text-[11px] text-[#5A5852] dark:text-[#B0ACA4] mt-0.5">
                    {result.isAuthentic
                      ? 'Real 3D room echo'
                      : 'Sterile digital cuts'}
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Waveform Inspection Preview */}
            <div className="mt-6 bg-[#1A1A1A] dark:bg-[#0A0A0E] p-4 sm:p-5 rounded-2xl text-white border border-white/5 dark:border-white/10">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="font-semibold text-[#D4A017] dark:text-[#F1BE38] flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" /> Acoustic Waveform Analysis
                </span>
                <span className="font-mono text-white/60">
                  {result.duration.toFixed(1)}s • {result.sampleRate} Hz
                </span>
              </div>

              {/* Waveform Bar Graphic */}
              <div className="flex items-center justify-between gap-1 h-16 w-full px-2 bg-black/40 rounded-xl">
                {result.waveformBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-full transition-all duration-300 ${
                      !result.isAuthentic && i > 12 && i < 28
                        ? 'bg-[#E74C3C] dark:bg-[#EF4444]'
                        : 'bg-[#D4A017] dark:bg-[#F1BE38]'
                    }`}
                    style={{ height: `${Math.max(12, bar * 100)}%` }}
                    title={`Timestamp ${((i / result.waveformBars.length) * result.duration).toFixed(1)}s`}
                  />
                ))}
              </div>
            </div>

            {/* Action Buttons: PDF Export, JSON Export, Reset */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#EAE5DA] dark:border-white/10">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* PDF Export Button */}
                <button
                  id="download-pdf-report-btn"
                  onClick={handleDownloadPdf}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1A1A] hover:bg-black dark:bg-[#F1BE38] dark:hover:bg-[#FFD25E] text-white dark:text-[#0B0B0E] text-xs sm:text-sm font-semibold transition-all shadow-xs dark:shadow-[0_0_20px_rgba(241,190,56,0.2)] cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4 text-[#D4A017] dark:text-[#0B0B0E]" />
                  <span>Download Forensic PDF</span>
                </button>

                {/* JSON Export */}
                <button
                  id="download-json-telemetry-btn"
                  onClick={handleDownloadJson}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#FAF6EE] hover:bg-[#F0EBE0] dark:bg-[#1B1B25] dark:hover:bg-[#232330] text-[#1A1A1A] dark:text-white text-xs sm:text-sm font-semibold border border-[#D9D4C8] dark:border-white/10 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#7A7875] dark:text-[#A09D96]" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Toggle Advanced Telemetry */}
                <button
                  id="toggle-advanced-metrics-btn"
                  onClick={() => setShowAdvancedForensics(!showAdvancedForensics)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#5A5852] dark:text-[#C5C2BA] hover:text-[#1A1A1A] dark:hover:text-white hover:bg-[#FAF6EE] dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <span>{showAdvancedForensics ? 'Hide Technical Data' : 'View Engineering Forensics'}</span>
                  {showAdvancedForensics ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {/* Analyze Another File */}
                <button
                  id="analyze-another-btn"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EAE5DA] hover:bg-[#DDD8CC] dark:bg-[#23232F] dark:hover:bg-[#2D2D3B] text-[#1A1A1A] dark:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Analyze Another</span>
                </button>
              </div>
            </div>

            {/* Export Success Banner */}
            <AnimatePresence>
              {exportNotice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 p-3 rounded-xl bg-[#2D8A4E]/10 dark:bg-[#2ECC71]/15 border border-[#2D8A4E]/30 dark:border-[#2ECC71]/35 text-[#2D8A4E] dark:text-[#3DE884] text-xs font-bold flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{exportNotice}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Expandable Advanced Engineering Forensics */}
          <AnimatePresence>
            {showAdvancedForensics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="rounded-3xl bg-white dark:bg-[#131318] p-6 sm:p-8 border border-[#D9D4C8] dark:border-white/10 shadow-xs dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[#1A1A1A] dark:text-white">
                        Acoustic Signal & Neural Vocoder Telemetry
                      </h3>
                      <p className="text-xs text-[#7A7875] dark:text-[#8E8B84]">
                        Detailed quantitative measurements extracted from the speech spectrogram
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF6EE] dark:bg-[#1D1D28] border border-[#EAE5DA] dark:border-white/10 text-[11px] font-mono text-[#5A5852] dark:text-[#C5C2BA]">
                      Wav2Vec2 + Spectral Analysis
                    </span>
                  </div>

                  {/* 4 Technical Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                      <div className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-medium mb-1">
                        Spectral Phase Glitch
                      </div>
                      <div className="text-2xl font-bold font-mono text-[#1A1A1A] dark:text-white">
                        {result.spectralArtifactsScore.toFixed(1)} dB
                      </div>
                      <p className="text-[11px] text-[#7A7875] dark:text-[#7A7770] mt-1">
                        High scores indicate neural model synthesis flaws
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                      <div className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-medium mb-1">
                        Pitch Naturalness Index
                      </div>
                      <div className="text-2xl font-bold font-mono text-[#1A1A1A] dark:text-white">
                        {result.pitchConsistencyScore.toFixed(1)}%
                      </div>
                      <p className="text-[11px] text-[#7A7875] dark:text-[#7A7770] mt-1">
                        Human voice pitch fluctuates naturally with emotion
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                      <div className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-medium mb-1">
                        Formant Phase Jitter
                      </div>
                      <div className="text-2xl font-bold font-mono text-[#1A1A1A] dark:text-white">
                        {result.formantJitterScore.toFixed(1)}%
                      </div>
                      <p className="text-[11px] text-[#7A7875] dark:text-[#7A7770] mt-1">
                        Vocal tract resonances and mouth geometry tracking
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                      <div className="text-xs text-[#7A7875] dark:text-[#8E8B84] font-medium mb-1">
                        Acoustic Coherence
                      </div>
                      <div className="text-2xl font-bold font-mono text-[#1A1A1A] dark:text-white">
                        {result.acousticCoherenceScore.toFixed(1)}%
                      </div>
                      <p className="text-[11px] text-[#7A7875] dark:text-[#7A7770] mt-1">
                        Temporal consistency across full audio waveform
                      </p>
                    </div>
                  </div>

                  {/* Detected Anomalies List */}
                  {result.detectedAnomalies.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#FAF6EE] dark:bg-[#1A1A24] border border-[#EAE5DA] dark:border-white/10">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] dark:text-white mb-3">
                        Forensic Observations Log
                      </h4>
                      <ul className="space-y-2">
                        {result.detectedAnomalies.map((item, idx) => (
                          <li
                            key={idx}
                            className="text-xs sm:text-sm text-[#4A4A48] dark:text-[#C5C2BA] flex items-start gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A017] dark:bg-[#F1BE38] shrink-0 mt-2" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};
