/**
 * CGNet Swara Hindi Voice IVR - Dashboard API Implementation
 * 
 * This file contains implementation examples for the dashboard API endpoints.
 * These can be integrated into your Azure Functions or Express.js server.
 */

const { CosmosClient } = require('@azure/cosmos');
const { BlobServiceClient } = require('@azure/storage-blob');

// Initialize clients
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_URI,
  key: process.env.COSMOS_KEY
});

const blobServiceClient = BlobServiceClient.fromConnectionString(
  process.env.AzureWebJobsStorage
);

/**
 * Implementation example for getStatistics endpoint
 * 
 * @param {object} req - HTTP request object
 * @param {object} context - Function context
 * @returns {object} HTTP response with statistics data
 */
async function getStatistics(req, context) {
  try {
    // Get period parameter or default to 'day'
    const period = req.query.period || 'day';
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default: // day
        startDate.setDate(endDate.getDate() - 1);
    }
    
    // Format dates for query
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // Get database and container
    const database = cosmosClient.database('transcriptsdb');
    const container = database.container('calls');
    
    // Query for all calls in period
    const querySpec = {
      query: "SELECT * FROM c WHERE c.timestamp >= @startDate AND c.timestamp <= @endDate",
      parameters: [
        { name: "@startDate", value: startDateStr },
        { name: "@endDate", value: endDateStr }
      ]
    };
    
    const { resources: calls } = await container.items.query(querySpec).fetchAll();
    
    // Calculate statistics
    const totalCalls = calls.length;
    const completedCalls = calls.filter(call => call.status === 'completed').length;
    
    // Calculate average duration (only for completed calls)
    const durations = calls
      .filter(call => call.status === 'completed' && call.duration)
      .map(call => call.duration);
      
    const avgDuration = durations.length > 0
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length
      : 0;
    
    // Calculate completion rate
    const completionRate = totalCalls > 0 ? completedCalls / totalCalls : 0;
    
    // Get unique caller count (approximation of new callers)
    const uniqueCallers = new Set(calls.map(call => call.callerNumber)).size;
    
    // Group calls by date for trend
    const callsByDate = {};
    calls.forEach(call => {
      const date = call.timestamp.split('T')[0]; // YYYY-MM-DD
      callsByDate[date] = (callsByDate[date] || 0) + 1;
    });
    
    // Convert to array format for chart
    const callTrend = Object.entries(callsByDate).map(([date, count]) => ({ 
      date, 
      count 
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    // Process topic data (from transcriptions analysis)
    const topics = {
      'Water Issues': 0,
      'Healthcare': 0,
      'Education': 0,
      'Agriculture': 0,
      'Infrastructure': 0,
      'Other': 0
    };
    
    calls.forEach(call => {
      // Simple keyword matching for topic classification
      if (!call.transcription) {
        topics['Other']++;
        return;
      }
      
      const transcription = call.transcription.toLowerCase();
      
      if (transcription.includes('पानी') || transcription.includes('जल')) {
        topics['Water Issues']++;
      } else if (transcription.includes('अस्पताल') || transcription.includes('स्वास्थ्य') || transcription.includes('बीमारी')) {
        topics['Healthcare']++;
      } else if (transcription.includes('स्कूल') || transcription.includes('शिक्षा')) {
        topics['Education']++;
      } else if (transcription.includes('फसल') || transcription.includes('खेती') || transcription.includes('किसान')) {
        topics['Agriculture']++;
      } else if (transcription.includes('सड़क') || transcription.includes('बिजली')) {
        topics['Infrastructure']++;
      } else {
        topics['Other']++;
      }
    });
    
    // Process region data
    const regions = {};
    calls.forEach(call => {
      if (call.region) {
        regions[call.region] = (regions[call.region] || 0) + 1;
      } else {
        regions['Unknown'] = (regions['Unknown'] || 0) + 1;
      }
    });
    
    // Return formatted statistics
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        totalCalls,
        avgDuration,
        completionRate,
        newCallers: uniqueCallers,
        callTrend,
        callsByTopic: topics,
        callsByRegion: regions
      })
    };
  } catch (error) {
    context.log.error(`Error in getStatistics: ${error.message}`);
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to retrieve statistics'
      })
    };
  }
}

/**
 * Implementation example for getCallData endpoint
 * 
 * @param {object} req - HTTP request object
 * @param {object} context - Function context
 * @returns {object} HTTP response with call records
 */
