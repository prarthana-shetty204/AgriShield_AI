import json


# ============================================================
# AGRISHIELD AI - DECISION SUPPORT ENGINE
# ============================================================
#
# IMPORTANT:
#
# This file DOES NOT take an image.
#
# predict.py automatically sends:
#
#     disease
#     confidence
#
# to this engine.
#
# Flow:
#
# Image
#   ↓
# predict.py
#   ↓
# Disease + Confidence
#   ↓
# decision_engine.py
#   ↓
# Severity + Risk + Actions
#
# ============================================================


# ============================================================
# DECISION RULES
# ============================================================

DECISION_RULES = {

    "bacterial_blight": {

        "display_name": "Bacterial Blight",

        "crop": "Cotton",

        "disease_type": "Bacterial disease",

        "severity_guidance": {

            "low":
                "Early-stage bacterial blight symptoms are indicated. Closely monitor the affected plant.",

            "moderate":
                "Bacterial blight symptoms require prompt field inspection and management.",

            "high":
                "Strong bacterial blight indication detected. Immediate field-level management is recommended."
        },

        "immediate_action": [

            "Inspect the affected plant and nearby cotton plants.",

            "Remove severely affected plant material where appropriate.",

            "Maintain good field sanitation.",

            "Avoid unnecessary movement through affected areas.",

            "Monitor nearby plants for new symptoms."
        ],

        "management": [

            "Use disease-free planting material.",

            "Maintain proper field sanitation.",

            "Avoid excessive irrigation and prolonged leaf wetness.",

            "Monitor disease spread regularly.",

            "Follow locally recommended bacterial disease management practices.",

            "Consult an agricultural expert before applying chemical treatments."
        ],

        "monitoring_interval":
            "Inspect the affected area every 2–3 days.",

        "escalation_warning":
            "If symptoms spread rapidly or multiple plants become affected, seek agricultural expert advice.",

        "farmer_message":
            "Bacterial blight was detected in the cotton image. Inspect nearby plants and begin appropriate disease management."
    },


    "curl_virus": {

        "display_name": "Cotton Leaf Curl Virus",

        "crop": "Cotton",

        "disease_type": "Viral disease",

        "severity_guidance": {

            "low":
                "Early symptoms of cotton leaf curl virus are indicated. Closely monitor the plant and surrounding plants.",

            "moderate":
                "Visible viral disease symptoms are indicated. Inspect surrounding plants and monitor possible vector activity.",

            "high":
                "Strong indication of cotton leaf curl virus. Immediate field inspection and expert guidance are recommended."
        },

        "immediate_action": [

            "Inspect nearby cotton plants for similar symptoms.",

            "Monitor for whitefly and other possible disease vectors.",

            "Remove severely affected plants where locally recommended.",

            "Maintain field sanitation.",

            "Monitor surrounding plants for disease spread."
        ],

        "management": [

            "Use recommended resistant or tolerant cotton varieties where available.",

            "Monitor vector populations.",

            "Maintain proper weed management.",

            "Follow locally recommended vector-management practices.",

            "Remove severely affected plants according to local agricultural guidance.",

            "Consult an agricultural expert if disease spread is rapid."
        ],

        "monitoring_interval":
            "Inspect the field every 2–3 days during active disease spread.",

        "escalation_warning":
            "Rapid spread across multiple plants requires immediate field-level assessment.",

        "farmer_message":
            "Cotton leaf curl virus was detected. Inspect nearby plants and monitor disease vectors closely."
    },


    "fussarium_wilt": {

        "display_name": "Fusarium Wilt",

        "crop": "Cotton",

        "disease_type": "Fungal disease",

        "severity_guidance": {

            "low":
                "Early wilt symptoms are indicated. Monitor the affected plant and nearby plants.",

            "moderate":
                "Fusarium wilt symptoms require prompt field inspection and management.",

            "high":
                "Strong indication of Fusarium wilt. Immediate field-level intervention is recommended."
        },

        "immediate_action": [

            "Inspect nearby cotton plants for wilting symptoms.",

            "Remove severely affected plant material where appropriate.",

            "Avoid moving potentially contaminated soil between field areas.",

            "Maintain field sanitation.",

            "Monitor nearby plants for additional symptoms."
        ],

        "management": [

            "Use disease-free planting material.",

            "Use recommended resistant or tolerant varieties where available.",

            "Maintain proper soil and field management.",

            "Avoid unnecessary movement of contaminated soil.",

            "Monitor disease spread regularly.",

            "Follow locally recommended fungal disease management practices."
        ],

        "monitoring_interval":
            "Inspect the affected field every 2–3 days.",

        "escalation_warning":
            "If wilting increases rapidly across the field, consult an agricultural expert.",

        "farmer_message":
            "Fusarium wilt was detected in the cotton crop. Monitor nearby plants and take appropriate field-management measures."
    },


    "healthy": {

        "display_name": "Healthy Cotton",

        "crop": "Cotton",

        "disease_type": "No detected disease",

        "severity_guidance": {

            "low":
                "No significant disease symptoms are indicated by the model.",

            "moderate":
                "The model indicates a healthy crop, but continued monitoring is recommended.",

            "high":
                "No disease is indicated, but normal field monitoring should continue."
        },

        "immediate_action": [

            "Continue normal crop monitoring.",

            "Maintain appropriate irrigation.",

            "Maintain balanced crop nutrition.",

            "Regularly inspect leaves and stems for new symptoms."
        ],

        "management": [

            "Maintain good field sanitation.",

            "Follow recommended irrigation practices.",

            "Maintain balanced crop nutrition.",

            "Continue regular pest and disease scouting."
        ],

        "monitoring_interval":
            "Routine monitoring every 5–7 days.",

        "escalation_warning":
            "If new symptoms appear, perform another AI analysis or seek agricultural advice.",

        "farmer_message":
            "The cotton image appears healthy. Continue regular crop monitoring and good field management."
    }
}


