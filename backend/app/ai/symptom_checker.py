def analyze_symptoms(symptoms: str):

    symptoms = symptoms.lower()

    if "fever" in symptoms and "cough" in symptoms:
        return {
            "possible_condition": "Flu",
            "recommendation": "Consult physician and stay hydrated."
        }

    elif "chest pain" in symptoms:
        return {
            "possible_condition": "Cardiac Issue",
            "recommendation": "Immediate hospital visit recommended."
        }

    elif "headache" in symptoms:
        return {
            "possible_condition": "Migraine",
            "recommendation": "Neurology consultation advised."
        }

    else:
        return {
            "possible_condition": "Unknown",
            "recommendation": "Doctor consultation required."
        }