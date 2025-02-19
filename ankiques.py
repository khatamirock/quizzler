import csv

def convert_tsv_to_questions(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as tsv_file, \
         open(output_file, 'w', encoding='utf-8') as out_file:
        
        # Skip the header row
        next(tsv_file)
        
        # Create CSV reader with tab delimiter
        reader = csv.reader(tsv_file, delimiter='\t')
        
        for i, row in enumerate(reader, 1):
            if len(row) < 6:  # Skip incomplete rows
                continue
                
            question, op1, op2, op3, op4, answer = row[:6]
            
            # Format the question
            out_file.write(f"প্রশ্ন {i}: {question}\n\n")
            
            # Format the options
            out_file.write(f"ক) {op1}\n")
            out_file.write(f"খ) {op2}\n")
            out_file.write(f"গ) {op3}\n")
            out_file.write(f"ঘ) {op4}\n")
            
            # Format the answer
            # Find which option matches the answer
            options = [op1, op2, op3, op4]
            answer_index = options.index(answer) if answer in options else -1
            bangla_options = ['ক', 'খ', 'গ', 'ঘ']
            
            if answer_index != -1:
                out_file.write(f"উত্তর: {bangla_options[answer_index]}\n")
            else:
                out_file.write(f"উত্তর: {answer}\n")
            
            # Add a separator between questions
            out_file.write("\n" + "="*50 + "\n\n")

# Usage
input_file = "anki.txt"
output_file = "output.txt"
convert_tsv_to_questions(input_file, output_file)