# CGNet Swara Hindi Voice IVR - API Documentation

This document provides a comprehensive reference for all APIs and endpoints in the CGNet Swara Hindi Voice IVR system.

## Table of Contents

- [Standalone Server API](#standalone-server-api)
- [Improved Conversation Server API](#improved-conversation-server-api)
- [Structured Conversation Server API](#structured-conversation-server-api)
- [Azure Functions API](#azure-functions-api)
- [Configuration Reference](#configuration-reference)
- [TwiML Reference](#twiml-reference)
- [Integration Points](#integration-points)

---

## Standalone Server API

The standalone server provides a simple but robust IVR system with high-quality Hindi voice.

### Base URL

- Local: `http://localhost:3000`
- Production: `https://cgnet-twiml-server.azurewebsites.net`

### Endpoints

#### 1. Root Endpoint

- **URL**: `/`
- **Method**: `POST`
- **Description**: Entry point for Twilio voice calls. Redirects to `/welcome`.
- **Parameters**: Standard Twilio webhook parameters
- **Response**: TwiML redirect to `/welcome`
- **Example Response**:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Redirect>/welcome</Redirect>
  </Response>
  ```

#### 2. Welcome Endpoint

- **URL**: `/welcome`
- **Method**: `POST`
- **Description**: Greets callers in Hindi and starts recording their message.
- **Parameters**: Standard Twilio webhook parameters
- **Response**: TwiML with Hindi greeting and recording instructions
- **Example Response**:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Say voice="Polly.Aditi" language="hi-IN">नमस्ते, सीजीनेट स्वरा में आपका स्वागत है।</Say>
      <Pause length="0.5"/>
      <Say voice="Polly.Aditi" language="hi-IN">मैं आपकी कहानी या समस्या सुनने के लिए यहां हूँ।</Say>
      <Pause length="0.5"/>
      <Say voice="Polly.Aditi" language="hi-IN">कृपया अपना संदेश बोलिए।</Say>
      <Pause length="0.5"/>
      <Record action="/recording-complete" maxLength="120" timeout="5"/>
  </Response>
  ```

#### 3. Recording Complete Endpoint

- **URL**: `/recording-complete`
- **Method**: `POST`
- **Description**: Handles completion of recording, thanks the caller.
- **Parameters**: 
  - All standard Twilio webhook parameters
  - `RecordingUrl`: URL of the recorded message (provided by Twilio)
  - `RecordingDuration`: Duration of recording in seconds
  - `RecordingSid`: Unique identifier of the recording
- **Response**: TwiML with thank you message in Hindi
- **Example Response**:
  ```xml
  <?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Say voice="Polly.Aditi" language="hi-IN">धन्यवाद। आपका संदेश रिकॉर्ड किया गया है।</Say>
      <Pause length="0.5"/>
      <Say voice="Polly.Aditi" language="hi-IN">हम जल्द ही आपसे संपर्क करेंगे।</Say>
  </Response>
  ```

---

## Improved Conversation Server API

The improved conversation server adds AI capabilities for more dynamic interactions.

### Base URL

- Local: `http://localhost:3000`
- Production: `https://cgnet-enhanced-server.azurewebsites.net`

### Endpoints

#### 1. Welcome Endpoint

- **URL**: `/welcome`
- **Method**: `POST`
- **Description**: Starts an AI-enhanced conversation with Hindi voice.
- **Parameters**: Standard Twilio webhook parameters
- **Response**: TwiML with AI-generated responses
- **Session Management**: Creates a session using `CallSid` to track conversation state

#### 2. Transcription Endpoint

- **URL**: `/transcribe`
- **Method**: `POST`
- **Description**: Processes speech input from caller and generates responses using AI.
- **Parameters**:
  - `CallSid`: Call identifier
  - `SpeechResult`: Transcribed speech from caller
  - All standard Twilio webhook parameters
- **Response**: TwiML with AI-generated response based on conversation context

#### 3. Conversation Complete Endpoint

- **URL**: `/conversation-complete`
- **Method**: `POST`
- **Description**: Saves the conversation and recordings, thanks the caller.
- **Parameters**: Standard Twilio webhook parameters
- **Response**: TwiML with thank you message and completion information

---

## Structured Conversation Server API

The structured conversation server implements a journalistic approach with defined stages.

### Base URL

- Local: `http://localhost:3000`
- Production: `https://cgnet-structured-ivr.azurewebsites.net`

### Endpoints

#### 1. Welcome Endpoint

- **URL**: `/welcome`
- **Method**: `POST`
- **Description**: Initiates a structured journalistic conversation.
- **Parameters**: Standard Twilio webhook parameters
- **Response**: TwiML with stage-appropriate prompts
- **Session Management**: Creates a session with initial stage 'intro'

#### 2. Input Processing Endpoint

- **URL**: `/process-input`
- **Method**: `POST`
- **Description**: Processes caller input and advances the conversation through journalistic stages.
- **Parameters**:
  - `CallSid`: Call identifier
  - `SpeechResult`: Transcribed speech from caller
  - All standard Twilio webhook parameters
- **Response**: TwiML with next stage prompt or closing message
- **Stage Progression**:
  1. intro → problem
  2. problem → impact
  3. impact → solution
  4. solution → contact
  5. contact → closing

---

## Azure Functions API

The Azure Functions implementation provides serverless processing for speech recognition, AI conversation, and data storage.

### Base URL

- Local: `http://localhost:7071/api`
- Production: `https://cgnet-voice-functions.azurewebsites.net/api`

### Functions

#### 1. Process Call Function

- **Endpoint**: `/processCall`
- **Method**: `POST`
- **Description**: Processes incoming voice data, performs transcription, generates AI response, and saves recordings
- **Request Body**: Binary audio data (WAV format)
- **Response**: Audio data (WAV format) with synthesized voice response
- **Required Headers**:
  - `Content-Type`: `audio/wav`
- **Response Headers**:
  - `Content-Type`: `audio/wav`
- **Status Codes**:
  - `200`: Success
  - `500`: Internal Server Error
- **Sample Implementation**:
  ```javascript
  app.http('processCall', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (req, context) => {
      try {
        // Process audio buffer, transcribe, generate AI reply, and synthesize response
        const buffer = Buffer.from(await req.arrayBuffer());
        const transcription = await transcribe(buffer);
        const replyText = await generateReply(transcription);
        const ttsBuffer = await synthesize(replyText);
        
        // Return audio response
        return {
          status: 200,
          headers: { 'Content-Type': 'audio/wav' },
          body: ttsBuffer
        };
      } catch (err) {
        return { status: 500, body: 'Internal server error' };
      }
    }
  });
  ```

#### 2. TwilioFix Function

- **URL**: `https://cgnet-ivr-func.azurewebsites.net/api/twilio-fix`
- **Method**: `POST`
- **Description**: Minimal implementation for emergency fixes.
- **Parameters**: Standard Twilio webhook parameters
- **Response**: TwiML with Hindi greeting and instructions
- **Sample Implementation**:
  ```javascript
  app.http('twilioFix', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (req, context) => {
      const twiml = new VoiceResponse();
      twiml.say({
        voice: 'Polly.Aditi',
        language: 'hi-IN'
      }, 'नमस्ते, सीजीनेट स्वरा में आपका स्वागत है।');
      
      return {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
        body: twiml.toString()
      };
    }
  });
  ```

#### 3. Get Recordings Function

- **Endpoint**: `/getRecordings`
- **Method**: `GET`
- **Description**: Retrieves a list of recordings with metadata
- **Query Parameters**:
  - `limit` (optional): Maximum number of records to return
  - `from` (optional): Start date (ISO format)
  - `to` (optional): End date (ISO format)
- **Response**: JSON array of recording metadata
- **Status Codes**:
  - `200`: Success
  - `500`: Internal Server Error

#### 4. Get Statistics Function

- **Endpoint**: `/getStatistics`
- **Method**: `GET`
- **Description**: Retrieves system statistics for the dashboard
- **Query Parameters**:
  - `period` (optional): Time period ('day', 'week', 'month', 'year')
- **Response**: JSON object with statistics
- **Response Format**:
  ```json
  {
    "totalCalls": 1250,
    "avgDuration": 65.2,
    "completionRate": 0.87,
    "callsByRegion": {
      "Chhattisgarh": 320,
      "Madhya Pradesh": 280,
      "Other": 650
    },
    "callsByTopic": {
      "Water": 420,
      "Health": 380,
      "Roads": 260,
      "Other": 190
    },
    "callTrend": [
      {"date": "2025-05-01", "count": 42},
      {"date": "2025-05-02", "count": 38}
    ]
  }
  ```

### ProcessSpeech Function

- **URL**: `https://cgnet-ivr-func.azurewebsites.net/api/process-speech`
- **Method**: `POST`
- **Description**: Processes speech input and generates appropriate responses.
- **Parameters**: 
  - `CallSid`: Call identifier
  - `SpeechResult`: Transcribed speech
  - `ConversationStage`: Current stage of conversation
- **Response**: JSON with TwiML response and updated conversation state

---

## Configuration Reference

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Port for local server | 3000 | No |
| `OPENAI_KEY` | OpenAI API key | - | Yes (for AI features) |
| `OPENAI_ENDPOINT` | OpenAI API endpoint | - | Yes (for AI features) |
| `AZURE_STORAGE_CONNECTION_STRING` | Azure Storage connection string | - | No |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | - | No |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | - | No |
| `NODE_ENV` | Environment (development/production) | development | No |

### Customization Options

Voice settings can be customized in the relevant server files:

```javascript
// Voice customization
twiml.say({
  voice: 'Polly.Aditi', // Can be changed to other voices
  language: 'hi-IN',    // Language code
  // Optional parameters:
  // rate: '0.9',       // Speech rate (0.5 to 2.0)
  // pitch: 'medium'    // Pitch (x-low, low, medium, high, x-high)
}, messageText);
```

---

## TwiML Reference

### Key TwiML Elements Used

| Element | Description | Example |
|---------|-------------|---------|
| `<Say>` | Text-to-speech | `<Say voice="Polly.Aditi" language="hi-IN">नमस्ते</Say>` |
| `<Record>` | Record caller's voice | `<Record action="/recording-complete" maxLength="120"/>` |
| `<Gather>` | Collect speech input | `<Gather input="speech" language="hi-IN" action="/transcribe"/>` |
| `<Pause>` | Add a pause | `<Pause length="0.5"/>` |
| `<Redirect>` | Redirect to another URL | `<Redirect>/welcome</Redirect>` |

### Common TwiML Patterns

1. **Error Handling Pattern**:
   ```xml
   <Response>
       <Say>We are experiencing technical difficulties. Please try again later.</Say>
   </Response>
   ```

2. **Speech Input Pattern**:
   ```xml
   <Response>
       <Say voice="Polly.Aditi" language="hi-IN">कृपया अपना संदेश बोलिए।</Say>
       <Gather input="speech" language="hi-IN" action="/transcribe" timeout="5"/>
   </Response>
   ```

3. **Multi-message Pattern with Pauses**:
   ```xml
   <Response>
       <Say voice="Polly.Aditi" language="hi-IN">पहला संदेश</Say>
       <Pause length="0.5"/>
       <Say voice="Polly.Aditi" language="hi-IN">दूसरा संदेश</Say>
   </Response>
   ```

---

## Integration Points

### 1. Twilio Integration

The IVR system integrates with Twilio at these points:

1. **Webhook Configuration**: Set your Twilio phone number's voice webhook to the server URL
2. **TwiML Generation**: All endpoints respond with TwiML that Twilio interprets
3. **Recording Storage**: Twilio stores recordings and provides URLs
4. **Speech Recognition**: Twilio provides speech-to-text via the `<Gather>` element
5. **Call Flow**: Twilio manages call flow based on the TwiML responses

### 2. Azure Integration

Azure services are used in the following ways:

1. **Hosting**: Azure App Service or Azure Functions hosts the server
2. **Storage**: Azure Storage can store recordings and conversation logs
3. **OpenAI**: Azure OpenAI Service provides the AI capabilities

### 3. OpenAI Integration

GPT-4 is used for:

1. **Dynamic Responses**: Generating contextually appropriate responses
2. **Conversation Management**: Tracking and managing conversation flow
3. **Content Analysis**: Analyzing caller input for better responses

---

## Dashboard API Reference

The IVR Dashboard uses the following API endpoints to display system statistics and call data.

### 1. Get Statistics Endpoint

- **Endpoint**: `/getStatistics`
- **Method**: `GET`
- **Description**: Retrieves system statistics for the dashboard display
- **Query Parameters**:
  - `period` (optional): Time period ('day', 'week', 'month', 'year')
- **Response**: JSON object with call statistics
- **Response Format**:
  ```json
  {
    "totalCalls": 145,
    "avgDuration": 78.5,
    "completionRate": 0.87,
    "newCallers": 31,
    "callTrend": [
      {"date": "2025-05-15", "count": 5},
      {"date": "2025-05-16", "count": 12},
      {"date": "2025-05-17", "count": 18}
    ],
    "callsByTopic": {
      "Water Issues": 35,
      "Healthcare": 20,
      "Education": 15,
      "Agriculture": 18,
      "Infrastructure": 12
    },
    "callsByRegion": {
      "Chhattisgarh": 45,
      "Jharkhand": 28,
      "Madhya Pradesh": 22,
      "Maharashtra": 15,
      "Odisha": 14
    }
  }
  ```

### 2. Get Call Data Endpoint

- **Endpoint**: `/getCallData`
- **Method**: `GET`
- **Description**: Retrieves call records for display in the dashboard
- **Query Parameters**:
  - `limit` (optional): Maximum number of records to return
  - `from` (optional): Start date (ISO format)
  - `to` (optional): End date (ISO format)
  - `page` (optional): Page number for pagination
- **Response**: JSON object with call records and pagination info
- **Response Format**:
  ```json
  {
    "calls": [
      {
        "id": "1",
        "callSid": "CA123456789",
        "timestamp": "2025-05-22T10:15:23Z",
        "duration": 85,
        "callerNumber": "+919478456545",
        "region": "Chhattisgarh", 
        "status": "completed"
      }
    ],
    "pagination": {
      "total": 145,
      "page": 1,
      "pageSize": 10,
      "pages": 15
    }
  }
  ```

### 3. Get Call Details Endpoint

- **Endpoint**: `/getCallDetails/{id}`
- **Method**: `GET`
- **Description**: Retrieves detailed information about a specific call
- **URL Parameters**:
  - `id`: Call identifier
- **Response**: JSON object with call details
- **Response Format**:
  ```json
  {
    "id": "1",
    "callSid": "CA8971652430abcdef123456789",
    "callerNumber": "+919478456545",
    "timestamp": "2025-05-22T14:30:22Z",
    "duration": 200,
    "region": "Chhattisgarh",
    "status": "completed",
    "recordingUrl": "https://storage.example.com/recordings/1.mp3",
    "transcription": "नमस्ते, मेरा नाम राजेश कुमार है और मैं छत्तीसगढ़ के कांकेर जिले के अंतागढ़ गांव से हूँ। हमारे गांव में पिछले दो महीनों से पानी की बहुत समस्या है।"
  }
  ```

### 4. Get Recording Endpoint

- **Endpoint**: `/getRecording/{id}`
- **Method**: `GET`
- **Description**: Retrieves the audio recording for a call
- **URL Parameters**:
  - `id`: Recording identifier (usually the same as call ID)
- **Response**: Audio file (WAV or MP3 format)
- **Response Headers**:
  - `Content-Type`: `audio/wav` or `audio/mpeg`
  - `Content-Disposition`: `attachment; filename="recording_{id}.wav"`

---

For further assistance or to report issues, please contact the CGNet Swara team or open an issue in the GitHub repository.
