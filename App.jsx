import { useEffect, useRef, useState } from "react";
import "./App.css";
import jsPDF from "jspdf";

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

  const [selectedImage, setSelectedImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState(null);

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

    setFileName(file.name);
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
      return;
    }

    setFileName(file.name);
    setSelectedImage(URL.createObjectURL(file));
    setAnalysis(null);
  };

  // =========================
  // RESET IMAGE
  // =========================

  const resetUpload = () => {
    setSelectedImage(null);
    setFileName("");
    setAnalysis(null);
  };

  // =========================
  // DEMO AI ANALYSIS
  // =========================

  const analyzeCrop = () => {
    if (!selectedImage) return;

    setAnalysis({
      risk: 27,
      severity: 18,
      health: 82,
      confidence: 94,
    });

    setTimeout(() => {
      document
        .querySelector(".results-section")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 150);
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

    /* =============================== */
    /* HEADER */
    /* =============================== */

    pdf.setFontSize(22);
    pdf.setTextColor(30, 110, 55);

    pdf.text(
      "AgriShield AI",
      20,
      25
    );

    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);

    pdf.text(
      "AI Crop Health Diagnostic Report",
      20,
      33
    );

    /* =============================== */
    /* LINE */
    /* =============================== */

    pdf.setDrawColor(100, 190, 120);

    pdf.line(
      20,
      40,
      190,
      40
    );

    /* =============================== */
    /* DIAGNOSIS */
    /* =============================== */

    pdf.setFontSize(16);
    pdf.setTextColor(30, 30, 30);

    pdf.text(
      "Final AI Diagnosis",
      20,
      55
    );

    pdf.setFontSize(12);
    pdf.setTextColor(70, 70, 70);

    pdf.text(
      "Crop health analysis completed successfully.",
      20,
      65
    );

    /* =============================== */
    /* STATISTICS */
    /* =============================== */

    pdf.setFontSize(15);
    pdf.setTextColor(30, 110, 55);

    pdf.text(
      "Statistical Results",
      20,
      85
    );

    pdf.setFontSize(12);
    pdf.setTextColor(50, 50, 50);

    pdf.text(
      `Risk Level: ${risk}%`,
      25,
      98
    );

    pdf.text(
      `Severity: ${severity}%`,
      25,
      110
    );

    pdf.text(
      `Crop Health: ${health}%`,
      25,
      122
    );

    pdf.text(
      `AI Confidence: ${confidence}%`,
      25,
      134
    );

    /* =============================== */
    /* VISUAL RESULT */
    /* =============================== */

    pdf.setFontSize(15);
    pdf.setTextColor(30, 110, 55);

    pdf.text(
      "Diagnosis Summary",
      20,
      155
    );

    pdf.setFontSize(11);
    pdf.setTextColor(70, 70, 70);

    const summary =
      analysis.summary ||
      analysis.description ||
      "The AI system analyzed the uploaded crop image and generated the above health assessment.";

    const wrappedSummary =
      pdf.splitTextToSize(
        summary,
        165
      );

    pdf.text(
      wrappedSummary,
      20,
      167
    );

    /* =============================== */
    /* RECOMMENDATION */
    /* =============================== */

    const recommendationY =
      167 +
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

    /* =============================== */
    /* FOOTER */
    /* =============================== */

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

    /* =============================== */
    /* DOWNLOAD */
    /* =============================== */

    pdf.save(
      "AgriShield-Crop-Diagnostic-Report.pdf"
    );
  };

  return (
    <div className="app">

      {/* ========================= */}
      {/* BACKGROUND */}
      {/* ========================= */}

      {/* ========================= */}
{/* HERO BACKGROUND CAROUSEL */}
{/* ========================= */}

<div className="hero-background">

  {heroImages.map((image, index) => (
    <div
      key={image}
      className={`hero-bg-slide ${
        index === currentBackground ? "active" : ""
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

          {/* AGRISHIELD LOGO */}
          <div className="brand-icon">
            <img
              src="/agrishield-leaf.png"
              alt="AgriShield Logo"
            />
          </div>

          {/* TITLE */}
          <div className="brand-text">
            <h2>AgriShield</h2>
            <p>AI CROP INTELLIGENCE</p>
          </div>

        </div>

      </header>

      {/* ========================= */}
      {/* HOME / HERO */}
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
            understandable health assessment — helping identify issues,
            estimate severity, flag risk and support better decisions.
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

        {/* ========================= */}
        {/* HERO VISUAL */}
        {/* ========================= */}

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
            Upload a clear image of your cotton crop and AgriShield
            will analyze its health, identify possible risks and
            estimate disease severity.
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

              {/* IMAGE */}

              <div className="image-preview">

                <img
                  src={selectedImage}
                  alt="Uploaded crop"
                />

                <div className="image-overlay">
                  CROP IMAGE • READY FOR ANALYSIS
                </div>

              </div>

              {/* IMAGE INFORMATION */}

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
                  >

                    <span>✦</span>

                    Analyze Crop

                  </button>

                  <button
                    className="change-btn"
                    onClick={resetUpload}
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
                  Probability of crop health risk
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
                  Estimated severity of detected issue
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
                  Confidence of AI prediction
                </p>

              </div>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* STEP 02 — EXPLAINABLE AI */}
        {/* ================================================= */}

        {analysis && (

          <section className="explainable-section">

            {/* SECTION HEADER */}

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

            {/* EXPLAINABLE AI GRID */}

            <div className="explainable-grid">

              {/* ========================================= */}
              {/* AI OBSERVATION */}
              {/* ========================================= */}

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

                {/* DETECTION */}

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

                {/* CROP HEALTH GRAPH */}

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

                  {/* GRAPH */}

                  <div className="chart-wrapper">

                    <svg
                      viewBox="0 0 760 360"
                      className="health-chart"
                      preserveAspectRatio="none"
                    >

                      {/* GRID LINES */}

                      <line
                        x1="65"
                        y1="35"
                        x2="730"
                        y2="35"
                        className="chart-grid"
                      />

                      <line
                        x1="65"
                        y1="95"
                        x2="730"
                        y2="95"
                        className="chart-grid"
                      />

                      <line
                        x1="65"
                        y1="155"
                        x2="730"
                        y2="155"
                        className="chart-grid"
                      />

                      <line
                        x1="65"
                        y1="215"
                        x2="730"
                        y2="215"
                        className="chart-grid"
                      />

                      <line
                        x1="65"
                        y1="275"
                        x2="730"
                        y2="275"
                        className="chart-grid"
                      />

                      {/* Y AXIS LABELS */}

                      <text
                        x="28"
                        y="40"
                        className="chart-label"
                      >
                        100%
                      </text>

                      <text
                        x="38"
                        y="100"
                        className="chart-label"
                      >
                        75%
                      </text>

                      <text
                        x="38"
                        y="160"
                        className="chart-label"
                      >
                        50%
                      </text>

                      <text
                        x="38"
                        y="220"
                        className="chart-label"
                      >
                        25%
                      </text>

                      <text
                        x="48"
                        y="280"
                        className="chart-label"
                      >
                        0%
                      </text>

                      {/* RISK BARS */}

                      <rect
                        x="105"
                        y="184"
                        width="38"
                        height="91"
                        rx="4"
                        className="risk-bar"
                      />

                      <rect
                        x="265"
                        y="200"
                        width="38"
                        height="75"
                        rx="4"
                        className="risk-bar"
                      />

                      <rect
                        x="425"
                        y="232"
                        width="38"
                        height="43"
                        rx="4"
                        className="risk-bar"
                      />

                      <rect
                        x="585"
                        y="244"
                        width="38"
                        height="31"
                        rx="4"
                        className="risk-bar"
                      />

                      {/* SEVERITY BARS */}

                      <rect
                        x="148"
                        y="232"
                        width="38"
                        height="43"
                        rx="4"
                        className="severity-bar"
                      />

                      <rect
                        x="308"
                        y="222"
                        width="38"
                        height="53"
                        rx="4"
                        className="severity-bar"
                      />

                      <rect
                        x="468"
                        y="250"
                        width="38"
                        height="25"
                        rx="4"
                        className="severity-bar"
                      />

                      <rect
                        x="628"
                        y="258"
                        width="38"
                        height="17"
                        rx="4"
                        className="severity-bar"
                      />

                      {/* HEALTH LINE */}

                      <polyline
                        points="
                          124,79
                          284,88
                          444,60
                          604,72
                        "
                        className="health-line"
                      />

                      {/* HEALTH POINTS */}

                      <circle
                        cx="124"
                        cy="79"
                        r="5"
                        className="health-point"
                      />

                      <circle
                        cx="284"
                        cy="88"
                        r="5"
                        className="health-point"
                      />

                      <circle
                        cx="444"
                        cy="60"
                        r="5"
                        className="health-point"
                      />

                      <circle
                        cx="604"
                        cy="72"
                        r="5"
                        className="health-point"
                      />

                      {/* CONFIDENCE LINE */}

                      <polyline
                        points="
                          124,54
                          284,65
                          444,43
                          604,48
                        "
                        className="confidence-line"
                      />

                      {/* CONFIDENCE POINTS */}

                      <circle
                        cx="124"
                        cy="54"
                        r="5"
                        className="confidence-point"
                      />

                      <circle
                        cx="284"
                        cy="65"
                        r="5"
                        className="confidence-point"
                      />

                      <circle
                        cx="444"
                        cy="43"
                        r="5"
                        className="confidence-point"
                      />

                      <circle
                        cx="604"
                        cy="48"
                        r="5"
                        className="confidence-point"
                      />

                      {/* X AXIS */}

                      <text
                        x="124"
                        y="315"
                        textAnchor="middle"
                        className="chart-x-label"
                      >
                        Leaf Color
                      </text>

                      <text
                        x="284"
                        y="315"
                        textAnchor="middle"
                        className="chart-x-label"
                      >
                        Surface
                      </text>

                      <text
                        x="444"
                        y="315"
                        textAnchor="middle"
                        className="chart-x-label"
                      >
                        Leaf Edge
                      </text>

                      <text
                        x="604"
                        y="315"
                        textAnchor="middle"
                        className="chart-x-label"
                      >
                        Structure
                      </text>

                    </svg>

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

              {/* ========================================= */}
              {/* DECISION SUPPORT */}
              {/* ========================================= */}

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

                {/* RECOMMENDATION */}

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

                {/* ACTION STEPS */}

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
                      Monitor the affected area over the next few days.
                    </p>

                  </div>

                  <div className="decision-item">

                    <span>
                      03
                    </span>

                    <p>
                      Re-scan if discoloration or severity increases.
                    </p>

                  </div>

                </div>

                {/* CONFIDENCE */}

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
        {/* STEP 04 — STATISTICAL REPORT */}
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

            {/* STATISTICS CARDS */}

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
                  The AI analysis indicates early signs of
                  crop stress. The current risk level is{" "}
                  {analysis.risk}% with an estimated severity
                  of {analysis.severity}%. Overall crop health
                  is estimated at {analysis.health}%.
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