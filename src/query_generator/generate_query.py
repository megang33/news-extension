import spacy

nlp = spacy.load("en_core_web_sm")

def extract_terms(doc, keep_pos={"NOUN", "PROPN", "ADJ", "NUM"}):

    # extract named entities (i.e. dates, percentages, names)
    entity_spans = [(ent.start, ent.end) for ent in doc.ents]

    def token_in_entities(token_i):
        return any(start <= token_i < end for (start, end) in entity_spans)
    
    entities = [ent.text for ent in doc.ents]

    tokens = [
        token.text for token in doc
        if token.pos_ in keep_pos and not token_in_entities(token.i)
    ]

    return tokens + entities

def generate_clean_query(text, title):
    doc_text = nlp(text)
    doc_title = nlp(title)

    terms_text = extract_terms(doc_text)
    terms_title = extract_terms(doc_title, keep_pos={"PROPN"})
    print("terms_text: ", terms_text)
    print("terms_title: ", terms_title)

    all_terms = terms_text + terms_title
    print("all_terms: ", all_terms)
    seen = set()
    deduped = []
    for word in all_terms:
        print("seen: ", word)
        word = word.strip()
        if word and word.lower() not in seen:
            deduped.append(word)
            seen.add(word.lower())  # case-insensitive deduplication

    query = " ".join(deduped)

    return query