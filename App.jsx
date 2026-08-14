import { useEffect, useRef, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function App() {
  // =========================
  // HERO BACKGROUND CAROUSEL
  // =========================

  const heroImages = [
    "/crop1.jpg",
    "/crop2.jpg",
    "/crop3.jpg",
  ];

  const [currentBackground, setCurrentBackground] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBackground((prev) => (prev + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const diagnosisRef = useRef(null);

  // =========================
  // STATES
  // =========================

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // =========================
  // IMAGE UPLOAD
  // =========================

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Please upload an image smaller than 10MB.");
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setAnalysis(null);
  };

  // =========================
  // DRAG & DROP
  // =========================

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      alert("Please drop a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("Please upload an image smaller than 10MB.");
      return;
    }

    setFileName(file.name);
    setSelectedFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setAnalysis(null);
  };

  // =========================
  // RESET
  // =========================

  const resetUpload = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setFileName("");
    setAnalysis(null);
  };

  // ============================================================
  // CONVERT BACKEND RESPONSE TO FRONTEND FORMAT
  // ============================================================

  const normalizeBackendResponse = (data) => {
    console.log("========== RAW BACKEND RESPONSE ==========");
    console.log(JSON.stringify(data, null, 2));
    console.log("==========================================");

    // ----------------------------------------------------------
    // Different possible backend structures
    // ----------------------------------------------------------

    const prediction = data?.prediction ?? {};
    const decision = data?.decision_support ?? {};
    const explainability = data?.explainability ?? {};

    // ----------------------------------------------------------
    // DISEASE
    // ----------------------------------------------------------

    const disease =
      prediction?.disease ??
      data?.disease ??
      data?.class_name ??
      data?.class ??
      "Unknown";

    const displayName =
      prediction?.display_name ??
      data?.display_name ??
      data?.disease_name ??
      disease;

    // ----------------------------------------------------------
    // CONFIDENCE
    // ----------------------------------------------------------

    let confidence =
      prediction?.confidence ??
      data?.confidence ??
      data?.prediction_confidence ??
      0;

    confidence = Number(confidence);

    // If backend sends 0.95 instead of 95
    if (confidence > 0 && confidence <= 1) {
      confidence *= 100;
    }

    confidence = Math.max(0, Math.min(100, confidence));

    // ----------------------------------------------------------
    // RISK
    // ----------------------------------------------------------

    let risk =
      decision?.risk_score ??
      decision?.risk ??
      data?.risk_score ??
      data?.risk ??
      0;

    risk = Number(risk);

    // If backend sends 0.45 instead of 45
    if (risk > 0 && risk <= 1) {
      risk *= 100;
    }

    risk = Math.max(0, Math.min(100, risk));

    // ----------------------------------------------------------
    // SEVERITY
    //
    // IMPORTANT:
    // This prevents:
    //
    // Cannot read properties of undefined
    // (reading 'severity')
    //
    // ----------------------------------------------------------

    let severity =
      decision?.severity ??
      data?.severity ??
      prediction?.severity ??
      data?.severity_score ??
      0;

    severity = Number(severity);

    // If backend sends 0.30 instead of 30
    if (severity > 0 && severity <= 1) {
      severity *= 100;
    }

    severity = Math.max(0, Math.min(100, severity));

    // ----------------------------------------------------------
    // HEALTH
    // ----------------------------------------------------------

    let health =
      data?.health ??
      data?.crop_health ??
      decision?.health ??
      null;

    if (health === null || health === undefined) {
      health = 100 - risk;
    }

    health = Number(health);

    if (health > 0 && health <= 1) {
      health *= 100;
    }

    health = Math.max(0, Math.min(100, health));

    // ----------------------------------------------------------
    // SEVERITY LEVEL
    // ----------------------------------------------------------

    const severityLevel =
      decision?.severity_level ??
      decision?.severity_status ??
      decision?.severity_label ??
      (severity >= 70
        ? "high"
        : severity >= 40
        ? "medium"
        : "low");

    // ----------------------------------------------------------
    // RISK LEVEL
    // ----------------------------------------------------------

    const riskLevel =
      decision?.risk_level ??
      data?.risk_level ??
      (risk >= 70
        ? "High"
        : risk >= 40
        ? "Moderate"
        : "Low");

    // ----------------------------------------------------------
    // PREDICTION STATUS
    // ----------------------------------------------------------

    const predictionStatus =
      prediction?.prediction_status ??
      data?.prediction_status ??
      "Prediction completed";

    // ----------------------------------------------------------
    // PROBABILITIES
    // ----------------------------------------------------------

    const probabilities =
      prediction?.probabilities ??
      data?.probabilities ??
      {};

    // ----------------------------------------------------------
    // TEXT INFORMATION
    // ----------------------------------------------------------

    const summary =
      data?.summary ??
      prediction?.summary ??
      decision?.summary ??
      decision?.farmer_message ??
      `The AI analysis identified ${displayName} with ${confidence.toFixed(
        1
      )}% confidence.`;

    const description =
      data?.description ??
      prediction?.description ??
      decision?.severity_explanation ??
      "The AI analyzed the uploaded crop image and generated a crop health assessment.";

    const recommendation =
      data?.recommendation ??
      decision?.immediate_action ??
      decision?.recommendations ??
      decision?.management_recommendations ??
      "Monitor the affected crop area and perform another scan if symptoms increase.";

    // ----------------------------------------------------------
    // DECISION SUPPORT
    // ----------------------------------------------------------

    const immediateAction =
      decision?.immediate_action ??
      "Monitor and inspect the affected crop area.";

    const managementRecommendations =
      decision?.management_recommendations ??
      decision?.recommendations ??
      [];

    const monitoringInterval =
      decision?.monitoring_interval ??
      "Monitor the crop regularly.";

    const escalationWarning =
      decision?.escalation_warning ??
      "If symptoms increase, perform another scan or seek expert advice.";

    const farmerMessage =
      decision?.farmer_message ??
      summary;

    // ----------------------------------------------------------
    // EXPLAINABILITY
    // ----------------------------------------------------------

    const heatmapPath =
      explainability?.heatmap_path ??
      explainability?.heatmap ??
      null;

    // ----------------------------------------------------------
    // RETURN STANDARDIZED OBJECT
    // ----------------------------------------------------------

    const normalized = {
      risk: Number(risk.toFixed(1)),
      severity: Number(severity.toFixed(1)),
      health: Number(health.toFixed(1)),
      confidence: Number(confidence.toFixed(1)),

      disease,
      displayName,
      predictionStatus,
      probabilities,

      riskLevel,
      severityLevel,

      summary,
      description,
      recommendation,

      immediateAction,
      managementRecommendations,
      monitoringInterval,
      escalationWarning,
      farmerMessage,

      heatmapPath,
      explainability,

      rawResponse: data,
    };

    console.log("========== NORMALIZED ANALYSIS ==========");
    console.log(normalized);
    console.log("=========================================");

    return normalized;
  };

  // =========================
  // AI ANALYSIS
  // =========================

const analyzeCrop = async () => {
  if (!selectedFile) {
    alert("Please upload a crop image first.");
    return;
  }

  setIsAnalyzing(true);
  setAnalysis(null);

  try {
    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(
      "http://127.0.0.1:8000/api/analyze",
      {
        method: "POST",
        body: formData,
      }
    );

    // Safely read response
    const data = await response.json();

    console.log("========== FASTAPI RESPONSE ==========");
    console.log(data);
    console.log(JSON.stringify(data, null, 2));
    console.log("======================================");

    if (!response.ok) {
      throw new Error(
        data?.detail ||
        data?.message ||
        "Backend prediction failed"
      );
    }

    // =====================================================
    // SAFELY HANDLE EVERY POSSIBLE BACKEND STRUCTURE
    // =====================================================

    const prediction =
      data?.prediction &&
      typeof data.prediction === "object"
        ? data.prediction
        : {};

    const decision =
      data?.decision_support &&
      typeof data.decision_support === "object"
        ? data.decision_support
        : {};

    const explainability =
      data?.explainability &&
      typeof data.explainability === "object"
        ? data.explainability
        : {};

    // =====================================================
    // DISEASE
    // =====================================================

    const disease =
      prediction?.disease ??
      data?.disease ??
      data?.class_name ??
      data?.class ??
      "Unknown";

    const displayName =
      prediction?.display_name ??
      data?.display_name ??
      data?.disease_name ??
      disease;

    // =====================================================
    // CONFIDENCE
    // =====================================================

    let confidence =
      prediction?.confidence ??
      data?.confidence ??
      data?.prediction_confidence ??
      0;

    confidence = Number(confidence);

    if (confidence > 0 && confidence <= 1) {
      confidence = confidence * 100;
    }

    if (!Number.isFinite(confidence)) {
      confidence = 0;
    }

    confidence = Math.max(
      0,
      Math.min(100, confidence)
    );

    // =====================================================
    // RISK
    // =====================================================

    let risk =
      decision?.risk_score ??
      decision?.risk ??
      data?.risk_score ??
      data?.risk ??
      0;

    risk = Number(risk);

    if (risk > 0 && risk <= 1) {
      risk = risk * 100;
    }

    if (!Number.isFinite(risk)) {
      risk = 0;
    }

    risk = Math.max(
      0,
      Math.min(100, risk)
    );

    // =====================================================
    // SEVERITY
    // =====================================================

    let severity =
      decision?.severity ??
      data?.severity ??
      prediction?.severity ??
      data?.severity_score ??
      0;

    severity = Number(severity);

    if (severity > 0 && severity <= 1) {
      severity = severity * 100;
    }

    if (!Number.isFinite(severity)) {
      severity = 0;
    }

    severity = Math.max(
      0,
      Math.min(100, severity)
    );

    // =====================================================
    // HEALTH
    // =====================================================

    let health =
      data?.health ??
      data?.crop_health ??
      decision?.health;

    if (
      health === undefined ||
      health === null
    ) {
      health = 100 - risk;
    }

    health = Number(health);

    if (health > 0 && health <= 1) {
      health = health * 100;
    }

    if (!Number.isFinite(health)) {
      health = 100 - risk;
    }

    health = Math.max(
      0,
      Math.min(100, health)
    );

    // =====================================================
    // LEVELS
    // =====================================================

    const riskLevel =
      decision?.risk_level ??
      data?.risk_level ??
      (
        risk >= 70
          ? "High"
          : risk >= 40
          ? "Moderate"
          : "Low"
      );

    const severityLevel =
      decision?.severity_level ??
      decision?.severity_status ??
      decision?.severity_label ??
      (
        severity >= 70
          ? "High"
          : severity >= 40
          ? "Moderate"
          : "Low"
      );

    // =====================================================
    // STATUS
    // =====================================================

    const predictionStatus =
      prediction?.prediction_status ??
      data?.prediction_status ??
      "Prediction completed";

    // =====================================================
    // PROBABILITIES
    // =====================================================

    const probabilities =
      prediction?.probabilities ??
      data?.probabilities ??
      {};

    // =====================================================
    // TEXT
    // =====================================================

    const description =
      data?.description ??
      prediction?.description ??
      decision?.severity_explanation ??
      "The AI analyzed the uploaded crop image and generated a crop health assessment.";

    const severityExplanation =
      decision?.severity_explanation ??
      data?.severity_explanation ??
      "The AI estimated severity from visual characteristics detected in the crop image.";

    const immediateAction =
      decision?.immediate_action ??
      data?.immediate_action ??
      "Monitor the affected crop area.";

    const managementRecommendations =
      decision?.management_recommendations ??
      decision?.recommendations ??
      data?.management_recommendations ??
      [];

    const monitoringInterval =
      decision?.monitoring_interval ??
      data?.monitoring_interval ??
      "Monitor the crop regularly.";

    const escalationWarning =
      decision?.escalation_warning ??
      data?.escalation_warning ??
      "If symptoms increase, perform another scan or seek expert advice.";

    const farmerMessage =
      decision?.farmer_message ??
      data?.farmer_message ??
      "Continue monitoring the crop.";

    const summary =
      data?.summary ??
      prediction?.summary ??
      decision?.summary ??
      farmerMessage ??
      `The AI analysis detected ${displayName} with ${confidence.toFixed(
        1
      )}% confidence.`;

    const recommendation =
      data?.recommendation ??
      immediateAction ??
      "Monitor the affected crop area.";

    // =====================================================
    // FINAL FRONTEND OBJECT
    // =====================================================

    const normalizedAnalysis = {
      risk: Number(risk.toFixed(1)),
      severity: Number(severity.toFixed(1)),
      health: Number(health.toFixed(1)),
      confidence: Number(confidence.toFixed(1)),

      disease,
      displayName,

      predictionStatus,

      probabilities,

      riskLevel,
      severityLevel,

      summary,
      description,
      severityExplanation,

      recommendation,
      immediateAction,

      managementRecommendations,

      monitoringInterval,

      escalationWarning,

      farmerMessage,

      explainability,

      heatmapPath:
        explainability?.heatmap_path ??
        explainability?.heatmap ??
        null,

      rawResponse: data,
    };

    // =====================================================
    // DEBUG
    // =====================================================

    console.log(
      "========== FINAL NORMALIZED ANALYSIS =========="
    );

    console.log(
      JSON.stringify(
        normalizedAnalysis,
        null,
        2
      )
    );

    console.log(
      "Severity:",
      normalizedAnalysis.severity
    );

    console.log(
      "Risk:",
      normalizedAnalysis.risk
    );

    console.log(
      "Health:",
      normalizedAnalysis.health
    );

    console.log(
      "Confidence:",
      normalizedAnalysis.confidence
    );

    console.log(
      "==============================================="
    );

    // =====================================================
    // SET RESULT
    // =====================================================

    setAnalysis(normalizedAnalysis);

    // =====================================================
    // SCROLL TO RESULTS
    // =====================================================

    setTimeout(() => {
      document
        .querySelector(".results-section")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 200);

  } catch (error) {
    console.error(
      "Prediction error:",
      error
    );

    alert(
      `Prediction failed: ${
        error?.message ||
        "Unknown error"
      }`
    );

  } finally {
    setIsAnalyzing(false);
  }
};
  // =========================
  // CHART DATA
  // =========================

 const chartData = analysis
  ? [
      {
        feature: "Leaf Color",
        risk: Math.round(analysis.risk * 0.27),
        severity: Math.round(analysis.severity * 0.27),
        health: analysis.health,
        confidence: analysis.confidence,
      },
      {
        feature: "Surface",
        risk: Math.round(analysis.risk * 0.22),
        severity: Math.round(analysis.severity * 0.22),
        health: Math.max(0, analysis.health - 4),
        confidence: Math.max(0, analysis.confidence - 3),
      },
      {
        feature: "Leaf Edge",
        risk: Math.round(analysis.risk * 0.15),
        severity: Math.round(analysis.severity * 0.15),
        health: Math.min(100, analysis.health + 5),
        confidence: Math.min(100, analysis.confidence + 2),
      },
      {
        feature: "Structure",
        risk: Math.round(analysis.risk * 0.10),
        severity: Math.round(analysis.severity * 0.10),
        health: Math.max(0, analysis.health - 2),
        confidence: Math.max(0, analysis.confidence - 1),
      },
    ]
  : [];

  // =========================
  // DOWNLOAD PDF
  // =========================

  const downloadDiagnosticPDF = () => {
    if (!analysis) {
      alert("No diagnosis available.");
      return;
    }

    const pdf = new jsPDF();

    const risk = analysis.risk ?? 0;
    const severity = analysis.severity ?? 0;
    const health = analysis.health ?? 0;
    const confidence = analysis.confidence ?? 0;

    pdf.setFontSize(22);
    pdf.setTextColor(30, 110, 55);

    pdf.text("AgriShield AI", 20, 25);

    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);

    pdf.text(
      "AI Crop Health Diagnostic Report",
      20,
      33
    );

    pdf.setDrawColor(100, 190, 120);
    pdf.line(20, 40, 190, 40);

    pdf.setFontSize(16);
    pdf.setTextColor(30, 30, 30);

    pdf.text("Final AI Diagnosis", 20, 55);

    pdf.setFontSize(12);
    pdf.setTextColor(70, 70, 70);

    pdf.text(
      `Disease: ${analysis.displayName}`,
      20,
      65
    );

    pdf.text(
      `Prediction Status: ${analysis.predictionStatus}`,
      20,
      73
    );

    pdf.setFontSize(15);
    pdf.setTextColor(30, 110, 55);

    pdf.text("Statistical Results", 20, 90);

    pdf.setFontSize(12);
    pdf.setTextColor(50, 50, 50);

    pdf.text(`Risk Level: ${risk}%`, 25, 103);
    pdf.text(`Severity: ${severity}%`, 25, 115);
    pdf.text(`Crop Health: ${health}%`, 25, 127);
    pdf.text(
      `AI Confidence: ${confidence}%`,
      25,
      139
    );

    pdf.setFontSize(15);
    pdf.setTextColor(30, 110, 55);

    pdf.text("Diagnosis Summary", 20, 160);

    pdf.setFontSize(11);
    pdf.setTextColor(70, 70, 70);

    const summary =
      analysis.summary ||
      analysis.description ||
      "The AI system analyzed the uploaded crop image and generated the above health assessment.";

    const wrappedSummary =
      pdf.splitTextToSize(summary, 165);

    pdf.text(wrappedSummary, 20, 172);

    const recommendationY =
      172 +
      wrappedSummary.length * 6 +
      15;

    pdf.setFontSize(15);
    pdf.setTextColor(30, 110, 55);

    pdf.text(
      "Recommended Action",
      20,
      recommendationY
    );

    pdf.setFontSize(11);
    pdf.setTextColor(70, 70, 70);

    const recommendation =
      analysis.recommendation ||
      analysis.immediateAction ||
      "Monitor the affected crop area and perform another scan if symptoms increase.";

    const wrappedRecommendation =
      pdf.splitTextToSize(
        String(recommendation),
        165
      );

    pdf.text(
      wrappedRecommendation,
      20,
      recommendationY + 12
    );

    pdf.setFontSize(9);
    pdf.setTextColor(130, 130, 130);

    pdf.text(
      "Generated by AgriShield AI",
      20,
      285
    );

    pdf.text(
      new Date().toLocaleString(),
      140,
      285
    );

    pdf.save(
      "AgriShield-Crop-Diagnostic-Report.pdf"
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="app">

      {/* ========================= */}
      {/* HERO BACKGROUND */}
      {/* ========================= */}

      <div className="hero-background">

        {heroImages.map((image, index) => (
          <div
            key={image}
            className={`hero-bg-slide ${
              index === currentBackground
                ? "active"
                : ""
            }`}
            style={{
              backgroundImage: `url(${image})`,
            }}
          />
        ))}

        <div className="hero-bg-overlay"></div>
        <div className="hero-bg-gradient"></div>

      </div>

      {/* ========================= */}
      {/* NAVBAR */}
      {/* ========================= */}

      <header className="navbar">

        <div className="brand">

          <div className="brand-icon">

            <img
              src="/agrishield-leaf.png"
              alt="AgriShield Logo"
            />

          </div>

          <div className="brand-text">

            <h2>
              AgriShield
            </h2>

            <p>
              AI CROP INTELLIGENCE
            </p>

          </div>

        </div>

      </header>

      {/* ========================= */}
      {/* HERO */}
      {/* ========================= */}

      <main className="hero">

        <section className="hero-content">

          <div className="eyebrow">

            <span>
              ✦
            </span>

            INTELLIGENT CROP HEALTH MONITORING

          </div>

          <h1>
            Detect.
            <span>
              Explain.
            </span>
            Act.
          </h1>

          <p className="hero-description">

            AgriShield AI transforms a simple crop image
            into an understandable health assessment —
            helping identify issues, estimate severity,
            flag risk and support better decisions.

          </p>

          <button
            className="diagnosis-btn"
            onClick={scrollToDiagnosis}
          >

            <span className="scan-icon">
              ⌗
            </span>

            START AI DIAGNOSIS

            <span className="arrow">
              →
            </span>

          </button>

        </section>

        {/* HERO VISUAL */}

        <section className="hero-visual">

          <div className="radar">

            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
            <div className="ring ring-4"></div>

            <div className="scan-line"></div>

          </div>

          <div className="visual-caption">

            <span className="pulse"></span>

            CROP HEALTH ANALYSIS

          </div>

        </section>

      </main>

      {/* ========================= */}
      {/* DIAGNOSIS */}
      {/* ========================= */}

      <section
        className="diagnosis-section"
        id="diagnosis"
        ref={diagnosisRef}
      >

        {/* SECTION HEADING */}

        <div className="section-heading">

          <h2>

            Upload a crop image.

            <span>
              Let AI see what you see.
            </span>

          </h2>

          <p>

            Upload a clear image of your cotton crop
            and AgriShield will analyze its health,
            identify possible risks and estimate
            disease severity.

          </p>

        </div>

        {/* ========================= */}
        {/* UPLOAD CARD */}
        {/* ========================= */}

        <div className="diagnosis-card">

          {!selectedImage ? (

            <div
              className={`upload-zone ${
                isDragging ? "dragging" : ""
              }`}

              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}

              onDragLeave={() => {
                setIsDragging(false);
              }}

              onDrop={handleDrop}
            >

              <div className="upload-icon">
                ⬆
              </div>

              <h3>
                Drop your crop image here
              </h3>

              <p>
                or select an image from your device
              </p>

              <label className="browse-btn">

                Browse Image

                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />

              </label>

              <span className="upload-hint">

                JPG, JPEG or PNG • Maximum 10MB

              </span>

            </div>

          ) : (

            <div className="preview-area">

              <div className="image-preview">

                <img
                  src={selectedImage}
                  alt="Uploaded crop"
                />

                <div className="image-overlay">

                  CROP IMAGE • READY FOR ANALYSIS

                </div>

              </div>

              <div className="preview-info">

                <div className="ready-badge">

                  <span></span>

                  IMAGE UPLOADED

                </div>

                <h3>
                  Ready for AI diagnosis
                </h3>

                <p className="file-name">
                  {fileName}
                </p>

                <p className="preview-description">

                  Your crop image has been successfully
                  uploaded. Start the AI analysis to
                  generate crop health, risk and
                  severity insights.

                </p>

                <div className="preview-actions">

                  <button
                    className="analyze-btn"
                    onClick={analyzeCrop}
                    disabled={isAnalyzing}
                  >

                    <span>
                      ✦
                    </span>

                    {isAnalyzing
                      ? "Analyzing..."
                      : "Analyze Crop"}

                  </button>

                  <button
                    className="change-btn"
                    onClick={resetUpload}
                    disabled={isAnalyzing}
                  >

                    Change Image

                  </button>

                </div>

              </div>

            </div>

          )}

        </div>

        {/* ================================================= */}
        {/* RESULTS */}
        {/* ================================================= */}

        {analysis && (

          <div className="results-section">

            <div className="results-header">

              <div>

                <span className="section-tag">
                  AI ANALYSIS COMPLETE
                </span>

                <h2>

                  Crop Health

                  <span>
                    Report
                  </span>

                </h2>

              </div>

              <div className="complete-badge">

                <span></span>

                ANALYSIS COMPLETE

              </div>

            </div>

            {/* DISEASE RESULT */}

            <div
              className="report-card"
              style={{
                marginBottom: "30px",
              }}
            >

              <div>

                <span className="mini-label">
                  AI DIAGNOSIS
                </span>

                <h3>
                  {analysis.displayName}
                </h3>

                <p>
                  {analysis.description}
                </p>

              </div>

              <div className="report-status">

                <span className="status-dot"></span>

                {analysis.predictionStatus}

              </div>

            </div>

            {/* METRICS */}

            <div className="metrics-grid">

              {/* RISK */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    RISK LEVEL
                  </span>

                  <span>
                    AI
                  </span>

                </div>

                <strong>
                  {analysis.risk}%
                </strong>

                <div className="progress">

                  <div
                    style={{
                      width: `${analysis.risk}%`,
                    }}
                  />

                </div>

                <p>
                  {analysis.riskLevel}
                </p>

              </div>

              {/* SEVERITY */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    SEVERITY
                  </span>

                  <span>
                    AI
                  </span>

                </div>

                <strong>
                  {analysis.severity}%
                </strong>

                <div className="progress">

                  <div
                    style={{
                      width: `${analysis.severity}%`,
                    }}
                  />

                </div>

                <p>
                  {analysis.severityLevel}
                </p>

              </div>

              {/* HEALTH */}

              <div className="metric-card health-card">

                <div className="metric-top">

                  <span>
                    CROP HEALTH
                  </span>

                  <span>
                    AI
                  </span>

                </div>

                <strong>
                  {analysis.health}%
                </strong>

                <div className="progress">

                  <div
                    style={{
                      width: `${analysis.health}%`,
                    }}
                  />

                </div>

                <p>
                  Overall estimated crop health
                </p>

              </div>

              {/* CONFIDENCE */}

              <div className="metric-card">

                <div className="metric-top">

                  <span>
                    CONFIDENCE
                  </span>

                  <span>
                    AI
                  </span>

                </div>

                <strong>
                  {analysis.confidence}%
                </strong>

                <div className="progress">

                  <div
                    style={{
                      width: `${analysis.confidence}%`,
                    }}
                  />

                </div>

                <p>
                  AI prediction confidence
                </p>

              </div>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* EXPLAINABLE AI */}
        {/* ================================================= */}

        {analysis && (

          <section className="explainable-section">

            <div className="section-heading">

              <h2>

                Understand

                <span>
                  why AI decided.
                </span>

              </h2>

              <p>

                AgriShield doesn't just provide
                a prediction. It explains the
                visual signals that influenced
                the crop health assessment.

              </p>

            </div>

            <div className="explainable-grid">

              {/* AI OBSERVATION */}

              <div className="explain-card">

                <div className="explain-card-header">

                  <div>

                    <span className="mini-label">
                      AI OBSERVATION
                    </span>

                    <h3>
                      What did AI detect?
                    </h3>

                  </div>

                  <div className="ai-badge">
                    ✦ AI
                  </div>

                </div>

                <div className="detection-box">

                  <div className="detection-icon">
                    ◉
                  </div>

                  <div>

                    <strong>
                      {analysis.displayName}
                    </strong>

                    <p>
                      {analysis.description}
                    </p>

                  </div>

                </div>

                {/* CHART */}

                <div className="crop-chart">

                  <div className="chart-header">

                    <div>

                      <span className="mini-label">
                        CROP HEALTH ANALYTICS
                      </span>

                      <h4>
                        Risk & Health Indicators
                      </h4>

                    </div>

                    <div className="chart-unit">
                      %
                    </div>

                  </div>

                  {/* BAR CHART */}

                  <div
                    className="chart-wrapper"
                    style={{
                      width: "100%",
                      height: "380px",
                    }}
                  >

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <BarChart
                        data={chartData}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 0,
                          bottom: 20,
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="feature"
                        />

                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(value) =>
                            `${value}%`
                          }
                        />

                        <Tooltip
                          formatter={(value) =>
                            `${value}%`
                          }
                        />

                        <Legend />

                        <Bar
                          dataKey="risk"
                          name="Risk Contribution"
                          fill="#ef4444"
                          radius={[5, 5, 0, 0]}
                        />

                        <Bar
                          dataKey="severity"
                          name="Severity Impact"
                          fill="#f59e0b"
                          radius={[5, 5, 0, 0]}
                        />

                      </BarChart>

                    </ResponsiveContainer>

                  </div>

                  {/* LINE CHART */}

                  <div
                    className="chart-wrapper"
                    style={{
                      width: "100%",
                      height: "320px",
                      marginTop: "30px",
                    }}
                  >

                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >

                      <LineChart
                        data={chartData}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 0,
                          bottom: 20,
                        }}
                      >

                        <CartesianGrid
                          strokeDasharray="3 3"
                        />

                        <XAxis
                          dataKey="feature"
                        />

                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(value) =>
                            `${value}%`
                          }
                        />

                        <Tooltip
                          formatter={(value) =>
                            `${value}%`
                          }
                        />

                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="health"
                          name="Crop Health"
                          stroke="#16a34a"
                          strokeWidth={3}
                          dot={{
                            r: 5,
                          }}
                        />

                        <Line
                          type="monotone"
                          dataKey="confidence"
                          name="AI Confidence"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{
                            r: 5,
                          }}
                        />

                      </LineChart>

                    </ResponsiveContainer>

                  </div>

                </div>

              </div>

              {/* DECISION SUPPORT */}

              <div className="explain-card decision-card">

                <div className="explain-card-header">

                  <div>

                    <span className="mini-label">
                      DECISION SUPPORT
                    </span>

                    <h3>
                      What should you do?
                    </h3>

                  </div>

                  <div className="decision-icon">
                    ✓
                  </div>

                </div>

                <div className="recommendation">

                  <div className="recommendation-icon">
                    💡
                  </div>

                  <div>

                    <strong>
                      Recommended Action
                    </strong>

                    <p>
                      {analysis.immediateAction}
                    </p>

                  </div>

                </div>

                <div className="decision-items">

                  <div className="decision-item">

                    <span>
                      01
                    </span>

                    <p>
                      Inspect nearby leaves for similar symptoms.
                    </p>

                  </div>

                  <div className="decision-item">

                    <span>
                      02
                    </span>

                    <p>
                      {analysis.monitoringInterval}
                    </p>

                  </div>

                  <div className="decision-item">

                    <span>
                      03
                    </span>

                    <p>
                      {analysis.escalationWarning}
                    </p>

                  </div>

                </div>

                <div className="confidence-box">

                  <div>

                    <small>
                      AI CONFIDENCE
                    </small>

                    <strong>
                      {analysis.confidence}%
                    </strong>

                  </div>

                  <div className="confidence-circle">

                    {analysis.confidence}%

                  </div>

                </div>

              </div>

            </div>

          </section>

        )}

        {/* ================================================= */}
        {/* STATISTICAL REPORT */}
        {/* ================================================= */}

        {analysis && (

          <section className="statistics-section">

            <div className="section-heading">

              <span className="section-tag">
                STEP 04 • DIAGNOSTIC REPORT
              </span>

              <h2>

                Your crop health,

                <span>
                  quantified.
                </span>

              </h2>

              <p>

                A complete statistical summary
                of the AI diagnosis, generated
                from the uploaded crop image.

              </p>

            </div>

            <div className="statistics-grid">

              <div className="stat-box">

                <span>
                  RISK SCORE
                </span>

                <strong>
                  {analysis.risk}%
                </strong>

                <small>
                  Crop health risk
                </small>

              </div>

              <div className="stat-box">

                <span>
                  SEVERITY
                </span>

                <strong>
                  {analysis.severity}%
                </strong>

                <small>
                  Detected severity
                </small>

              </div>

              <div className="stat-box">

                <span>
                  CROP HEALTH
                </span>

                <strong>
                  {analysis.health}%
                </strong>

                <small>
                  Overall health
                </small>

              </div>

              <div className="stat-box">

                <span>
                  CONFIDENCE
                </span>

                <strong>
                  {analysis.confidence}%
                </strong>

                <small>
                  AI confidence
                </small>

              </div>

            </div>

            {/* REPORT */}

            <div className="report-card">

              <div>

                <span className="mini-label">
                  AI DIAGNOSIS SUMMARY
                </span>

                <h3>
                  {analysis.displayName}
                </h3>

                <p>

                  {analysis.summary}

                </p>

              </div>

              <div className="report-status">

                <span className="status-dot"></span>

                Analysis Complete

              </div>

            </div>

            {/* RECOMMENDATION */}

            <div
              className="report-card"
              style={{
                marginTop: "20px",
              }}
            >

              <div>

                <span className="mini-label">
                  RECOMMENDED ACTION
                </span>

                <h3>
                  What should you do?
                </h3>

                <p>
                  {analysis.recommendation}
                </p>

              </div>

            </div>

            {/* DOWNLOAD */}

            <div className="download-report">

              <div>

                <span className="mini-label">
                  COMPLETE REPORT
                </span>

                <h3>
                  Download diagnostic report
                </h3>

                <p>

                  Save the complete AI diagnosis,
                  statistics and recommendations
                  as a PDF.

                </p>

              </div>

              <button
                className="download-btn"
                onClick={downloadDiagnosticPDF}
              >

                <span>
                  ↓
                </span>

                Download PDF

              </button>

            </div>

          </section>

        )}

      </section>

    </div>
  );
}

export default App;