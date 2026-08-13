import os
import sys
import json
import numpy as np
import tensorflow as tf
from PIL import Image

from decision_engine import generate_decision
from gradcam import generate_gradcam


# ============================================================
# AGRISHIELD AI - COMPLETE PREDICTION PIPELINE
# ============================================================
#
# INPUT:
#     One image
#
# AUTOMATIC PIPELINE:
#
#     Image
#       ↓
#     ML Prediction
#       ↓
#     Disease / Healthy
#       ↓
#     Confidence
#       ↓
#     Decision Engine
#       ↓
#     Severity
#     Risk Score
#     Risk Level
#     Immediate Action
#     Management
#     Monitoring
#     Escalation
#       ↓
#     Grad-CAM
#       ↓
#     Explainability Heatmap
#
# ONLY predict.py needs to be executed.
#
# ============================================================


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "agrishield_mobilenetv2_best.keras"
)

CLASS_PATH = os.path.join(
    BASE_DIR,
    "models",
    "class_names.json"
)

GRADCAM_OUTPUT = os.path.join(
    BASE_DIR,
    "models",
    "gradcam_result.jpg"
)

IMG_SIZE = (224, 224)


# ============================================================
# EXPECTED CLASSES
# ============================================================

EXPECTED_CLASSES = {
    "bacterial_blight",
    "curl_virus",
    "fussarium_wilt",
    "healthy"
}


# ============================================================
# DISPLAY NAMES
# ============================================================

DISPLAY_NAMES = {

    "bacterial_blight":
        "Bacterial Blight",

    "curl_virus":
        "Cotton Leaf Curl Virus",

    "fussarium_wilt":
        "Fusarium Wilt",

    "healthy":
        "Healthy Cotton"
}


# ============================================================
# CHECK REQUIRED FILES
# ============================================================

if not os.path.exists(MODEL_PATH):

    raise FileNotFoundError(
        f"\nModel not found:\n{MODEL_PATH}\n"
        "\nPlease train the model first."
    )


if not os.path.exists(CLASS_PATH):

    raise FileNotFoundError(
        f"\nClass names file not found:\n{CLASS_PATH}\n"
        "\nPlease train the model first."
    )


# ============================================================
# LOAD MODEL
# ============================================================

print("\nLoading AgriShield AI model...")

model = tf.keras.models.load_model(
    MODEL_PATH
)

print("Model loaded successfully.")


# ============================================================
# LOAD CLASS NAMES
# ============================================================

with open(
    CLASS_PATH,
    "r"
) as f:

    class_names = json.load(f)


print("\nClasses loaded:")

for i, class_name in enumerate(class_names):

    print(
        f"{i}: {class_name}"
    )


# ============================================================
# VALIDATE CLASS NAMES
# ============================================================

if set(class_names) != EXPECTED_CLASSES:

    raise ValueError(
        "\nInvalid class_names.json.\n"
        f"Expected: {EXPECTED_CLASSES}\n"
        f"Found: {set(class_names)}"
    )


# ============================================================
# PREDICTION FUNCTION
# ============================================================

