const express = require('express');
const https = require('https');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const GROQ_API_KEY = process.env.GROQ_API_KEY || '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';

const SYS = `You are DGI Bot — official WhatsApp AI for DGI Greater Noida (Dr. Gaur Hari Singhania Institute), Knowledge Park III, Greater Noida UP 201306.
CONTACT: 0120-2323001 | dgi.ac.in | info@dgi.ac.in
COURSES: B.Tech CSE/ECE/ME/Civil/EEE 85k-95k/yr | MBA 75k-85k | MCA 65k-75k | BCA 45k-55k | B.Pharma 60k-70k | Polytechnic 30k-40k | Hostel 70k-90k | Bus 12k-25k
ADMISSION: dgi.ac.in/admission | 10+2 PCM 45% for BTech | Any grad 50% for MBA
PLACEMENT: TCS Infosys Wipro HCL IBM Amazon | Highest 12LPA | Avg 4.5LPA | 85%+ rate
CAMPUS: Library 50k books, 300 computers, WiFi, hostel, sports, cafeteria, ATM, auditorium
EXAMS: AKTU affiliated | aktu.ac.in
RULES: Max 150 words. Use *bold*. Bullets with •. Reply in user language Hindi/English/Hinglish. End with one question.`;

const userHistory = {};

function callGroq(messages, callback) {
  const body = JSON.stringify({
    model: 'llama3-8b-8192',
    messages: messages,
    max_tokens: 400,
    temperature: 0.7
  });

  const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + GROQ_API_KEY,
      'Content-Length': Buffer.byteLength(body)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        const reply = json.choices?.[0]?.message?.content || 'Sorry, please try again!';
        callback(null, reply);
      } catch(e) {
        callback(e, null);
      }
    });
  });

  req.on('error', callback);
  req.write(body);
  req.end();
}

app.post('/webhook', (req, res) => {
  const userMessage = req.body.Body || '';
  const userPhone = req.body.From || 'unknown';

  if (!userHistory[userPhone]) userHistory[userPhone] = [];
  userHistory[userPhone].push({ role: 'user', content: userMessage });
  if (userHistory[userPhone].length > 10) userHistory[userPhone].splice(0, 2);

  const messages = [{ role: 'system', content: SYS }, ...userHistory[userPhone]];

  callGroq(messages, (err, reply) => {
    if (err || !reply) reply = 'Sorry, please try again! Call 0120-2323001';
    else userHistory[userPhone].push({ role: 'assistant', content: reply });

    const safe = reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`);
  });
});

app.get('/', (req, res) => res.send('DGI Bot is LIVE! 🎓'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('DGI Bot running on port ' + PORT));
