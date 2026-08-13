import os
import json
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt

from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    ConfusionMatrixDisplay
)

# ------------------------------------------------------------
# PATHS
# ------------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

TEST_DIR = os.path.join(
    BASE_DIR,
    "dataset",
    "test"
)

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "agrishield_mobilenetv2_best.keras"
)

MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)

# ------------------------------------------------------------
# LOAD MODEL
# ------------------------------------------------------------

print("Loading model...")

model = tf.keras.models.load_model(
    MODEL_PATH
)

# ------------------------------------------------------------
# LOAD TEST DATA
# ------------------------------------------------------------

test_ds = tf.keras.utils.image_dataset_from_directory(
    TEST_DIR,
    image_size=(224, 224),
    batch_size=16,
    shuffle=False
)

class_names = test_ds.class_names

print("\nClasses:")
for i, name in enumerate(class_names):
    print(f"{i}: {name}")

# ------------------------------------------------------------
# PREDICTIONS
# ------------------------------------------------------------

print("\nRunning test evaluation...")

y_true = np.concatenate([
    labels.numpy()
    for _, labels in test_ds
])

predictions = model.predict(
    test_ds,
    verbose=1
)

y_pred = np.argmax(
    predictions,
    axis=1
)

# ------------------------------------------------------------
# CLASSIFICATION REPORT
# ------------------------------------------------------------

report = classification_report(
    y_true,
    y_pred,
    target_names=class_names,
    digits=4
)

print("\n")
print("=" * 60)
print("CLASSIFICATION REPORT")
print("=" * 60)
print(report)

with open(
    os.path.join(
        MODEL_DIR,
        "classification_report.txt"
    ),
    "w"
) as f:
    f.write(report)

# ------------------------------------------------------------
# CONFUSION MATRIX
# ------------------------------------------------------------

cm = confusion_matrix(
    y_true,
    y_pred
)

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=class_names
)

fig, ax = plt.subplots(
    figsize=(8, 8)
)

disp.plot(
    ax=ax,
    xticks_rotation=45
)

plt.title(
    "AgriShield AI - Cotton Disease Confusion Matrix"
)

plt.tight_layout()

cm_path = os.path.join(
    MODEL_DIR,
    "confusion_matrix.png"
)

plt.savefig(
    cm_path,
    dpi=300,
    bbox_inches="tight"
)

plt.close()

print(
    f"\nConfusion matrix saved to:\n{cm_path}"
)

print("\nEvaluation completed.")