async function getCallData(req, context) {
  try {
    // Get pagination parameters
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    
    // Get date range if specified
    const fromDate = req.query.from ? new Date(req.query.from).toISOString() : null;
    const toDate = req.query.to ? new Date(req.query.to).toISOString() : null;
    
    // Build query
    let querySpec = {
      query: "SELECT * FROM c ORDER BY c.timestamp DESC",
      parameters: []
    };
    
    if (fromDate && toDate) {
      querySpec.query = "SELECT * FROM c WHERE c.timestamp >= @fromDate AND c.timestamp <= @toDate ORDER BY c.timestamp DESC";
      querySpec.parameters = [
        { name: "@fromDate", value: fromDate },
        { name: "@toDate", value: toDate }
      ];
    }
    
    // Get database and container
    const database = cosmosClient.database('transcriptsdb');
    const container = database.container('calls');
    
    // Query for count (for pagination)
    const countQuerySpec = {
      query: "SELECT VALUE COUNT(1) FROM c",
      parameters: []
    };
    
    if (fromDate && toDate) {
      countQuerySpec.query = "SELECT VALUE COUNT(1) FROM c WHERE c.timestamp >= @fromDate AND c.timestamp <= @toDate";
      countQuerySpec.parameters = querySpec.parameters;
    }
    
    const { resources: countResults } = await container.items.query(countQuerySpec).fetchAll();
    const totalCount = countResults[0];
    
    // Perform paginated query
    const iterator = container.items.query(querySpec);
    const { resources: allItems } = await iterator.fetchAll();
    
    // Manual pagination (Cosmos SQL API has limitations with OFFSET/LIMIT)
    const paginatedItems = allItems.slice(skip, skip + limit);
    
    // Format call records
    const calls = paginatedItems.map(item => ({
      id: item.id,
      callSid: item.callSid,
      timestamp: item.timestamp,
      duration: item.duration,
      callerNumber: item.callerNumber,
      region: item.region || 'Unknown',
      status: item.status
    }));
    
    // Return formatted call data with pagination info
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        calls,
        pagination: {
          total: totalCount,
          page,
          pageSize: limit,
          pages: Math.ceil(totalCount / limit)
        }
      })
    };
  } catch (error) {
    context.log.error(`Error in getCallData: ${error.message}`);
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to retrieve call data'
      })
    };
  }
}

/**
 * Implementation example for getCallDetails endpoint
 * 
 * @param {object} req - HTTP request object
 * @param {object} context - Function context
 * @returns {object} HTTP response with call details
 */
async function getCallDetails(req, context) {
  try {
    const id = req.params.id;
    if (!id) {
      return {
        status: 400,
        body: JSON.stringify({ error: "Call ID is required" })
      };
    }
    
    // Get database and container
    const database = cosmosClient.database('transcriptsdb');
    const container = database.container('calls');
    
    // Query for specific call
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @id",
      parameters: [{ name: "@id", value: id }]
    };
    
    const { resources: results } = await container.items.query(querySpec).fetchAll();
    
    if (results.length === 0) {
      return {
        status: 404,
        body: JSON.stringify({ error: "Call not found" })
      };
    }
    
    const call = results[0];
    
    // Get recording URL (generate SAS token or direct link)
    let recordingUrl = null;
    if (call.recordingBlob) {
      const containerClient = blobServiceClient.getContainerClient('recordings');
      const blobClient = containerClient.getBlobClient(call.recordingBlob);
      
      // Generate SAS URL with 1 hour expiry
      const sasUrl = await blobClient.generateSasUrl({
        permissions: { read: true },
        expiresOn: new Date(new Date().valueOf() + 3600 * 1000)
      });
      
      recordingUrl = sasUrl;
    }
    
    // Return formatted call details
    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: call.id,
        callSid: call.callSid,
        callerNumber: call.callerNumber,
        timestamp: call.timestamp,
        duration: call.duration,
        region: call.region || 'Unknown',
        status: call.status,
        recordingUrl,
        transcription: call.transcription
      })
    };
  } catch (error) {
    context.log.error(`Error in getCallDetails: ${error.message}`);
    return {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to retrieve call details'
      })
    };
  }
}

// Export functions for Azure Functions
module.exports = {
  getStatistics,
  getCallData,
  getCallDetails
};

// Example function.json configuration for getStatistics
/*
{
  "bindings": [
    {
      "authLevel": "anonymous",
      "type": "httpTrigger",
      "direction": "in",
      "name": "req",
      "methods": ["get"],
      "route": "getStatistics"
    },
    {
      "type": "http",
      "direction": "out",
      "name": "$return"
    }
  ]
}
*/
