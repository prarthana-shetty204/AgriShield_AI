import sys
from pathlib import Path

# Project root
PROJECT_ROOT = Path(__file__).resolve().parents[3]

# AI/ML source directory
AI_ML_SRC = PROJECT_ROOT / "AI_ML" / "src"

# Add AI/ML source directory so predict.py can import
# decision_engine.py and gradcam.py
if str(AI_ML_SRC) not in sys.path:
    sys.path.insert(0, str(AI_ML_SRC))

from predict import predict_image


def predict_crop(image_path: str):
    """
    Run the AgriShield AI/ML prediction pipeline.

    Parameters:
        image_path: Path to the uploaded image.

    Returns:
        Dictionary containing the ML prediction result.
    """
    return predict_image(image_path)