# ============================================================
# NORMALIZE DISEASE
# ============================================================

def normalize_disease_name(disease):

    if disease is None:
        return None

    disease = str(disease).strip().lower()

    aliases = {

        "bacterial blight":
            "bacterial_blight",

        "bacterial_blight":
            "bacterial_blight",

        "curl virus":
            "curl_virus",

        "cotton leaf curl virus":
            "curl_virus",

        "cotton_leaf_curl_virus":
            "curl_virus",

        "curl_virus":
            "curl_virus",

        "fusarium wilt":
            "fussarium_wilt",

        "fussarium wilt":
            "fussarium_wilt",

        "fussarium_wilt":
            "fussarium_wilt",

        "healthy":
            "healthy",

        "healthy cotton":
            "healthy",

        "healthy_cotton":
            "healthy"
    }

    return aliases.get(
        disease,
        disease
    )


# ============================================================
# SEVERITY
# ============================================================

def calculate_severity(
    disease,
    confidence
):

    disease = normalize_disease_name(disease)

    confidence = float(confidence)

    # Healthy is always LOW severity
    if disease == "healthy":
        return "low"

    # Disease severity indicator
    if confidence >= 85:
        return "high"

    elif confidence >= 70:
        return "moderate"

    else:
        return "low"


# ============================================================
# RISK SCORE
# ============================================================

def calculate_risk_score(
    disease,
    confidence,
    severity
):

    disease = normalize_disease_name(disease)

    confidence = float(confidence)

    # Healthy crop
    if disease == "healthy":

        return round(
            max(
                0,
                min(
                    20,
                    20 - confidence * 0.10
                )
            ),
            2
        )

    multipliers = {

        "low": 0.55,

        "moderate": 0.75,

        "high": 1.00
    }

    multiplier = multipliers.get(
        severity,
        0.55
    )

    risk_score = confidence * multiplier

    return round(
        max(
            0,
            min(
                100,
                risk_score
            )
        ),
        2
    )


# ============================================================
# RISK LEVEL
# ============================================================

def get_risk_level(
    disease,
    risk_score
):

    disease = normalize_disease_name(disease)

    if disease == "healthy":
        return "Low"

    if risk_score >= 75:
        return "High"

    elif risk_score >= 50:
        return "Moderate"

    return "Low"


# ============================================================
# GENERATE DECISION
# ============================================================

def generate_decision(
    disease,
    confidence
):

    disease_key = normalize_disease_name(
        disease
    )

    if disease_key not in DECISION_RULES:

        raise ValueError(
            f"Unsupported disease class: {disease}"
        )

    confidence = float(confidence)

    if confidence < 0 or confidence > 100:

        raise ValueError(
            "Confidence must be between 0 and 100."
        )

    rules = DECISION_RULES[
        disease_key
    ]

    severity = calculate_severity(
        disease_key,
        confidence
    )

    risk_score = calculate_risk_score(
        disease_key,
        confidence,
        severity
    )

    risk_level = get_risk_level(
        disease_key,
        risk_score
    )

    return {

        "crop":
            rules["crop"],

        "disease":
            rules["display_name"],

        "disease_class":
            disease_key,

        "disease_type":
            rules["disease_type"],

        "confidence":
            round(
                confidence,
                2
            ),

        "severity":
            severity,

        "severity_explanation":
            rules["severity_guidance"][severity],

        "risk_score":
            risk_score,

        "risk_level":
            risk_level,

        "immediate_action":
            rules["immediate_action"],

        "management_recommendations":
            rules["management"],

        "monitoring_interval":
            rules["monitoring_interval"],

        "escalation_warning":
            rules["escalation_warning"],

        "farmer_message":
            rules["farmer_message"]
    }


# ============================================================
# PRINT DECISION
# ============================================================

def print_decision(result):

    print("\n")
    print("=" * 70)
    print("                 AGRISHIELD AI")
    print("                DECISION SUPPORT")
    print("=" * 70)

    print(
        f"\nCrop              : {result['crop']}"
    )

    print(
        f"Disease           : {result['disease']}"
    )

    print(
        f"Disease Type      : {result['disease_type']}"
    )

    print(
        f"Confidence        : {result['confidence']}%"
    )

    print(
        f"Severity          : {result['severity'].upper()}"
    )

    print(
        f"Risk Score        : {result['risk_score']}/100"
    )

    print(
        f"Risk Level        : {result['risk_level']}"
    )

    print("\nSeverity Assessment:")
    print(
        f"  {result['severity_explanation']}"
    )

    print("\nImmediate Action:")

    for action in result["immediate_action"]:

        print(
            f"  • {action}"
        )

    print("\nManagement Recommendations:")

    for recommendation in result[
        "management_recommendations"
    ]:

        print(
            f"  • {recommendation}"
        )

    print("\nMonitoring:")

    print(
        f"  {result['monitoring_interval']}"
    )

    print("\nEscalation Warning:")

    print(
        f"  {result['escalation_warning']}"
    )

    print("\nFarmer Message:")

    print(
        f"  {result['farmer_message']}"
    )

    print(
        "\n" + "=" * 70
    )