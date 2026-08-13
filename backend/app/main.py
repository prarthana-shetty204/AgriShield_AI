from fastapi import FastAPI

app = FastAPI(
    title="AgriShield AI",
    description="Cotton Crop Health Monitoring and Decision Support System",
    version="0.1.0"
)


@app.get("/")
def root():
    return {
        "message": "AgriShield AI backend is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }