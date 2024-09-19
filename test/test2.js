const Groq = require('groq-sdk');
const fs = require('fs');

// Use an environment variable for the API key
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function generateMCQ(question) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `${question}\nfor this question create 4 best matching option with ans. in bangla in this format \n\`প্রশ্ন ১: বাংলাদেশের ক্ষুদ্রতম জেলা কোনটি? \n\nক) নারায়ণগঞ্জ\nখ) মেহেরপুর\nগ) ঝালকাঠি\nঘ) সিলেট\nAnswer: খ)\``
      }
    ],
    model: "llama3-groq-70b-8192-tool-use-preview",
    temperature: 0.5,
    max_tokens: 1024,
    top_p: 0.65,
    stream: false,
    stop: null
  });

  return chatCompletion.choices[0]?.message?.content || '';
}

async function processQuestions() {
  // Read questions from ques.txt
  const questions = fs.readFileSync('ques.txt', 'utf8').split('\n\n');

  let mcqOutput = '';

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i].trim();
    if (question) {
      console.log(`Processing question ${i + 1}...`);
      const mcq = await generateMCQ(question);
      mcqOutput += mcq + '\n\n';
    }
  }

  // Write MCQs to mcq_output.txt
  fs.writeFileSync('mcq_output.txt', mcqOutput, 'utf8');
  console.log('MCQs have been saved to mcq_output.txt');
}

processQuestions().catch(console.error);