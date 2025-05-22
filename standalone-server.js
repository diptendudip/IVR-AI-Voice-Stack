// CGNet Swara Hindi Voice IVR System
// Simple standalone server with improved Hindi voice quality

const express = require('express');
const VoiceResponse = require('twilio').twiml.VoiceResponse;
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// Default route for initial Twilio call
app.post('/', (req, res) => {
  try {
    const twiml = new VoiceResponse();
    twiml.redirect('/welcome');
    
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Error in default route:', error);
    const twiml = new VoiceResponse();
    twiml.say('We are experiencing technical difficulties. Please try again later.');
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
  }
});

// Main welcome endpoint
app.post('/welcome', (req, res) => {
  try {
    const twiml = new VoiceResponse();
    
    // Welcome messages broken into smaller chunks for better voice quality
    const welcomeMessages = [
      'नमस्ते, सीजीनेट स्वरा में आपका स्वागत है।',
      'मैं आपकी कहानी या समस्या सुनने के लिए यहां हूँ।',
      'कृपया अपना संदेश बोलिए।'
    ];
    
    welcomeMessages.forEach(message => {
      twiml.say({
        voice: 'Polly.Aditi',
        language: 'hi-IN'
      }, message);
      twiml.pause({ length: 0.5 });
    });
    
    // Record the message
    twiml.record({
      action: '/recording-complete',
      maxLength: 120,
      timeout: 5
    });
    
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error generating welcome TwiML:', error);
    const twiml = new VoiceResponse();
    twiml.say('We are experiencing technical difficulties. Please try again later.');
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
  }
});

// After recording completion
app.post('/recording-complete', (req, res) => {
  try {
    const twiml = new VoiceResponse();
    
    twiml.say({
      voice: 'Polly.Aditi',
      language: 'hi-IN'
    }, 'धन्यवाद। आपका संदेश रिकॉर्ड किया गया है।');
    
    twiml.pause({ length: 0.5 });
    
    twiml.say({
      voice: 'Polly.Aditi',
      language: 'hi-IN'
    }, 'हम जल्द ही आपसे संपर्क करेंगे।');
    
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error generating recording completion TwiML:', error);
    const twiml = new VoiceResponse();
    twiml.say('We are experiencing technical difficulties. Please try again later.');
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
  }
});

// Route for handling other paths
app.use((req, res, next) => {
  console.log('Caught request at path:', req.method, req.path);
  
  // Only handle paths that haven't been matched yet
  if (!res.headersSent) {
    const twiml = new VoiceResponse();
    twiml.redirect('/welcome');
    
    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
  } else {
    next();
  }
});

// Error handling middleware - must be defined after routes
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const twiml = new VoiceResponse();
  twiml.say('We are experiencing technical difficulties. Please try again later.');
  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// Start the server
app.listen(port, () => {
  console.log(`Standalone server listening on port ${port}`);
  console.log(`Server started at: ${new Date().toISOString()}`);
});
