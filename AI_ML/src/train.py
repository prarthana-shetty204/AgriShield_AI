import os
import json

import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)
from sklearn.utils.class_weight import compute_class_weight
import matplotlib.pyplot as plt


# ============================================================
# AGRISHIELD AI
# MODEL TRAINING - MOBILENETV2
# ============================================================

print("\n")
print("=" * 70)
print("                    AGRISHIELD AI")
print("              COTTON DISEASE CLASSIFIER")
print("=" * 70)


# ============================================================
# PATH CONFIGURATION
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)


TRAIN_DIR = os.path.join(
    BASE_DIR,
    "dataset",
    "train"
)


VAL_DIR = os.path.join(
    BASE_DIR,
    "dataset",
    "validation"
)


MODEL_DIR = os.path.join(
    BASE_DIR,
    "models"
)


os.makedirs(
    MODEL_DIR,
    exist_ok=True
)


# ============================================================
# CONFIGURATION
# ============================================================

IMG_SIZE = (
    224,
    224
)

BATCH_SIZE = 16

INITIAL_EPOCHS = 15

FINE_TUNE_EPOCHS = 15

SEED = 42


# ============================================================
# EXPECTED CLASS ORDER
# ============================================================
#
# THIS ORDER MUST NOT CHANGE.
#
# 0 -> bacterial_blight
# 1 -> curl_virus
# 2 -> fussarium_wilt
# 3 -> healthy
#
# ============================================================

EXPECTED_CLASSES = [

    "bacterial_blight",

    "curl_virus",

    "fussarium_wilt",

    "healthy"

]


NUM_CLASSES = len(
    EXPECTED_CLASSES
)


# ============================================================
# CHECK DATASET DIRECTORIES
# ============================================================

if not os.path.isdir(
    TRAIN_DIR
):

    raise FileNotFoundError(
        f"\nTraining directory not found:\n{TRAIN_DIR}"
    )


if not os.path.isdir(
    VAL_DIR
):

    raise FileNotFoundError(
        f"\nValidation directory not found:\n{VAL_DIR}"
    )


print("\nTraining directory:")
print(TRAIN_DIR)


print("\nValidation directory:")
print(VAL_DIR)


# ============================================================
# CHECK CLASS FOLDERS
# ============================================================

print("\n")
print("=" * 70)
print("CHECKING DATASET")
print("=" * 70)


for class_name in EXPECTED_CLASSES:

    train_class_path = os.path.join(
        TRAIN_DIR,
        class_name
    )

    val_class_path = os.path.join(
        VAL_DIR,
        class_name
    )


    if not os.path.isdir(
        train_class_path
    ):

        raise FileNotFoundError(
            f"\nMissing training class:\n"
            f"{train_class_path}"
        )


    if not os.path.isdir(
        val_class_path
    ):

        raise FileNotFoundError(
            f"\nMissing validation class:\n"
            f"{val_class_path}"
        )


print(
    "\nAll four classes found successfully."
)


# ============================================================
# COUNT IMAGES
# ============================================================

IMAGE_EXTENSIONS = (

    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp"

)


print("\n")
print("=" * 70)
print("DATASET DISTRIBUTION")
print("=" * 70)


for class_name in EXPECTED_CLASSES:

    train_class_path = os.path.join(
        TRAIN_DIR,
        class_name
    )

    val_class_path = os.path.join(
        VAL_DIR,
        class_name
    )


    train_count = sum(

        1

        for file in os.listdir(
            train_class_path
        )

        if file.lower().endswith(
            IMAGE_EXTENSIONS
        )

    )


    val_count = sum(

        1

        for file in os.listdir(
            val_class_path
        )

        if file.lower().endswith(
            IMAGE_EXTENSIONS
        )

    )


    print(
        f"{class_name:<22}"
        f"Train: {train_count:<6}"
        f"Validation: {val_count}"
    )


# ============================================================
# LOAD TRAINING DATASET
# ============================================================

print("\n")
print("Loading training dataset...")