def predict_image(image_path):

    # ========================================================
    # CHECK IMAGE
    # ========================================================

    if not image_path:

        raise ValueError(
            "Image path cannot be empty."
        )


    if not os.path.exists(image_path):

        raise FileNotFoundError(
            f"\nImage not found:\n{image_path}"
        )


    # ========================================================
    # LOAD IMAGE
    # ========================================================

    try:

        image = Image.open(
            image_path
        ).convert("RGB")

    except Exception as e:

        raise ValueError(
            f"\nUnable to open image:\n{e}"
        )


    # ========================================================
    # RESIZE
    # ========================================================

    image = image.resize(
        IMG_SIZE
    )


    # ========================================================
    # NUMPY CONVERSION
    # ========================================================

    image_array = np.array(
        image,
        dtype=np.float32
    )


    # ========================================================
    # ADD BATCH DIMENSION
    # ========================================================

    image_array = np.expand_dims(
        image_array,
        axis=0
    )


    # ========================================================
    # MODEL PREDICTION
    # ========================================================
    #
    # IMPORTANT:
    #
    # The trained model already contains:
    #
    # MobileNetV2 preprocess_input()
    #
    # Therefore we DO NOT preprocess here.
    #
    # ========================================================

    probabilities = model.predict(
        image_array,
        verbose=0
    )[0]


    # ========================================================
    # VALIDATE OUTPUT
    # ========================================================

    if len(probabilities) != len(class_names):

        raise ValueError(
            "\nModel output does not match class_names.json.\n"
            f"Model outputs: {len(probabilities)}\n"
            f"Classes: {len(class_names)}"
        )


    # ========================================================
    # CONVERT TO NUMPY
    # ========================================================

    probabilities = np.asarray(
        probabilities,
        dtype=np.float32
    )


    # ========================================================
    # FIND PREDICTED CLASS
    # ========================================================

    predicted_index = int(
        np.argmax(
            probabilities
        )
    )


    # ========================================================
    # GET MODEL CLASS
    # ========================================================

    disease = class_names[
        predicted_index
    ]


    # ========================================================
    # GET CONFIDENCE
    # ========================================================

    confidence_probability = float(
        probabilities[
            predicted_index
        ]
    )


    confidence_percentage = (
        confidence_probability * 100
    )


    # ========================================================
    # CONFIDENCE STATUS
    # ========================================================

    if confidence_probability < 0.60:

        prediction_status = "uncertain"

    elif confidence_probability < 0.75:

        prediction_status = "moderate_confidence"

    else:

        prediction_status = "high_confidence"


    # ========================================================
    # DISPLAY NAME
    # ========================================================

    display_name = DISPLAY_NAMES.get(
        disease,
        disease
    )


    # ========================================================
    # PROBABILITY MAP
    # ========================================================

    probability_map = {}

    for i, class_name in enumerate(
        class_names
    ):

        probability_map[class_name] = round(
            float(
                probabilities[i]
            ) * 100,
            2
        )


    # ========================================================
    # DECISION ENGINE
    # ========================================================
    #
    # The decision engine receives:
    #
    #     disease
    #     confidence
    #
    # It does NOT receive the image.
    #
    # ========================================================

    print(
        "\nGenerating decision support..."
    )

    decision = generate_decision(
        disease,
        confidence_percentage
    )


    # ========================================================
    # GRAD-CAM
    # ========================================================
    #
    # Grad-CAM receives the same image automatically.
    #
    # It generates the explainability heatmap.
    #
    # ========================================================

    print(
        "Generating Grad-CAM explainability..."
    )

    gradcam_result = generate_gradcam(
        image_path,
        GRADCAM_OUTPUT
    )


    # ========================================================
    # FINAL RESULT
    # ========================================================

    result = {

        # ----------------------------------------------------
        # INPUT
        # ----------------------------------------------------

        "image_path":
            image_path,

        # ----------------------------------------------------
        # AI PREDICTION
        # ----------------------------------------------------

        "prediction": {

            "disease":
                disease,

            "display_name":
                display_name,

            "confidence":
                round(
                    confidence_percentage,
                    2
                ),

            "prediction_status":
                prediction_status,

            "probabilities":
                probability_map
        },

        # ----------------------------------------------------
        # DECISION SUPPORT
        # ----------------------------------------------------

        "decision_support": {

            "crop":
                decision["crop"],

            "disease":
                decision["disease"],

            "disease_class":
                decision["disease_class"],

            "disease_type":
                decision["disease_type"],

            "confidence":
                decision["confidence"],

            "severity":
                decision["severity"],

            "severity_explanation":
                decision["severity_explanation"],

            "risk_score":
                decision["risk_score"],

            "risk_level":
                decision["risk_level"],

            "immediate_action":
                decision["immediate_action"],

            "management_recommendations":
                decision[
                    "management_recommendations"
                ],

            "monitoring_interval":
                decision[
                    "monitoring_interval"
                ],

            "escalation_warning":
                decision[
                    "escalation_warning"
                ],

            "farmer_message":
                decision[
                    "farmer_message"
                ]
        },

        # ----------------------------------------------------
        # EXPLAINABILITY
        # ----------------------------------------------------

        "explainability": {

            "method":
                "Grad-CAM",

            "predicted_class":
                gradcam_result[
                    "predicted_class"
                ],

            "confidence":
                gradcam_result[
                    "confidence"
                ],

            "heatmap_path":
                gradcam_result[
                    "heatmap_path"
                ]
        }
    }


    return result


# ============================================================
# PRINT FINAL RESULT
# ============================================================

