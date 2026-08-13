import os
import sys
import json

import numpy as np
import tensorflow as tf
import cv2


# ============================================================
# AGRISHIELD AI - GRAD-CAM EXPLAINABILITY
# ============================================================
#
# PURPOSE:
#
# This file DOES NOT make an independent diagnosis.
#
# The same model prediction used by predict.py is used here.
#
# Pipeline:
#
# Image
#   ↓
# MobileNetV2
#   ↓
# Prediction
#   ↓
# Predicted class
#   ↓
# Grad-CAM for THAT SAME class
#
# Example:
#
# predict.py:
#     healthy = 99.87%
#
# Grad-CAM:
#     healthy = 99.87%
#
# It must NEVER show:
#
#     predict.py → healthy
#     gradcam.py → bacterial_blight
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


DEFAULT_OUTPUT_PATH = os.path.join(
    BASE_DIR,
    "models",
    "gradcam_result.jpg"
)


IMG_SIZE = (224, 224)


# ============================================================
# CHECK FILES
# ============================================================

if not os.path.exists(MODEL_PATH):

    raise FileNotFoundError(
        f"\nModel not found:\n{MODEL_PATH}\n"
    )


if not os.path.exists(CLASS_PATH):

    raise FileNotFoundError(
        f"\nClass names file not found:\n{CLASS_PATH}\n"
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
# VALIDATE CLASSES
# ============================================================

EXPECTED_CLASSES = {
    "bacterial_blight",
    "curl_virus",
    "fussarium_wilt",
    "healthy"
}


if set(class_names) != EXPECTED_CLASSES:

    raise ValueError(
        "\nInvalid class_names.json.\n"
        f"Expected: {EXPECTED_CLASSES}\n"
        f"Found: {set(class_names)}"
    )


# ============================================================
# FIND MOBILENETV2 BASE MODEL
# ============================================================

base_model = None

for layer in model.layers:

    if isinstance(
        layer,
        tf.keras.Model
    ):

        if "mobilenet" in layer.name.lower():

            base_model = layer
            break


if base_model is None:

    raise RuntimeError(
        "\nMobileNetV2 base model could not be found.\n"
        "Available layers:\n"
        +
        "\n".join(
            layer.name
            for layer in model.layers
        )
    )


print(
    "\nBase model:",
    base_model.name
)


# ============================================================
# FIND LAST CONVOLUTIONAL LAYER
# ============================================================

last_conv_layer = None

for layer in reversed(
    base_model.layers
):

    if isinstance(
        layer,
        tf.keras.layers.Conv2D
    ):

        last_conv_layer = layer
        break


if last_conv_layer is None:

    raise RuntimeError(
        "Could not find the last Conv2D layer."
    )


print(
    "Grad-CAM layer:",
    last_conv_layer.name
)


# ============================================================
# FIND CLASSIFIER LAYERS
# ============================================================
#
# The trained model is:
#
# Input
#   ↓
# Data augmentation
#   ↓
# preprocess_input
#   ↓
# MobileNetV2
#   ↓
# GlobalAveragePooling
#   ↓
# Dropout
#   ↓
# Dense
#   ↓
# Dropout
#   ↓
# disease_prediction
#
# ============================================================

classifier_layers = []

found_base_model = False

for layer in model.layers:

    if layer == base_model:

        found_base_model = True
        continue

    if found_base_model:

        classifier_layers.append(layer)


print(
    "Classifier layers:",
    [
        layer.name
        for layer in classifier_layers
    ]
)


# ============================================================
# CREATE GRAD-CAM BASE MODEL
# ============================================================

gradcam_base_model = tf.keras.models.Model(

    inputs=base_model.input,

    outputs=[
        last_conv_layer.output,
        base_model.output
    ],

    name="gradcam_base_model"
)


# ============================================================
# RUN CLASSIFIER
# ============================================================

def run_classifier(
    base_output,
    training=False
):

    x = base_output

    for layer in classifier_layers:

        x = layer(
            x,
            training=training
        )

    return x


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

def preprocess_image(
    image_path
):

    if not os.path.exists(
        image_path
    ):

        raise FileNotFoundError(
            f"\nImage not found:\n{image_path}"
        )


    original = cv2.imread(
        image_path
    )


    if original is None:

        raise ValueError(
            f"\nUnable to read image:\n{image_path}"
        )


    original_rgb = cv2.cvtColor(
        original,
        cv2.COLOR_BGR2RGB
    )


    resized = cv2.resize(
        original_rgb,
        IMG_SIZE
    )


    image_array = np.array(
        resized,
        dtype=np.float32
    )


    image_array = np.expand_dims(
        image_array,
        axis=0
    )


    # ========================================================
    # MobileNetV2 preprocessing
    # ========================================================

    image_array = (
        tf.keras.applications.mobilenet_v2.preprocess_input(
            image_array
        )
    )


    return original, image_array


# ============================================================
# GENERATE GRAD-CAM
# ============================================================

def generate_gradcam(
    image_path,
    output_path=DEFAULT_OUTPUT_PATH,
    target_class_index=None
):

    # ========================================================
    # PREPROCESS IMAGE
    # ========================================================

    original, image_array = preprocess_image(
        image_path
    )


    # ========================================================
    # GRADIENT CALCULATION
    # ========================================================

    with tf.GradientTape() as tape:

        conv_outputs, base_output = (
            gradcam_base_model(
                image_array,
                training=False
            )
        )


        predictions = run_classifier(
            base_output,
            training=False
        )


        # ====================================================
        # IMPORTANT
        # ====================================================
        #
        # If predict.py provides the class index,
        # Grad-CAM uses EXACTLY that class.
        #
        # Otherwise, we use the model's argmax.
        #
        # ====================================================

        if target_class_index is None:

            predicted_index = tf.argmax(
                predictions[0]
            )

        else:

            predicted_index = tf.constant(
                int(target_class_index),
                dtype=tf.int64
            )


        class_score = predictions[
            0,
            predicted_index
        ]


    # ========================================================
    # CALCULATE GRADIENTS
    # ========================================================

    gradients = tape.gradient(
        class_score,
        conv_outputs
    )


    if gradients is None:

        raise RuntimeError(
            "\nGradients are None.\n"
            "Grad-CAM could not calculate gradients."
        )


    # ========================================================
    # GLOBAL AVERAGE POOLING
    # ========================================================

    pooled_gradients = tf.reduce_mean(
        gradients,
        axis=(0, 1, 2)
    )


    conv_outputs = conv_outputs[0]


    # ========================================================
    # WEIGHT FEATURE MAPS
    # ========================================================

    heatmap = tf.reduce_sum(
        conv_outputs
        *
        pooled_gradients[
            tf.newaxis,
            tf.newaxis,
            :
        ],
        axis=-1
    )


    # ========================================================
    # RELU
    # ========================================================

    heatmap = tf.maximum(
        heatmap,
        0
    )


    # ========================================================
    # NORMALIZE
    # ========================================================

    max_value = tf.reduce_max(
        heatmap
    )


    if float(
        max_value
    ) > 0:

        heatmap = (
            heatmap
            /
            max_value
        )


    heatmap = heatmap.numpy()


    # ========================================================
    # RESIZE HEATMAP
    # ========================================================

    heatmap = cv2.resize(
        heatmap,
        (
            original.shape[1],
            original.shape[0]
        )
    )


    # ========================================================
    # CONVERT TO UINT8
    # ========================================================

    heatmap_uint8 = np.uint8(
        255 * heatmap
    )


    # ========================================================
    # COLOR MAP
    # ========================================================

    heatmap_color = cv2.applyColorMap(
        heatmap_uint8,
        cv2.COLORMAP_JET
    )


    # ========================================================
    # OVERLAY
    # ========================================================

    overlay = cv2.addWeighted(
        original,
        0.55,
        heatmap_color,
        0.45,
        0
    )


    # ========================================================
    # SAVE
    # ========================================================

    output_directory = os.path.dirname(
        output_path
    )


    if output_directory:

        os.makedirs(
            output_directory,
            exist_ok=True
        )


    success = cv2.imwrite(
        output_path,
        overlay
    )


    if not success:

        raise RuntimeError(
            f"\nFailed to save Grad-CAM:\n"
            f"{output_path}"
        )


    # ========================================================
    # FINAL PREDICTION
    # ========================================================

    predicted_index_int = int(
        predicted_index.numpy()
    )


    confidence = float(
        predictions[
            0,
            predicted_index_int
        ].numpy()
    )


    predicted_class = class_names[
        predicted_index_int
    ]


    # ========================================================
    # RESULT
    # ========================================================

    return {

        "method":
            "Grad-CAM",

        "predicted_class":
            predicted_class,

        "class_index":
            predicted_index_int,

        "confidence":
            round(
                confidence * 100,
                2
            ),

        "heatmap_path":
            output_path
    }


# ============================================================
# COMMAND LINE EXECUTION
# ============================================================

if __name__ == "__main__":

    if len(sys.argv) < 2:

        print(
            "\nUsage:"
        )

        print(
            'python src\\gradcam.py "path\\to\\image.jpg"'
        )

        sys.exit(1)


    image_path = sys.argv[1]


    # ========================================================
    # OPTIONAL CLASS INDEX
    # ========================================================
    #
    # You can optionally provide:
    #
    # python src\gradcam.py image.jpg 3
    #
    # where:
    #
    # 0 = bacterial_blight
    # 1 = curl_virus
    # 2 = fussarium_wilt
    # 3 = healthy
    #
    # ========================================================

    target_class_index = None


    if len(sys.argv) >= 3:

        target_class_index = int(
            sys.argv[2]
        )


    try:

        result = generate_gradcam(

            image_path,

            DEFAULT_OUTPUT_PATH,

            target_class_index
        )


        print("\n")
        print("=" * 70)
        print("             AGRISHIELD AI")
        print("             GRAD-CAM EXPLAINABILITY")
        print("=" * 70)


        print(
            "\nGrad-CAM Class"
        )

        print(
            f"  {result['predicted_class']}"
        )


        print(
            "\nConfidence"
        )

        print(
            f"  {result['confidence']}%"
        )


        print(
            "\nHeatmap"
        )

        print(
            f"  {result['heatmap_path']}"
        )


        print(
            "\n"
            + "=" * 70
        )


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
        print("AGRISHIELD AI - GRAD-CAM ERROR")
        print("=" * 70)


        print(
            f"\n{type(e).__name__}: {e}"
        )


        print("=" * 70)


        sys.exit(1)