train_ds = tf.keras.utils.image_dataset_from_directory(

    TRAIN_DIR,

    labels="inferred",

    label_mode="int",

    class_names=EXPECTED_CLASSES,

    image_size=IMG_SIZE,

    batch_size=BATCH_SIZE,

    shuffle=True,

    seed=SEED

)


# ============================================================
# LOAD VALIDATION DATASET
# ============================================================

print("\n")
print("Loading validation dataset...")


val_ds = tf.keras.utils.image_dataset_from_directory(

    VAL_DIR,

    labels="inferred",

    label_mode="int",

    class_names=EXPECTED_CLASSES,

    image_size=IMG_SIZE,

    batch_size=BATCH_SIZE,

    shuffle=False

)


# ============================================================
# VERIFY CLASS ORDER
# ============================================================

print("\n")
print("=" * 70)
print("CLASS ORDER")
print("=" * 70)


print(
    "Training classes:"
)

print(
    train_ds.class_names
)


print(
    "\nValidation classes:"
)

print(
    val_ds.class_names
)


if train_ds.class_names != EXPECTED_CLASSES:

    raise ValueError(
        "\nTraining class order does not match EXPECTED_CLASSES."
    )


if val_ds.class_names != EXPECTED_CLASSES:

    raise ValueError(
        "\nValidation class order does not match EXPECTED_CLASSES."
    )


print(
    "\nClass order verified successfully."
)


# ============================================================
# SAVE CLASS NAMES
# ============================================================

CLASS_NAMES_PATH = os.path.join(

    MODEL_DIR,

    "class_names.json"

)


with open(
    CLASS_NAMES_PATH,
    "w"
) as f:

    json.dump(

        EXPECTED_CLASSES,

        f,

        indent=4

    )


print(
    f"\nClass names saved to:"
    f"\n{CLASS_NAMES_PATH}"
)


# ============================================================
# PERFORMANCE OPTIMIZATION
# ============================================================

AUTOTUNE = tf.data.AUTOTUNE


train_ds = train_ds.prefetch(
    AUTOTUNE
)


val_ds = val_ds.prefetch(
    AUTOTUNE
)


# ============================================================
# CALCULATE CLASS WEIGHTS
# ============================================================

print("\n")
print("=" * 70)
print("CALCULATING CLASS WEIGHTS")
print("=" * 70)


train_labels = []


for _, labels in train_ds:

    train_labels.extend(
        labels.numpy().tolist()
    )


train_labels = np.array(
    train_labels
)


class_weights_array = compute_class_weight(

    class_weight="balanced",

    classes=np.arange(
        NUM_CLASSES
    ),

    y=train_labels

)


class_weights = {

    i: float(
        class_weights_array[i]
    )

    for i in range(
        NUM_CLASSES
    )

}


for i in range(
    NUM_CLASSES
):

    print(
        f"{EXPECTED_CLASSES[i]:<22}"
        f": {class_weights[i]:.4f}"
    )


# ============================================================
# DATA AUGMENTATION
# ============================================================

data_augmentation = keras.Sequential(

    [

        layers.RandomFlip(
            "horizontal"
        ),

        layers.RandomRotation(
            0.10
        ),

        layers.RandomZoom(
            0.10
        ),

        layers.RandomContrast(
            0.10
        )

    ],

    name="data_augmentation"

)


# ============================================================
# LOAD MOBILENETV2
# ============================================================

print("\n")
print("=" * 70)
print("BUILDING MOBILENETV2")
print("=" * 70)


base_model = MobileNetV2(

    input_shape=(

        IMG_SIZE[0],

        IMG_SIZE[1],

        3

    ),

    include_top=False,

    weights="imagenet"

)


# ============================================================
# PHASE 1 - FREEZE BASE MODEL
# ============================================================

base_model.trainable = False


# ============================================================
# INPUT
# ============================================================

inputs = keras.Input(

    shape=(

        IMG_SIZE[0],

        IMG_SIZE[1],

        3

    ),

    name="image"

)


# ============================================================
# DATA AUGMENTATION
# ============================================================

x = data_augmentation(
    inputs
)


# ============================================================
# MOBILENETV2 PREPROCESSING
# ============================================================
#
# IMPORTANT:
#
# This preprocessing is INSIDE the model.
#
# Therefore predict.py must NOT apply
# MobileNetV2 preprocess_input again.
#
# ============================================================

