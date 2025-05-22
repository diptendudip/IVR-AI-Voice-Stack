# CGNet Swara Hindi Voice IVR System - Documentation Index

This document provides an overview of all available documentation for the CGNet Swara Hindi Voice IVR system.

## Core Documentation

1. **[DEVELOPER_README.md](./DEVELOPER_README.md)**
   - System overview and architecture
   - Tech stack and repository structure
   - Setup instructions and deployment options
   - Dashboard configuration

2. **[DEVELOPER_API_DOCUMENTATION.md](./DEVELOPER_API_DOCUMENTATION.md)**
   - Complete API reference for all endpoints
   - Request/response formats
   - Integration points
   - TwiML reference
   - Dashboard API integration

3. **[ENHANCED_IVR_IMPLEMENTATION_GUIDE.md](./ENHANCED_IVR_IMPLEMENTATION_GUIDE.md)**
   - Detailed implementation guide
   - Voice quality tips
   - Conversation flow design
   - Deployment scenarios

## System Components

### 1. IVR Server Implementations

The system provides three implementation options with increasing capabilities:

- **[standalone-server.js](./standalone-server.js)**
  - Basic IVR with high-quality Hindi voice
  - Simple recording capabilities
  - No AI integration

- **[improved-conversation-server.js](./improved-conversation-server.js)**
  - Enhanced with AI capabilities
  - Natural conversation flow
  - Voice recording and processing

- **[structured-conversation-server.js](./structured-conversation-server.js)**
  - Journalistic conversation approach
  - Structured stages for better reporting
  - Complete AI integration

### 2. Azure Functions Components

- **[index.js](./index.js)**
  - Main entry point for Azure Functions
  - Handles speech processing and conversation logic

- **[key-vault.js](./key-vault.js)**
  - Secure credential management
  - Integration with Azure Key Vault

- **[app-insights.js](./app-insights.js)**
  - Telemetry and logging
  - Performance monitoring

### 3. Dashboard Components

- **[IVR_DASHBOARD.html](./IVR_DASHBOARD.html)**
  - Administrative dashboard for call monitoring
  - Statistics visualization
  - Call playback and analysis

- **[dashboard-connector.js](./dashboard-connector.js)**
  - Data connectivity for dashboard
  - API integration
  - UI updates and chart rendering

- **[dashboard-api.js](./dashboard-api.js)**
  - Implementation examples for dashboard API endpoints
  - Integration with Azure Functions
  - Data processing for visualizations

## Deployment Scripts

- **[deploy-standalone.sh](./deploy-standalone.sh)**: Deploy the basic IVR server
- **[deploy-fixed-conversation.sh](./deploy-fixed-conversation.sh)**: Deploy the improved conversation server
- **[deploy-structured-conversation.sh](./deploy-structured-conversation.sh)**: Deploy the structured conversation server
- **[deploy-to-azure.sh](./deploy-to-azure.sh)**: General Azure deployment script

## Testing Scripts

- **[test-standalone-server.sh](./test-standalone-server.sh)**: Test the basic IVR
- **[test-improved-conversation.sh](./test-improved-conversation.sh)**: Test the improved conversation
- **[test-all-implementations.sh](./test-all-implementations.sh)**: Test all server implementations

## Additional Resources

- **[TWILIO_CONFIGURATION_GUIDE.md](./TWILIO_CONFIGURATION_GUIDE.md)**: Guide for configuring Twilio
- **[HINDI_VOICE_EXPLANATION.md](./HINDI_VOICE_EXPLANATION.md)**: Details about Hindi voice options
- **[EMERGENCY_SOLUTIONS.md](./EMERGENCY_SOLUTIONS.md)**: Troubleshooting and emergency fixes

## Getting Started

1. Start by reading the [DEVELOPER_README.md](./DEVELOPER_README.md) for system overview
2. Set up your development environment following the instructions
3. Choose the appropriate server implementation for your needs
4. Deploy the system using the provided deployment scripts
5. Configure Twilio to point to your deployed endpoint
6. Access the dashboard to monitor calls and system performance

## Support and Contributions

For support or to contribute to this project, please contact the CGNet Swara team or follow the standard GitHub workflow for contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request
