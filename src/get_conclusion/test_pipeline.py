from transformers import pipeline

model_name = "roberta-large-mnli"
classifier = pipeline("zero-shot-classification", model=model_name)

claim = ""
evidence = """
"""

combined_text = f"Claim: {claim}\nEvidence: {evidence}"
result = classifier(combined_text, candidate_labels=["supports", "contradicts", "not enough info"])

print(result)
