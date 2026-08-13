from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.ml_service import predict_crop


router = APIRouter(prefix="/api", tags=["Prediction"])


@router.post("/predict")
async def predict(file: UploadFile = File(...)):

    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a valid image file."
        )

    try:
        # Read uploaded image
        contents = await file.read()

        if not contents:
            raise HTTPException(
                status_code=400,
                detail="Uploaded image is empty."
            )

        # Save image temporarily
        suffix = Path(file.filename or ".jpg").suffix or ".jpg"

        with NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as temp_file:

            temp_file.write(contents)
            temp_image_path = temp_file.name

        # Run ML pipeline
        result = predict_crop(temp_image_path)

        return {
            "filename": file.filename,
            "prediction": result
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )

    finally:
        # Remove temporary image
        if "temp_image_path" in locals():
            try:
                Path(temp_image_path).unlink(missing_ok=True)
            except Exception:
                pass