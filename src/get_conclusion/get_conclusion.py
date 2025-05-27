from transformers import AutoTokenizer, AutoModelForSequenceClassification, AutoModelForSeq2SeqLM
import torch
import torch.nn.functional as F
import re
from transformers import pipeline

device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

nli_model_name = "roberta-large-mnli"
classifier = pipeline("zero-shot-classification", model=nli_model_name)

def does_passage_support_quote(quote, passage):
    combined_text = f"Claim: {quote}\nEvidence: {passage}"
    result = classifier(combined_text, candidate_labels=["supports", "contradicts", "not enough info"])

    support_prob = result['scores'][result['labels'].index('supports')] if "supports" in result['labels'] else 0
    contradict_prob = result['scores'][result['labels'].index('contradicts')] if "contradicts" in result['labels'] else 0
    unclear_prob = result['scores'][result['labels'].index('not enough info')] if "not enough info" in result['labels'] else 0

    if unclear_prob > 0.5:
        relation = "unclear"
    else:
        relation = "supports" if support_prob > contradict_prob else "contradicts"
    
    return relation, {
        "supports": round(support_prob, 4),
        "contradicts": round(contradict_prob, 4),
        "unclear": round(unclear_prob, 4)
    }

# qa_pipeline = pipeline("question-answering", model="distilbert-base-cased-distilled-squad")

# def extract_relevant_quote(claim, passage, label):
#     if label.lower() == "supports":
#         question = f"What is the most direct complete sentence that supports the claim: {claim}? Only return upto 50 words of the sentence and use ellipses if needed."
#     elif label.lower() == "contradicts":
#         question = f"What is the most direct complete sentence that contradicts the claim: {claim}? Only return upto 50 words of the sentence and use ellipses if needed."
#     else:
#         return "No supporting or contradicting quote found."

#     result = qa_pipeline(question=question, context=passage)
#     answer = result["answer"]

#     sentences = re.split(r'(?<=[.!?]) +', passage)

#     for sentence in sentences:
#         if answer in sentence:
#             return sentence.strip()

#     return answer

qa_pipeline = pipeline("text2text-generation", model="google/flan-t5-small")

def extract_relevant_quote(claim, passage, label):
    if label.lower() == "supports":
        prompt = f"Find a full sentence from the following passage that supports the claim: '{claim}'\nPassage: {passage}"
    elif label.lower() == "contradicts":
        prompt = f"Find a full sentence from the following passage that contradicts the claim: '{claim}'\nPassage: {passage}"
    else:
        return "No supporting or contradicting quote found."

    with torch.no_grad():
        result = qa_pipeline(prompt, max_new_tokens=60, do_sample=False)

    return result[0]["generated_text"]


def get_fact_check_result(quote: str, passage: str) -> dict:
    relation, scores = does_passage_support_quote(quote, passage)

    result = {
        "relation": relation,
        "extractedQuote": None,
        "scores": scores
    }

    if relation in ["supports", "contradicts"]:
        extracted_quote = extract_relevant_quote(quote, passage, relation)
        result["extractedQuote"] = extracted_quote
        
        combined_text = f"Claim: {quote}\nEvidence: {extracted_quote}"
        
        result_classification = classifier(combined_text, candidate_labels=["supports", "contradicts", "not enough info"])

        result["scores"] = {
            "supports": round(result_classification['scores'][result_classification['labels'].index('supports')], 4),
            "contradicts": round(result_classification['scores'][result_classification['labels'].index('contradicts')], 4),
            "unclear": round(result_classification['scores'][result_classification['labels'].index('not enough info')], 4)
        }

        support_prob = result["scores"]["supports"]
        contradict_prob = result["scores"]["contradicts"]

        if result["relation"] != "unclear":
            if support_prob > contradict_prob:
                result["relation"] = "supports"
            else:
                result["relation"] = "contradicts"
        
    return result


# quote = "Climate change is caused by human activities."
# passage = (
#     "Climate scientists have gathered overwhelming evidence that human activities, "
#     "particularly the burning of fossil fuels like coal, oil, and gas, are the primary drivers of recent climate change. "
#     "The resulting increase in greenhouse gases, such as carbon dioxide and methane, has led to a warming of the Earth's atmosphere, "
#     "oceans, and land surfaces. Numerous studies conducted over the past decades consistently link industrial emissions to rising "
#     "global temperatures, melting ice caps, more frequent extreme weather events, and sea-level rise. In 2021, the Intergovernmental "
#     "Panel on Climate Change (IPCC) declared that it is 'unequivocal' that human influence has warmed the atmosphere, ocean, and land. "
#     "These findings are based on a combination of observational data, climate modeling, and attribution studies."
# )
# print(get_fact_check_result(quote, passage))