def print_final_result(result):

    prediction = result[
        "prediction"
    ]

    decision = result[
        "decision_support"
    ]

    explainability = result[
        "explainability"
    ]


    print("\n")
    print("=" * 70)
    print("                 AGRISHIELD AI")
    print("             AI CROP HEALTH ANALYSIS")
    print("=" * 70)


    # ========================================================
    # AI DIAGNOSIS
    # ========================================================

    print(
        "\nAI DIAGNOSIS"
    )

    print(
        "-" * 70
    )

    print(
        f"Crop              : "
        f"{decision['crop']}"
    )

    print(
        f"Disease           : "
        f"{prediction['display_name']}"
    )

    print(
        f"Disease Class     : "
        f"{prediction['disease']}"
    )

    print(
        f"Disease Type      : "
        f"{decision['disease_type']}"
    )

    print(
        f"Confidence        : "
        f"{prediction['confidence']}%"
    )

    print(
        f"Prediction Status  : "
        f"{prediction['prediction_status']}"
    )


    # ========================================================
    # PROBABILITIES
    # ========================================================

    print(
        "\nCLASS PROBABILITIES"
    )

    print(
        "-" * 70
    )

    for class_name, probability in (
        prediction["probabilities"].items()
    ):

        print(
            f"  {class_name:<25} : "
            f"{probability}%"
        )


    # ========================================================
    # SEVERITY
    # ========================================================

    print(
        "\nSEVERITY ASSESSMENT"
    )

    print(
        "-" * 70
    )

    print(
        f"Severity           : "
        f"{decision['severity'].upper()}"
    )

    print(
        f"Assessment         : "
        f"{decision['severity_explanation']}"
    )


    # ========================================================
    # RISK
    # ========================================================

    print(
        "\nRISK ASSESSMENT"
    )

    print(
        "-" * 70
    )

    print(
        f"Risk Score         : "
        f"{decision['risk_score']}/100"
    )

    print(
        f"Risk Level         : "
        f"{decision['risk_level']}"
    )


    # ========================================================
    # IMMEDIATE ACTION
    # ========================================================

    print(
        "\nIMMEDIATE ACTION"
    )

    print(
        "-" * 70
    )

    for action in decision[
        "immediate_action"
    ]:

        print(
            f"  • {action}"
        )


    # ========================================================
    # MANAGEMENT
    # ========================================================

    print(
        "\nMANAGEMENT RECOMMENDATIONS"
    )

    print(
        "-" * 70
    )

    for recommendation in decision[
        "management_recommendations"
    ]:

        print(
            f"  • {recommendation}"
        )


    # ========================================================
    # MONITORING
    # ========================================================

    print(
        "\nMONITORING"
    )

    print(
        "-" * 70
    )

    print(
        f"  {decision['monitoring_interval']}"
    )


    # ========================================================
    # ESCALATION
    # ========================================================

    print(
        "\nESCALATION WARNING"
    )

    print(
        "-" * 70
    )

    print(
        f"  {decision['escalation_warning']}"
    )


    # ========================================================
    # FARMER MESSAGE
    # ========================================================

    print(
        "\nFARMER MESSAGE"
    )

    print(
        "-" * 70
    )

    print(
        f"  {decision['farmer_message']}"
    )


    # ========================================================
    # GRAD-CAM
    # ========================================================

    print(
        "\nEXPLAINABILITY"
    )

    print(
        "-" * 70
    )

    print(
        f"Method             : "
        f"{explainability['method']}"
    )

    print(
        f"Grad-CAM Class     : "
        f"{explainability['predicted_class']}"
    )

    print(
        f"Grad-CAM Confidence: "
        f"{explainability['confidence']}%"
    )

    print(
        f"Heatmap            : "
        f"{explainability['heatmap_path']}"
    )


    print(
        "\n"
        + "=" * 70
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    # ========================================================
    # IMAGE REQUIRED
    # ========================================================

    if len(sys.argv) < 2:

        print(
            "\nUsage:"
        )

        print(
            'python src\\predict.py "path\\to\\image.jpg"'
        )

        sys.exit(1)


    # ========================================================
    # GET IMAGE
    # ========================================================

    image_path = sys.argv[1]


    # ========================================================
    # RUN COMPLETE PIPELINE
    # ========================================================

    try:

        result = predict_image(
            image_path
        )


        # ====================================================
        # PRINT HUMAN READABLE RESULT
        # ====================================================

        print_final_result(
            result
        )


        # ====================================================
        # PRINT JSON
        # ====================================================

        print(
            "\nJSON OUTPUT:"
        )

        print(
            json.dumps(
                result,
                indent=4
            )
        )


    except Exception as e:

        print("\n")
        print("=" * 70)
        print("AGRISHIELD AI - PIPELINE ERROR")
        print("=" * 70)

        print(
            f"\n{type(e).__name__}: {e}"
        )

        print("=" * 70)

        sys.exit(1)