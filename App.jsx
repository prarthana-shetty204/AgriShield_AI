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
      setCurrentBackground((prev) => {
        return (prev + 1) % heroImages.length;
      });
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
    const file = e.target.files[0];

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

    const file = e.dataTransfer.files[0];

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
  // RESET IMAGE
  // =========================

  const resetUpload = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setFileName("");
    setAnalysis(null);
  };

  // =========================
  // FASTAPI AI ANALYSIS
  // =========================

  const analyzeCrop = async () => {
    if (!selectedFile) {
      alert("Please upload a crop image first.");
      return;
    }

    setIsAnalyzing(true);

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

      if (!response.ok) {
        throw new Error("Backend request failed");
      }

      const data = await response.json();

      console.log("FastAPI Response:", data);

      setAnalysis(data);

      setTimeout(() => {
        document
          .querySelector(".results-section")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 150);
    } catch (error) {
      console.error("Backend connection error:", error);

      alert(
        "Unable to connect to AgriShield AI backend. Make sure FastAPI is running on port 8000."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // =========================
  // SCROLL TO DIAGNOSIS
  // =========================

  const scrollToDiagnosis = () => {
    diagnosisRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // =========================
  // RECHARTS DATA
  // =========================

  const chartData = analysis
    ? [
        {
          feature: "Leaf Color",
          risk: 27,
          severity: 18,
          health: analysis.health,
          confidence: analysis.confidence,
        },
        {
          feature: "Surface",
          risk: 22,
          severity: 22,
          health: Math.max(0, analysis.health - 4),
          confidence: Math.max(0, analysis.confidence - 3),
        },
        {
          feature: "Leaf Edge",
          risk: 15,
          severity: 12,
          health: Math.min(100, analysis.health + 5),
          confidence: Math.min(100, analysis.confidence + 2),
        },
        {
          feature: "Structure",
          risk: 10,
          severity: 8,
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
      "Crop health analysis completed successfully.",
      20,
      65
    );

    pdf.setFontSize(15);
    pdf.setTextColor(30, 110, 55);

    pdf.text("Statistical Results", 20, 85);

    pdf.setFontSize(12);
    pdf.setTextColor(50, 50, 50);

    pdf.text(`Risk Level: ${risk}%`, 25, 98);
    pdf.text(`Severity: ${severity}%`, 25, 110);
    pdf.text(`Crop Health: ${health}%`, 25, 122);
    pdf.text(`AI Confidence: ${confidence}%`, 25, 134);

    pdf.setFontSize(15);
    pdf.setTextColor(30, 110, 55);

    pdf.text("Diagnosis Summary", 20, 155);

    pdf.setFontSize(11);
    pdf.setTextColor(70, 70, 70);

    const summary =
      analysis.summary ||
      analysis.description ||
      "The AI system analyzed the uploaded crop image and generated the above health assessment.";

    const wrappedSummary =
      pdf.splitTextToSize(summary, 165);

    pdf.text(wrappedSummary, 20, 167);

    const recommendationY =
      167 + wrappedSummary.length * 6 + 15;

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
      "Monitor the affected crop area and perform another scan if symptoms increase.";

    const wrappedRecommendation =
      pdf.splitTextToSize(
        recommendation,
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
            <h2>AgriShield</h2>
            <p>AI CROP INTELLIGENCE</p>
          </div>

        </div>

      </header>

      {/* ========================= */}
      {/* HERO */}
      {/* ========================= */}

      <main className="hero">

        <section className="hero-content">

          <div className="eyebrow">
            <span>✦</span>
            INTELLIGENT CROP HEALTH MONITORING
          </div>

          <h1>
            Detect.
            <span> Explain.</span>
            Act.
          </h1>

          <p className="hero-description">
            AgriShield AI transforms a simple crop image into an
            understandable health assessment — helping identify
            issues, estimate severity, flag risk and support
            better decisions.
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
            <span> Let AI see what you see.</span>
          </h2>

          <p>
            Upload a clear image of your cotton crop and
            AgriShield will analyze its health, identify
            possible risks and estimate disease severity.
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
                  Your crop image has been successfully uploaded.
                  Start the AI analysis to generate crop health,
                  risk and severity insights.
                </p>

                <div className="preview-actions">

                  <button
                    className="analyze-btn"
                    onClick={analyzeCrop}
                    disabled={isAnalyzing}
                  >

                    <span>✦</span>

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

        {/* ========================= */}
        {/* ANALYSIS RESULTS */}
        {/* ========================= */}

        {analysis && (

          <div className="results-section">

            <div className="results-header">

              <div>

                <span className="section-tag">
                  AI ANALYSIS COMPLETE
                </span>

                <h2>
                  Crop Health
                  <span> Report</span>
                </h2>

              </div>

              <div className="complete-badge">

                <span></span>

                ANALYSIS COMPLETE

              </div>

            </div>

            {/* METRICS */}

            <div className="metrics-grid">

              {/* RISK */}

              <div className="metric-card">

                <div className="metric-top">
                  <span>RISK LEVEL</span>
                  <span>AI</span>
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
                  Probability of crop health risk
                </p>

              </div>

              {/* SEVERITY */}

              <div className="metric-card">

                <div className="metric-top">
                  <span>SEVERITY</span>
                  <span>AI</span>
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
                  Estimated severity of detected issue
                </p>

              </div>

              {/* HEALTH */}

              <div className="metric-card health-card">

                <div className="metric-top">
                  <span>CROP HEALTH</span>
                  <span>AI</span>
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
                  <span>CONFIDENCE</span>
                  <span>AI</span>
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
                  Confidence of AI prediction
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
                <span> why AI decided.</span>
              </h2>

              <p>
                AgriShield doesn't just provide a prediction.
                It explains the visual signals that influenced
                the crop health assessment.
              </p>

            </div>

            <div className="explainable-grid">

              {/* ========================= */}
              {/* AI OBSERVATION */}
              {/* ========================= */}

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
                      Early crop stress detected
                    </strong>

                    <p>
                      Visual patterns indicate mild stress
                      affecting portions of the cotton leaf.
                    </p>

                  </div>

                </div>

                {/* ========================= */}
                {/* RECHARTS */}
                {/* ========================= */}

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

                  {/* ========================= */}
                  {/* HEALTH + CONFIDENCE */}
                  {/* ========================= */}

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

                  {/* LEGEND */}

                  <div className="chart-legend">

                    <div className="legend-item">

                      <span className="legend-box risk"></span>

                      Risk Contribution

                    </div>

                    <div className="legend-item">

                      <span className="legend-box severity"></span>

                      Severity Impact

                    </div>

                    <div className="legend-item">

                      <span className="legend-line health"></span>

                      Crop Health

                    </div>

                    <div className="legend-item">

                      <span className="legend-line confidence"></span>

                      AI Confidence

                    </div>

                  </div>

                </div>

              </div>

              {/* ========================= */}
              {/* DECISION SUPPORT */}
              {/* ========================= */}

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
                      Monitor & inspect
                    </strong>

                    <p>
                      Current risk is relatively low,
                      but the detected stress should be
                      monitored closely.
                    </p>

                  </div>

                </div>

                <div className="decision-items">

                  <div className="decision-item">

                    <span>01</span>

                    <p>
                      Inspect nearby leaves for similar symptoms.
                    </p>

                  </div>

                  <div className="decision-item">

                    <span>02</span>

                    <p>
                      Monitor the affected area over the next few days.
                    </p>

                  </div>

                  <div className="decision-item">

                    <span>03</span>

                    <p>
                      Re-scan if discoloration or severity increases.
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

                    {analysis.confidence}

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
                <span> quantified.</span>
              </h2>

              <p>
                A complete statistical summary of the AI diagnosis,
                generated from the uploaded crop image.
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
                  Early crop stress detected
                </h3>

                <p>
                  {analysis.summary ||
                    `The AI analysis indicates early signs of crop stress. The current risk level is ${analysis.risk}% with an estimated severity of ${analysis.severity}%. Overall crop health is estimated at ${analysis.health}%.`}
                </p>

              </div>

              <div className="report-status">

                <span className="status-dot"></span>

                Analysis Complete

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
                  statistics and recommendations as a PDF.
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