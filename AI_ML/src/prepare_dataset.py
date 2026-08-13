import os
import shutil
import random

# Project root = AI_ML
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SOURCE_DIR = os.path.join(
    BASE_DIR,
    "datasets",
    "archive (13)",
    "cotton"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "dataset"
)

TRAIN_RATIO = 0.80
VAL_RATIO = 0.10

random.seed(42)

CLASSES = [
    "bacterial_blight",
    "curl_virus",
    "fussarium_wilt",
    "healthy"
]

print("Source directory:")
print(SOURCE_DIR)

print("\nOutput directory:")
print(OUTPUT_DIR)

# Check source directory
if not os.path.exists(SOURCE_DIR):
    raise FileNotFoundError(
        f"Dataset source directory not found:\n{SOURCE_DIR}"
    )

# Create output directories
for split in ["train", "validation", "test"]:
    for class_name in CLASSES:

        os.makedirs(
            os.path.join(
                OUTPUT_DIR,
                split,
                class_name
            ),
            exist_ok=True
        )

# Split dataset
for class_name in CLASSES:

    source_class = os.path.join(
        SOURCE_DIR,
        class_name
    )

    if not os.path.exists(source_class):
        raise FileNotFoundError(
            f"Class directory not found:\n{source_class}"
        )

    images = [
        file
        for file in os.listdir(source_class)
        if file.lower().endswith(
            (".jpg", ".jpeg", ".png", ".webp")
        )
    ]

    random.shuffle(images)

    total = len(images)

    train_end = int(total * TRAIN_RATIO)

    val_end = train_end + int(
        total * VAL_RATIO
    )

    train_images = images[:train_end]

    validation_images = images[
        train_end:val_end
    ]

    test_images = images[
        val_end:
    ]

    splits = {
        "train": train_images,
        "validation": validation_images,
        "test": test_images
    }

    print(f"\n{class_name}")
    print(f"Total      : {total}")
    print(f"Train      : {len(train_images)}")
    print(f"Validation : {len(validation_images)}")
    print(f"Test       : {len(test_images)}")

    for split, split_images in splits.items():

        destination = os.path.join(
            OUTPUT_DIR,
            split,
            class_name
        )

        for image in split_images:

            source = os.path.join(
                source_class,
                image
            )

            target = os.path.join(
                destination,
                image
            )

            shutil.copy2(
                source,
                target
            )

print("\nDataset preparation completed successfully!")