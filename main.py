from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AgriShield AI API")

# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# HOME
# =========================

@app.get("/")
def home():
    return {
        "message": "AgriShield AI Backend is running!"
    }


# =========================
# TEST CONNECTION
# =========================

@app.get("/api/test")
def test_connection():
    return {
        "success": True,
        "message": "Frontend and Backend connected successfully!"
    }


# =========================
# CROP ANALYSIS
# =========================

@app.post("/api/analyze")
async def analyze_crop(file: UploadFile = File(...)):

    print("Received image:", file.filename)

    # Demo AI result for now
    # Later we will replace this with your actual AI model.

    return {
        "success": True,
        "risk": 27,
        "severity": 18,
        "health": 82,
        "confidence": 94,
        "summary": "Early crop stress detected. Visual patterns indicate mild stress affecting portions of the cotton leaf.",
        "description": "The AI system analyzed the uploaded crop image and detected early signs of crop stress.",
        "recommendation": "Monitor the affected crop area and inspect nearby leaves. Perform another scan if symptoms increase."
    }