x = tf.keras.applications.mobilenet_v2.preprocess_input(
    x
)


# ============================================================
# MOBILENETV2 BACKBONE
# ============================================================

x = base_model(

    x,

    training=False

)


# ============================================================
# GLOBAL AVERAGE POOLING
# ============================================================

x = layers.GlobalAveragePooling2D()(
    x
)


# ============================================================
# DROPOUT
# ============================================================

x = layers.Dropout(
    0.30
)(
    x
)


# ============================================================
# DENSE LAYER
# ============================================================

x = layers.Dense(

    128,

    activation="relu"

)(
    x
)


# ============================================================
# DROPOUT
# ============================================================

x = layers.Dropout(
    0.20
)(
    x
)


# ============================================================
# OUTPUT LAYER
# ============================================================
#
# 4 outputs:
#
# 0 -> bacterial_blight
# 1 -> curl_virus
# 2 -> fussarium_wilt
# 3 -> healthy
#
# ============================================================

outputs = layers.Dense(

    NUM_CLASSES,

    activation="softmax",

    name="disease_prediction"

)(
    x
)


# ============================================================
# CREATE MODEL
# ============================================================

model = keras.Model(

    inputs,

    outputs,

    name="AgriShield_MobileNetV2"

)


# ============================================================
# COMPILE PHASE 1
# ============================================================

model.compile(

    optimizer=keras.optimizers.Adam(

        learning_rate=1e-4

    ),

    loss=keras.losses.SparseCategoricalCrossentropy(),

    metrics=[

        "accuracy"

    ]

)


# ============================================================
# MODEL SUMMARY
# ============================================================

model.summary()


# ============================================================
# BEST MODEL PATH
# ============================================================

BEST_MODEL_PATH = os.path.join(

    MODEL_DIR,

    "agrishield_mobilenetv2_best.keras"

)


# ============================================================
# CALLBACKS
# ============================================================

callbacks = [

    ModelCheckpoint(

        BEST_MODEL_PATH,

        monitor="val_accuracy",

        save_best_only=True,

        mode="max",

        verbose=1

    ),

    EarlyStopping(

        monitor="val_loss",

        patience=5,

        restore_best_weights=True,

        verbose=1

    ),

    ReduceLROnPlateau(

        monitor="val_loss",

        factor=0.3,

        patience=2,

        min_lr=1e-7,

        verbose=1

    )

]


# ============================================================
# PHASE 1
# ============================================================

print("\n")
print("=" * 70)
print("PHASE 1 - TRANSFER LEARNING")
print("=" * 70)


history_initial = model.fit(

    train_ds,

    validation_data=val_ds,

    epochs=INITIAL_EPOCHS,

    class_weight=class_weights,

    callbacks=callbacks

)


# ============================================================
# PHASE 2 - FINE TUNING
# ============================================================

print("\n")
print("=" * 70)
print("PHASE 2 - FINE TUNING")
print("=" * 70)


base_model.trainable = True


# ============================================================
# FREEZE EARLY MOBILENETV2 LAYERS
# ============================================================

for layer in base_model.layers[:-40]:

    layer.trainable = False


# ============================================================
# KEEP BATCH NORMALIZATION FROZEN
# ============================================================

for layer in base_model.layers:

    if isinstance(
        layer,
        layers.BatchNormalization
    ):

        layer.trainable = False


# ============================================================
# RECOMPILE
# ============================================================

model.compile(

    optimizer=keras.optimizers.Adam(

        learning_rate=1e-5

    ),

    loss=keras.losses.SparseCategoricalCrossentropy(),

    metrics=[

        "accuracy"

    ]

)


# ============================================================
# FINE-TUNE
# ============================================================

history_fine = model.fit(

    train_ds,

    validation_data=val_ds,

    epochs=FINE_TUNE_EPOCHS,

    class_weight=class_weights,

    callbacks=callbacks

)


# ============================================================
# LOAD BEST MODEL
# ============================================================

print("\n")
print("Loading best saved model...")


