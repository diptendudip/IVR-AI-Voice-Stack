// Enhanced structured conversation server with better voice quality and error handling
const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Initialize OpenAI client with better error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY || 'YOUR_API_KEY_HERE',
    baseURL: process.env.OPENAI_ENDPOINT || 'https://cgnet-openai.openai.azure.com/'
  });
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

// Session storage for conversations
const sessions = {};

// Cleanup old sessions periodically
setInterval(() => {
  const now = Date.now();
  const expireTime = 3600000; // 1 hour
  Object.keys(sessions).forEach(key => {
    if (sessions[key].lastUpdated && (now - sessions[key].lastUpdated > expireTime)) {
      delete sessions[key];
    }
  });
}, 300000); // Check every 5 minutes

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Application error:', err);
  
  // Send a friendly TwiML response
  const twiml = new VoiceResponse();
  twiml.say({
    voice: 'Polly.Aditi',
    language: 'hi-IN'
  }, 'क्षमा करें, कुछ तकनीकी समस्या आ गई है। आपका संदेश रिकॉर्ड किया गया है। धन्यवाद।');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Helper function to create journalistic prompts
function createPrompt(stage) {
  const prompts = {
    intro: 'शुरू करने के लिए, कृपया अपने गांव का नाम और जिला बताएं, और फिर समस्या के बारे में बताएं।',
    problem: 'यह समस्या कब से चल रही है? क्या आपने इसे हल करने के लिए कोई प्रयास किया है?',
    impact: 'यह समस्या आपके समुदाय को कैसे प्रभावित कर रही है? कितने लोग प्रभावित हुए हैं?',
    solution: 'आपके अनुसार, इस समस्या का समाधान क्या होना चाहिए?',
    contact: 'क्या आप अपना संपर्क विवरण साझा कर सकते हैं ताकि हमारे पत्रकार आपसे संपर्क कर सकें?',
    closing: 'धन्यवाद। क्या कोई अन्य जानकारी है जो आप जोड़ना चाहते हैं?'
  };
  
  return prompts[stage] || prompts.intro;
}

