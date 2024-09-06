import re
import json
import os
from docx import Document

def clean_text(text):
    return re.sub(r'\s+', ' ', text).strip()

def extract_qa(text):
    questions = re.split(r'\n(\d+)\.', text)[1:]
    results = []
    
    for i in range(0, len(questions), 2):
        number = questions[i]
        q = questions[i+1] if i+1 < len(questions) else ""
        
        # Check if the question is in the new format
        new_format = re.match(r'(.*?)\s*a\.\s*(.*?)\s*b\.\s*(.*?)\s*c\.\s*(.*?)\s*d\.\s*(.*?)\s*Answer:\s*\(([a-d])\)', q, re.DOTALL | re.IGNORECASE)
        
        if new_format:
            question_text = clean_text(new_format.group(1))
            options = [
                ('a', clean_text(new_format.group(2))),
                ('b', clean_text(new_format.group(3))),
                ('c', clean_text(new_format.group(4))),
                ('d', clean_text(new_format.group(5)))
            ]
            answer = new_format.group(6).upper()
        else:
            # Use the previous method for other formats
            answer_match = re.search(r'Answer:\s*\(([a-d])\)', q, re.IGNORECASE)
            answer = answer_match.group(1).upper() if answer_match else None
            
            q = re.sub(r'Answer:.*', '', q)
            options = re.findall(r'([a-d])\.(.*?)(?=\n[a-d]\.|\Z)', q, re.DOTALL | re.IGNORECASE)
            
            question_text = re.sub(r'([a-d])\..*', '', q, flags=re.DOTALL | re.IGNORECASE)
            question_text = clean_text(question_text)
            
            options = [(opt[0], clean_text(opt[1])) for opt in options]
        
        formatted_question = {
            "question_id": int(number),
            "question_text": question_text,
            "options": [
                {"text": option[1], "value": option[0].upper()}
                for option in options
            ],
            "correct_answer": answer
        }
        
        results.append(formatted_question)
    
    return results

def process_doc_file(file_path):
    doc = Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return '\n'.join(full_text)

def process_folder(folder_path):
    all_questions = []
    for filename in os.listdir(folder_path):
        if filename.endswith('.doc') or filename.endswith('.docx'):
            file_path = os.path.join(folder_path, filename)
            print(f"Processing file: {filename}")
            raw_text = process_doc_file(file_path)
            questions = extract_qa(raw_text)
            all_questions.extend(questions)
    return all_questions

# Specify the folder containing your .doc files
folder_path = 'Swe'

# Process all .doc files in the folder
extracted = process_folder(folder_path)

# Write to JSON file
output_filename = 'output_extracted.json'
with open(output_filename, 'w', encoding='utf-8') as file:
    json.dump({"questions": extracted}, file, indent=2, ensure_ascii=False)

print(f"Extraction complete. Results saved to {output_filename}")