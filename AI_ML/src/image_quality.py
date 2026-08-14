import os
import sys
import json
import cv2


# ============================================================
# CONFIGURATION
# ============================================================

# Minimum image dimensions
MIN_WIDTH = 224
MIN_HEIGHT = 224

# Brightness limits
MIN_BRIGHTNESS = 25
MAX_BRIGHTNESS = 235

# Blur threshold
# Lower value = more tolerant of naturally smooth images
MIN_BLUR_SCORE = 20

# Minimum overall quality score required
MIN_QUALITY_SCORE = 60


# ============================================================
# IMAGE QUALITY ANALYSIS
# ============================================================

def check_image_quality(image_path):
    """
    Analyze an image before sending it to the AI model.

    Checks:
        1. Image readability
        2. Resolution
        3. Brightness
        4. Blur/sharpness

    Returns:
        Dictionary containing quality information.
    """

    # --------------------------------------------------------
    # Check whether file exists
    # --------------------------------------------------------

    if not os.path.exists(image_path):
        raise FileNotFoundError(
            f"Image not found:\n{image_path}"
        )

    # --------------------------------------------------------
    # Read image
    # --------------------------------------------------------

    image = cv2.imread(image_path)

    if image is None:
        return {
            "quality_ok": False,
            "quality_score": 0.0,
            "issues": [
                "Unable to read image"
            ],
            "recommendation": (
                "Please upload a valid JPG, JPEG or PNG image."
            )
        }

    # --------------------------------------------------------
    # Get image dimensions
    # --------------------------------------------------------

    height, width = image.shape[:2]

    # --------------------------------------------------------
    # Convert to grayscale
    # --------------------------------------------------------

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    # ========================================================
    # 1. RESOLUTION CHECK
    # ========================================================

    resolution_ok = (
        width >= MIN_WIDTH
        and
        height >= MIN_HEIGHT
    )

    # ========================================================
    # 2. BRIGHTNESS CHECK
    # ========================================================

    brightness = float(gray.mean())

    brightness_ok = (
        MIN_BRIGHTNESS
        <= brightness
        <= MAX_BRIGHTNESS
    )

    # ========================================================
    # 3. BLUR / SHARPNESS CHECK
    # ========================================================

    blur_score = float(
        cv2.Laplacian(
            gray,
            cv2.CV_64F
        ).var()
    )

    blur_ok = (
        blur_score >= MIN_BLUR_SCORE
    )

    # ========================================================
    # COLLECT ISSUES
    # ========================================================

    issues = []

    # Resolution issue
    if not resolution_ok:
        issues.append(
            f"Image resolution is too low "
            f"({width}x{height}). "
            f"Minimum required is "
            f"{MIN_WIDTH}x{MIN_HEIGHT}."
        )

    # Brightness issues
    if brightness < MIN_BRIGHTNESS:
        issues.append(
            "Image is too dark."
        )

    elif brightness > MAX_BRIGHTNESS:
        issues.append(
            "Image is too bright."
        )

    # Blur issue
    if not blur_ok:
        issues.append(
            "Image appears blurry or lacks sufficient detail."
        )

    # ========================================================
    # QUALITY SCORE
    # ========================================================

    checks = [
        resolution_ok,
        brightness_ok,
        blur_ok
    ]

    passed_checks = sum(checks)

    quality_score = (
        passed_checks / len(checks)
    ) * 100

    quality_score = round(
        quality_score,
        2
    )

    # ========================================================
    # FINAL QUALITY DECISION
    # ========================================================

    quality_ok = (
        quality_score >= MIN_QUALITY_SCORE
        and resolution_ok
        and brightness_ok
    )

    # --------------------------------------------------------
    # Recommendation
    # --------------------------------------------------------

    if quality_ok:

        recommendation = (
            "Image quality is suitable for AI analysis."
        )

    else:

        recommendation = (
            "Please capture another image with "
            "better lighting, focus and resolution."
        )

    # ========================================================
    # RETURN RESULT
    # ========================================================

    return {

        "quality_ok": quality_ok,

        "quality_score": quality_score,

        "resolution": {
            "width": width,
            "height": height,
            "acceptable": resolution_ok
        },

        "brightness": round(
            brightness,
            2
        ),

        "blur_score": round(
            blur_score,
            2
        ),

        "checks": {
            "resolution": resolution_ok,
            "brightness": brightness_ok,
            "sharpness": blur_ok
        },

        "issues": issues,

        "recommendation": recommendation
    }


# ============================================================
# COMMAND LINE TEST
# ============================================================

if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(
            "\nUsage:"
        )

        print(
            "python src\\image_quality.py <image_path>\n"
        )

        print(
            "Example:"
        )

        print(
            'python src\\image_quality.py "test_images\\leaf.jpg"'
        )

        sys.exit(1)

    image_path = sys.argv[1]

    try:

        result = check_image_quality(
            image_path
        )

        print("\n")
        print("=" * 60)
        print("       AGRISHIELD AI - IMAGE QUALITY CHECK")
        print("=" * 60)

        print(
            f"\nQuality OK     : "
            f"{result['quality_ok']}"
        )

        print(
            f"Quality Score  : "
            f"{result['quality_score']}%"
        )

        print(
            f"Resolution     : "
            f"{result['resolution']['width']} x "
            f"{result['resolution']['height']}"
        )

        print(
            f"Brightness     : "
            f"{result['brightness']}"
        )

        print(
            f"Blur Score     : "
            f"{result['blur_score']}"
        )

        print("\nChecks:")

        print(
            f"  Resolution   : "
            f"{result['checks']['resolution']}"
        )

        print(
            f"  Brightness   : "
            f"{result['checks']['brightness']}"
        )

        print(
            f"  Sharpness    : "
            f"{result['checks']['sharpness']}"
        )

        print("\nIssues:")

        if result["issues"]:

            for issue in result["issues"]:
                print(
                    f"  - {issue}"
                )

        else:

            print(
                "  None"
            )

        print(
            "\nRecommendation:"
        )

        print(
            f"  {result['recommendation']}"
        )

        print("\n")
        print("=" * 60)

        print("\nJSON OUTPUT:")
        print(
            json.dumps(
                result,
                indent=4
            )
        )

    except Exception as e:

        print(
            f"\nError: {str(e)}"
        )

        sys.exit(1)