// Helper function to break Hindi text into smaller phrases for better TTS
function breakIntoChunks(text, maxLength = 80) {
  if (!text || text.length <= maxLength) return [text];
  
  // Find natural breaking points
  const breakPoints = [',', '।', '.', '?', '!', ';', '-', ' और ', ' तथा ', ' के बाद ', ' पर '];
  let chunks = [];
  let currentChunk = '';
  
  const sentences = text.split(/([,.।?!;-])/);
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (currentChunk.length + sentence.length <= maxLength) {
      currentChunk += sentence;
    } else {
      chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Main welcome endpoint
app.post('/welcome', async (req, res) => {
  console.log('Received initial call');
  const callSid = req.body.CallSid;
  
  // Initialize session
  sessions[callSid] = {
    stage: 'intro',
    conversationHistory: [],
    lastUpdated: Date.now()
  };
  
  try {
    // Create TwiML response with natural voice
    const twiml = new VoiceResponse();
    
    // Initial pause for better call stability
    twiml.pause({ length: 1 });
    
    // Welcome messages broken into manageable chunks for better voice quality
    const welcomeMessages = [
      'नमस्ते, सीजीनेट स्वरा में आपका स्वागत है।',
      'मैं आपकी कहानी या समस्या सुनने के लिए यहां हूँ।',
      'कृपया अपने गांव का नाम, जिला और अपनी समस्या विस्तार से बताएं।',
      'जैसे स्वास्थ्य सेवाओं की कमी, पानी की समस्या, या सड़कों की स्थिति।'
    ];
    
    // Add welcome messages with natural voice
    welcomeMessages.forEach(message => {
      twiml.say({
        voice: 'Polly.Aditi',
        language: 'hi-IN'
      }, message);
      twiml.pause({ length: 0.5 });
    });
    
    // Gather speech with extended timeout
    const gather = twiml.gather({
      input: 'speech',
      action: '/process-stage',
      method: 'POST',
      language: 'hi-IN',
      speechTimeout: 'auto',
      timeout: 10
    });
    
    gather.say({
      voice: 'Polly.Aditi',
      language: 'hi-IN'
    }, 'कृपया अब बोलना शुरू करें।');
    
    // If no input received
    twiml.redirect('/no-input');
    
    // Return TwiML
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in welcome endpoint:', error);
    
    // Create a simple TwiML response
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'Polly.Aditi',
      language: 'hi-IN'
    }, 'नमस्ते, सीजीनेट स्वरा में आपका स्वागत है। कृपया अपनी समस्या बताएं।');
    
    const gather = twiml.gather({
      input: 'speech',
      action: '/process-stage',
      method: 'POST',
      language: 'hi-IN',
      timeout: 10
    });
    
    twiml.redirect('/no-input');
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Process each conversation stage
app.post('/process-stage', async (req, res) => {
  const callSid = req.body.CallSid;
  const speechResult = req.body.SpeechResult || '';
  
  console.log(`Received speech for call ${callSid}: ${speechResult}`);
  
  // Get or initialize session
  if (!sessions[callSid]) {
    sessions[callSid] = {
      stage: 'intro',
      conversationHistory: [],
      lastUpdated: Date.now()
    };
  }
  
  const session = sessions[callSid];
  session.lastUpdated = Date.now();
  
  // Add user input to history
  session.conversationHistory.push({
    role: 'user',
    content: speechResult
  });
  
  // Create TwiML response
  const twiml = new VoiceResponse();
  
  try {
    // Determine next stage based on current stage
    const currentStage = session.stage;
    let nextStage;
    let aiPrompt;
    
    switch (currentStage) {
      case 'intro':
        nextStage = 'problem';
        aiPrompt = 'धन्यवाद। अब मुझे बताएं, यह समस्या कब से चल रही है? क्या आपने या आपके समुदाय ने इसे हल करने का कोई प्रयास किया है?';
        break;
      case 'problem':
        nextStage = 'impact';
        aiPrompt = 'समझ गया। यह समस्या आपके गांव के कितने लोगों को प्रभावित कर रही है? क्या इसका कोई विशेष प्रभाव बच्चों, महिलाओं या बुजुर्गों पर पड़ा है?';
        break;
      case 'impact':
        nextStage = 'solution';
        aiPrompt = 'आपके अनुसार, इस समस्या का समाधान क्या होना चाहिए? क्या आपके पास कोई सुझाव है?';
        break;
      case 'solution':
        nextStage = 'contact';
        aiPrompt = 'धन्यवाद। क्या आप अपना नाम और एक संपर्क नंबर बता सकते हैं ताकि हमारे पत्रकार आपसे अधिक जानकारी के लिए संपर्क कर सकें?';
        break;
      case 'contact':
        nextStage = 'closing';
        aiPrompt = 'बहुत बढ़िया। क्या कोई अन्य जानकारी है जो आप इस मुद्दे के बारे में हमें बताना चाहते हैं?';
        break;
      case 'closing':
      default:
        nextStage = 'end';
        aiPrompt = 'धन्यवाद। आपकी जानकारी हमारे पत्रकारों तक पहुंच जाएगी और अगर आवश्यक हुआ तो हम आपसे संपर्क करेंगे।';
    }
    
    // Update stage
    session.stage = nextStage;
    sessions[callSid] = session;
    
    // Use OpenAI for more natural response
    let aiResponse = aiPrompt;
    
    if (speechResult.length > 5 && process.env.USE_AI === 'true' && openai) {
      try {
        const messages = [
          {
            role: 'system',
            content: 'You are a compassionate journalist interviewing people from rural India about their problems. ' +
                    'Respond in simple Hindi written in Hindi script. ' + 
                    'Be conversational but professional. Use empathetic language. ' +
                    'Keep responses under 3-4 sentences. Based on their response, acknowledge what they said, ' +
                    'and then guide them to the next topic with a question.'
          },
          ...session.conversationHistory,
          {
            role: 'user', 
            content: `The person said: "${speechResult}". Now you need to respond empathetically and then guide them to the next topic: ${aiPrompt}`
          }
        ];
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages,
          max_tokens: 150,
          temperature: 0.7
        });
        
        aiResponse = completion.choices[0].message.content;
      } catch (aiError) {
        console.error('AI Error:', aiError);
        // Fall back to default prompt on error
      }
    }
    
    // Add AI response to history
    session.conversationHistory.push({
      role: 'assistant',
      content: aiResponse
    });
    
    // Break the response into smaller chunks for better voice quality
    const responseChunks = breakIntoChunks(aiResponse);
    
    // Initial pause for stability
    twiml.pause({ length: 0.5 });
    
    // Speak the response in chunks
    responseChunks.forEach((chunk, index) => {
      if (chunk && chunk.trim()) {
        twiml.say({
          voice: 'Polly.Aditi',
          language: 'hi-IN'
        }, chunk.trim());
        
        // Add small pauses between chunks
        if (index < responseChunks.length - 1) {
          twiml.pause({ length: 0.3 });
        }
      }
    });
    
    // If not the end, gather more speech
    if (nextStage !== 'end') {
      const gather = twiml.gather({
        input: 'speech',
        action: '/process-stage',
        method: 'POST',
        language: 'hi-IN',
        speechTimeout: 'auto',
        timeout: 10
      });
      
      gather.say({
        voice: 'Polly.Aditi',
        language: 'hi-IN'
      }, 'कृपया अब बोलें।');
      
      // If no input received
      twiml.redirect('/no-input');
    } else {
      // Final thank you
      twiml.pause({ length: 0.5 });
      
      const closingMessages = [
        'सीजीनेट स्वरा के साथ बात करने के लिए धन्यवाद।',
        'आपकी आवाज महत्वपूर्ण है।',
        'नमस्कार।'
      ];
      
      closingMessages.forEach((msg, index) => {
        twiml.say({
          voice: 'Polly.Aditi',
          language: 'hi-IN'
        }, msg);
        
        if (index < closingMessages.length - 1) {
          twiml.pause({ length: 0.3 });
        }
      });
    }
    
  } catch (error) {
    console.error('Error in conversation processing:', error);
    
    // Provide a friendly error response
    twiml.say({
      voice: 'Polly.Aditi',
      language: 'hi-IN'
    }, 'क्षमा करें, कुछ तकनीकी समस्या आ गई है। आपका संदेश रिकॉर्ड किया गया है। धन्यवाद।');
  }
  
  // Send response
  res.type('text/xml');
  res.send(twiml.toString());
});

// Handle no input
app.post('/no-input', (req, res) => {
  const twiml = new VoiceResponse();
  
  twiml.say({
    voice: 'Polly.Aditi',
    language: 'hi-IN'
  }, 'मुझे कोई जवाब नहीं मिला। धन्यवाद, आपका संदेश रिकॉर्ड कर लिया गया है। नमस्कार।');
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Fallback route for all other endpoints
app.all('*', (req, res) => {
  console.log('Default route hit:', req.method, req.path);
  res.redirect('/welcome');
});

// Export the app for testing
module.exports = app;

// Start the server if this file is run directly
if (require.main === module) {
  app.listen(port, () => {
    console.log(`CGNet Swara Enhanced IVR server running on port ${port}`);
  });
}