best_model = keras.models.load_model(
    BEST_MODEL_PATH
)


# ============================================================
# FINAL MODEL PATH
# ============================================================

FINAL_MODEL_PATH = os.path.join(

    MODEL_DIR,

    "agrishield_mobilenetv2_final.keras"

)


best_model.save(
    FINAL_MODEL_PATH
)


# ============================================================
# FINAL VALIDATION
# ============================================================

print("\n")
print("=" * 70)
print("FINAL VALIDATION")
print("=" * 70)


val_loss, val_accuracy = best_model.evaluate(

    val_ds,

    verbose=1

)


print(
    f"\nValidation Loss     : "
    f"{val_loss:.4f}"
)


print(
    f"Validation Accuracy : "
    f"{val_accuracy * 100:.2f}%"
)


# ============================================================
# SAVE TRAINING HISTORY
# ============================================================

history_data = {

    "phase1": history_initial.history,

    "phase2": history_fine.history

}


HISTORY_PATH = os.path.join(

    MODEL_DIR,

    "training_history.json"

)


with open(
    HISTORY_PATH,
    "w"
) as f:

    json.dump(

        history_data,

        f,

        indent=4

    )


# ============================================================
# COMBINE ACCURACY
# ============================================================

accuracy = (

    history_initial.history["accuracy"]

    +

    history_fine.history["accuracy"]

)


validation_accuracy = (

    history_initial.history["val_accuracy"]

    +

    history_fine.history["val_accuracy"]

)


# ============================================================
# COMBINE LOSS
# ============================================================

loss = (

    history_initial.history["loss"]

    +

    history_fine.history["loss"]

)


validation_loss = (

    history_initial.history["val_loss"]

    +

    history_fine.history["val_loss"]

)


# ============================================================
# ACCURACY GRAPH
# ============================================================

plt.figure(
    figsize=(10, 6)
)


plt.plot(

    accuracy,

    label="Training Accuracy"

)


plt.plot(

    validation_accuracy,

    label="Validation Accuracy"

)


plt.xlabel(
    "Epoch"
)


plt.ylabel(
    "Accuracy"
)


plt.title(

    "AgriShield AI - Training vs Validation Accuracy"

)


plt.legend()


accuracy_graph_path = os.path.join(

    MODEL_DIR,

    "training_accuracy.png"

)


plt.savefig(

    accuracy_graph_path,

    dpi=300,

    bbox_inches="tight"

)


plt.close()


# ============================================================
# LOSS GRAPH
# ============================================================

plt.figure(
    figsize=(10, 6)
)


plt.plot(

    loss,

    label="Training Loss"

)


plt.plot(

    validation_loss,

    label="Validation Loss"

)


plt.xlabel(
    "Epoch"
)


plt.ylabel(
    "Loss"
)


plt.title(

    "AgriShield AI - Training vs Validation Loss"

)


plt.legend()


loss_graph_path = os.path.join(

    MODEL_DIR,

    "training_loss.png"

)


plt.savefig(

    loss_graph_path,

    dpi=300,

    bbox_inches="tight"

)


plt.close()


# ============================================================
# FINAL OUTPUT
# ============================================================

print("\n")
print("=" * 70)
print("                TRAINING COMPLETED")
print("=" * 70)


print(
    "\nClasses:"
)


for i, class_name in enumerate(
    EXPECTED_CLASSES
):

    print(
        f"{i} -> {class_name}"
    )


print(
    f"\nBest Model:"
    f"\n{BEST_MODEL_PATH}"
)


print(
    f"\nFinal Model:"
    f"\n{FINAL_MODEL_PATH}"
)


print(
    f"\nClass Names:"
    f"\n{CLASS_NAMES_PATH}"
)


print(
    f"\nValidation Accuracy:"
    f"\n{val_accuracy * 100:.2f}%"
)


print(
    f"\nAccuracy Graph:"
    f"\n{accuracy_graph_path}"
)


print(
    f"\nLoss Graph:"
    f"\n{loss_graph_path}"
)


print("\n")
print("=" * 70)
print("AgriShield AI training finished successfully.")
print("=" * 70)