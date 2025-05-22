# CGNet Swara Hindi Voice IVR System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js: v18](https://img.shields.io/badge/Node.js-v18-green.svg)](https://nodejs.org/)
[![Azure: Functions](https://img.shields.io/badge/Azure-Functions-blue.svg)](https://azure.microsoft.com/products/functions/)
[![Twilio: TwiML](https://img.shields.io/badge/Twilio-TwiML-red.svg)](https://www.twilio.com/docs/voice/twiml)

## Overview

CGNet Swara Hindi Voice IVR is an interactive voice response system designed for rural communities in India, particularly in Hindi-speaking regions. The system allows callers to share stories, report problems, and engage in structured journalistic conversations using natural-sounding Hindi voice responses.

## Features

- 🎯 **Natural Hindi Voice**: Uses Amazon Polly.Aditi for authentic Hindi voice quality
- 🎯 **Structured Conversations**: Implements a journalistic approach for gathering information
- 🎯 **Error Resilience**: Multiple layers of error handling for reliable operation
- 🎯 **AI Integration**: Optional GPT-4 integration for more dynamic conversations
- 🎯 **Deployment Options**: Multiple deployment methods for different needs
- 🎯 **Recording Management**: Speech recording with proper confirmation flows

## Tech Stack

- **Backend**: Node.js with Express.js
- **Voice Services**: Twilio Voice with TwiML
- **Text-to-Speech**: Amazon Polly.Aditi (via Twilio integration)
- **Speech-to-Text**: Azure Cognitive Services Speech SDK
- **AI Integration**: OpenAI GPT-4 (Azure OpenAI Service)
- **Cloud Platform**: Microsoft Azure (App Service and Functions)
- **Storage**: Azure Storage (for voice recording storage)
- **Database**: Azure Cosmos DB (call transcripts and metadata)
- **Monitoring**: Azure Application Insights
- **Security**: Azure Key Vault (credential management)

## Repository Structure

```
📁 /                                # Root directory
├── 📄 standalone-server.js         # Basic IVR server with Hindi voice
├── 📄 improved-conversation-server.js # Enhanced server with AI capabilities
├── 📄 structured-conversation-server.js # Structured journalistic conversation
├── 📄 index.js                     # Main entry point for Azure Functions
├── 📄 key-vault.js                 # Azure Key Vault integration for secrets
├── 📄 app-insights.js              # Application Insights for monitoring
├── 📁 orchestrator/                # Voice flow orchestration components
│   ├── 📄 twiml.js                 # TwiML generation utilities
│   └── 📄 websocket-handler.js     # Real-time communication handler
├── 📁 TwilioFix/                   # Azure Function implementation
│   ├── 📄 index.js                 # Function entry point
│   └── 📄 function.json            # Function configuration
├── 📁 ProcessSpeech/               # Speech processing function
│   └── 📄 index.js                 # Function for STT processing
├── 📄 package.json                 # Project dependencies
├── 📄 deploy-*.sh                  # Deployment scripts
├── 📄 test-*.sh                    # Testing scripts
├── 📄 DEVELOPER_README.md          # Developer documentation overview
├── 📄 DEVELOPER_API_DOCUMENTATION.md # API reference documentation
├── 📄 IVR_DASHBOARD.html           # Admin dashboard for monitoring
├── 📄 ENHANCED_IVR_IMPLEMENTATION_GUIDE.md # Implementation guide
└── 📄 *.md                         # Additional documentation files
```

## System Architecture

The CGNet Swara Hindi Voice IVR system follows a modular architecture with several key components:

### Core Components

1. **Voice Gateway (Twilio)**
   - Handles incoming phone calls
   - Provides TwiML processing capabilities
   - Manages voice recognition (STT) and synthesis (TTS)
   - Routes calls to webhook endpoints

2. **Application Server**
   - Node.js/Express application with three implementation options:
     - `standalone-server.js`: Basic recording functionality
     - `improved-conversation-server.js`: Enhanced with AI conversation
     - `structured-conversation-server.js`: Journalistic conversation flow

3. **Azure Functions**
   - Serverless processing of speech and conversation logic
   - Scalable infrastructure for handling variable call volume
   - Integration with Azure services for storage and monitoring

4. **Storage Layer**
   - Azure Blob Storage: Stores voice recordings
   - Azure Cosmos DB: Stores call metadata and transcriptions

5. **AI Services**
   - Azure Cognitive Services: Speech-to-Text for Hindi transcription
   - Azure OpenAI Service: GPT-4 for conversation processing
   - Amazon Polly: Natural Hindi voice synthesis (via Twilio)

6. **Monitoring and Security**
   - Azure Application Insights: Telemetry and performance monitoring
   - Azure Key Vault: Secure storage of credentials and secrets

### Data Flow

1. **Call Initiation**
   - Caller dials the Twilio number
   - Twilio routes the call to the configured webhook endpoint

2. **Voice Conversation**
   - System greets caller in Hindi using Amazon Polly.Aditi
   - System captures caller's speech and processes it
   - AI generates appropriate responses based on context
   - System guides caller through structured conversation

3. **Recording and Processing**
   - Voice recordings saved to Azure Blob Storage
   - Speech-to-Text processing via Azure Cognitive Services
   - Metadata and transcriptions saved to Cosmos DB

4. **Analytics and Monitoring**
   - Call statistics logged to Application Insights
   - Dashboard provides visualization of system performance
   - Alerts configured for system errors or anomalies

## Quickstart

### Prerequisites

- Node.js v18+ with npm
- Azure account with subscription
- Twilio account with phone number
- Azure CLI (for deployment)
- Git (for version control)
- Visual Studio Code (recommended for development)

### Environment Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/cgnetswara/voice-stack-func.git
   cd voice-stack-func
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure local environment variables**

   Create a `local.settings.json` file in the root directory:

   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "FUNCTIONS_WORKER_RUNTIME": "node",
       "AzureWebJobsStorage": "UseDevelopmentStorage=true",
       "SPEECH_KEY": "your-azure-speech-key",
       "SPEECH_REGION": "eastus",
       "OPENAI_KEY": "your-openai-api-key",
       "OPENAI_ENDPOINT": "https://your-azure-openai.openai.azure.com/",
       "COSMOS_URI": "your-cosmos-db-uri",
       "COSMOS_KEY": "your-cosmos-db-key",
       "KEY_VAULT_NAME": "your-key-vault-name",
       "APPLICATIONINSIGHTS_CONNECTION_STRING": "your-app-insights-connection-string"
     }
   }
   ```

4. **Setup Azure resources**

   Use the provided deployment scripts or create resources manually:

   ```bash
   bash deploy-fixed-conversation.sh
   ```

5. **Configure Twilio webhook**

   - Log in to your Twilio account
   - Navigate to Phone Numbers > Manage > Active Numbers
   - Select your phone number
   - Set the webhook URL for Voice to your deployed endpoint
   - Save changes

### Running Locally

1. **Start the server (standalone version)**

   ```bash
   node standalone-server.js
   ```

2. **Start the server (improved conversation version)**

   ```bash
   node improved-conversation-server.js
   ```

3. **Start the server (structured conversation version)**

   ```bash
   node structured-conversation-server.js
   ```

4. **Start Azure Functions locally**

   ```bash
   npm start
   ```

5. **Access the dashboard**

   ```bash
   # On macOS
   open IVR_DASHBOARD.html
   
   # Or serve it using a local HTTP server
   npx http-server -o IVR_DASHBOARD.html
   ```

### Dashboard Configuration

The IVR dashboard is configured to connect to the API endpoints:

1. **Local development mode:**
   - By default, the dashboard connects to `http://localhost:7071/api` when opened from localhost
   - Make sure your Azure Functions are running locally using `npm start`

2. **Production mode:**
   - When deployed, the dashboard connects to the production API at `https://cgnet-voice-functions.azurewebsites.net/api`
   - Update the `API_CONFIG.baseUrl` in `dashboard-connector.js` if your API is at a different URL

3. **API endpoints used:**
   - `/getStatistics`: Retrieves system statistics
   - `/getCallData`: Retrieves call records
   - `/getRecording`: Retrieves audio recordings
   - `/getCallDetails`: Retrieves detailed call information
- Azure Account (for cloud deployment)
- Twilio Account with a phone number
- OpenAI API key (for AI-enhanced features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/diptendudip/IVR-AI-Voice-Stack.git
   cd IVR-AI-Voice-Stack
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. Start the server locally:
   ```bash
   npm start
   ```

5. Deploy to Azure:
   ```bash
   ./deploy-to-azure-standalone.sh
   ```

## API Reference

See the [API Documentation](./DEVELOPER_API_DOCUMENTATION.md) for detailed information.

## Deployment

Multiple deployment options are available:

1. **Azure App Service**: For the standalone server
   ```bash
   ./deploy-to-azure-standalone.sh
   ```

2. **Azure Functions**: For the minimal implementation
   ```bash
   ./emergency-fix.sh
   ```

3. **Enhanced AI Version**: For the full-featured version
   ```bash
   ./deploy-enhanced-ivr.sh
   ```

## Contributing

Contributions are welcome! Please check out our [contribution guidelines](./CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- CGNet Swara team for their vision and support
- Microsoft for providing Azure cloud services
- Twilio for the voice and TwiML services
- Amazon for the Polly.Aditi voice
