/**
 * CGNet Swara Hindi Voice IVR - Dashboard Connector
 * 
 * This module provides connectivity between the IVR Dashboard and the backend API.
 * It handles data fetching, processing, and updating the dashboard UI.
 */

// API configuration
const API_CONFIG = {
    baseUrl: 'https://cgnet-voice-functions.azurewebsites.net/api',
    local: 'http://localhost:7071/api',
    endpoints: {
        statistics: '/getStatistics',
        callData: '/getCallData',
        recordings: '/getRecording',
        callDetails: '/getCallDetails'
    }
};

// Use local API when running in development mode
const apiBaseUrl = window.location.hostname === 'localhost' ? API_CONFIG.local : API_CONFIG.baseUrl;

/**
 * Fetch data from the API
 * @param {string} endpoint - API endpoint to call
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response data
 */
async function fetchFromAPI(endpoint, params = {}) {
    try {
        const queryString = Object.keys(params).length > 0 
            ? '?' + new URLSearchParams(params).toString() 
            : '';
        
        const response = await fetch(`${apiBaseUrl}${endpoint}${queryString}`);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API fetch error:', error);
        return null;
    }
}

/**
 * Load dashboard statistics from API
 * @param {string} period - Time period for stats (day, week, month, year)
 * @returns {Promise<Object>} - Statistics data
 */
async function loadDashboardStatistics(period = 'day') {
    const stats = await fetchFromAPI(API_CONFIG.endpoints.statistics, { period });
    
    // Fall back to demo data if API call fails
    if (!stats) {
        return getDemoStatistics();
    }
    
    return stats;
}

/**
 * Load recent calls data
 * @param {number} limit - Maximum number of calls to return
 * @returns {Promise<Array>} - Array of call data
 */
async function loadRecentCalls(limit = 10) {
    const callData = await fetchFromAPI(API_CONFIG.endpoints.callData, { limit });
    
    // Fall back to demo data if API call fails
    if (!callData || !callData.calls) {
        return getDemoRecentCalls();
    }
    
    return callData.calls;
}

/**
 * Get call details by ID
 * @param {string} callId - Call ID
 * @returns {Promise<Object>} - Call details
 */
async function getCallDetails(callId) {
    const callData = await fetchFromAPI(`${API_CONFIG.endpoints.callDetails}/${callId}`);
    
    // Fall back to demo data if API call fails
    if (!callData) {
        return getDemoCallDetails(callId);
    }
    
    return callData;
}

/**
 * Format date as 'May 22'
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format time as '14:30'
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted time
 */
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format phone number for privacy (mask middle digits)
 * @param {string} phoneNumber - Full phone number
 * @returns {string} - Masked phone number
 */
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Keep first 4 and last 2 digits visible
    const cleaned = phoneNumber.replace(/\D/g, '');
    const len = cleaned.length;
    
    if (len <= 6) return phoneNumber;
    
    const prefix = cleaned.substring(0, 4);
    const suffix = cleaned.substring(len - 2);
    const masked = 'X'.repeat(len - 6);
    
    return `+${prefix}${masked}${suffix}`;
}

/**
 * Format duration in seconds to MM:SS format
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration
 */
function formatDuration(seconds) {
    if (!seconds) return '0:00';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update dashboard UI with statistics
 * @param {Object} stats - Statistics data
 */
function updateDashboardUI(stats) {
    // Update statistics values
    document.getElementById('totalCalls').textContent = stats.totalCalls;
    document.getElementById('avgDuration').textContent = formatDuration(stats.avgDuration);
    document.getElementById('completionRate').textContent = `${Math.round(stats.completionRate * 100)}%`;
    document.getElementById('newCallers').textContent = stats.newCallers || '0';
    
    // Update system status indicators
    updateSystemStatus('twilio-status', true);
    updateSystemStatus('azure-status', true);
    updateSystemStatus('openai-status', true);
    
    // Update charts
    updateCallTrendChart(stats.callTrend);
    updateTopicChart(stats.callsByTopic);
    updateRegionChart(stats.callsByRegion);
}

/**
 * Update system status indicator
 * @param {string} elementId - Status element ID
 * @param {boolean} isOnline - Whether the service is online
 */
function updateSystemStatus(elementId, isOnline) {
    const statusElement = document.getElementById(elementId);
    if (!statusElement) return;
    
    const statusValue = statusElement.querySelector('.stat-value');
    
    if (isOnline) {
        statusValue.textContent = 'Active';
        statusValue.style.color = 'var(--success-color)';
    } else {
        statusValue.textContent = 'Degraded';
        statusValue.style.color = 'var(--warning-color)';
    }
}

/**
 * Update call trend chart
 * @param {Array} trendData - Call trend data
 */
function updateCallTrendChart(trendData) {
    if (!trendData || !trendData.length) return;
    
    const ctx = document.getElementById('callTrendChart').getContext('2d');
    const labels = trendData.map(item => formatDate(item.date));
    const data = trendData.map(item => item.count);
    
    // If chart already exists, update data
    if (window.callTrendChart) {
        window.callTrendChart.data.labels = labels;
        window.callTrendChart.data.datasets[0].data = data;
        window.callTrendChart.update();
        return;
    }
    
    // Create new chart
    window.callTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Calls',
                data: data,
                fill: true,
                backgroundColor: 'rgba(74, 109, 167, 0.1)',
                borderColor: 'rgba(74, 109, 167, 1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

/**
 * Update topic analysis chart
 * @param {Object} topicData - Call by topic data
 */
function updateTopicChart(topicData) {
    if (!topicData) return;
    
    const ctx = document.getElementById('topicChart').getContext('2d');
    const labels = Object.keys(topicData);
    const data = Object.values(topicData);
    
    // If chart already exists, update data
    if (window.topicChart) {
        window.topicChart.data.labels = labels;
        window.topicChart.data.datasets[0].data = data;
        window.topicChart.update();
        return;
    }
    
    // Create new chart
    window.topicChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(74, 109, 167, 0.8)',
                    'rgba(42, 157, 143, 0.8)',
                    'rgba(233, 196, 106, 0.8)',
                    'rgba(231, 111, 81, 0.8)',
                    'rgba(244, 162, 97, 0.8)'
                ],
                borderColor: 'white',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

/**
 * Update region chart
 * @param {Object} regionData - Call by region data
 */
function updateRegionChart(regionData) {
    if (!regionData) return;
    
    const ctx = document.getElementById('regionChart').getContext('2d');
    const labels = Object.keys(regionData);
    const data = Object.values(regionData);
    
    // If chart already exists, update data
    if (window.regionChart) {
        window.regionChart.data.labels = labels;
        window.regionChart.data.datasets[0].data = data;
        window.regionChart.update();
        return;
    }
    
    // Create new chart
    window.regionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Number of Callers',
                data: data,
                backgroundColor: 'rgba(74, 109, 167, 0.8)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });
}

/**
 * Update recent calls table
 * @param {Array} calls - Recent calls data
 */
function updateRecentCallsTable(calls) {
    if (!calls || !calls.length) return;
    
    const tableBody = document.querySelector('table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add call rows
    calls.forEach(call => {
        const row = document.createElement('tr');
        
        const timestamp = new Date(call.timestamp);
        const dateTime = `${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString()}`;
        const phoneNumber = formatPhoneNumber(call.callerNumber);
        const duration = formatDuration(call.duration);
        
        let statusClass = 'badge-success';
        if (call.status === 'failed') {
            statusClass = 'badge-danger';
        } else if (call.status === 'abandoned') {
            statusClass = 'badge-warning';
        }
        
        row.innerHTML = `
            <td>${dateTime}</td>
            <td>${phoneNumber}</td>
            <td>${duration}</td>
            <td><span class="badge ${statusClass}">${call.status}</span></td>
            <td><button class="btn" data-call-id="${call.id}">View</button></td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Add event listeners for view buttons
    document.querySelectorAll('table tbody .btn').forEach(button => {
        button.addEventListener('click', function() {
            const callId = this.getAttribute('data-call-id');
            showCallDetails(callId);
        });
    });
}

/**
 * Show call details in the details panel
 * @param {string} callId - Call ID
 */
async function showCallDetails(callId) {
    const callData = await getCallDetails(callId);
    if (!callData) return;
    
    // Update call info fields
    document.querySelector('.call-info-item:nth-child(1) span:nth-child(2)').textContent = callData.callSid;
    document.querySelector('.call-info-item:nth-child(2) span:nth-child(2)').textContent = formatPhoneNumber(callData.callerNumber);
    document.querySelector('.call-info-item:nth-child(3) span:nth-child(2)').textContent = new Date(callData.timestamp).toLocaleString();
    document.querySelector('.call-info-item:nth-child(4) span:nth-child(2)').textContent = `${Math.floor(callData.duration / 60)} minutes ${callData.duration % 60} seconds`;
    
    // Update status badge
    const statusBadge = document.querySelector('.call-info-item:nth-child(5) span:nth-child(2) span');
    statusBadge.className = 'badge';
    statusBadge.classList.add(callData.status === 'completed' ? 'badge-success' : 'badge-danger');
    statusBadge.textContent = callData.status;
    
    // Update audio player
    const audioElement = document.querySelector('.audio-controls');
    if (callData.recordingUrl) {
        audioElement.src = callData.recordingUrl;
        audioElement.style.display = 'block';
    } else {
        audioElement.style.display = 'none';
    }
    
    // Update transcription
    document.querySelector('.transcription-text').textContent = callData.transcription || 'No transcription available';
}

/**
 * Initialize filter buttons
 */
function initializeFilters() {
    document.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', async function() {
            // Remove active class from current button
            document.querySelector('.filter-btn.active').classList.remove('active');
            this.classList.add('active');
            
            // Get period from button text
            const period = this.textContent.toLowerCase();
            
            // Load and update data
            const stats = await loadDashboardStatistics(period);
            updateDashboardUI(stats);
            
            // Also refresh recent calls
            const calls = await loadRecentCalls();
            updateRecentCallsTable(calls);
        });
    });
}

/**
 * Initialize refresh buttons
 */
function initializeRefreshButtons() {
    const refreshButtons = document.querySelectorAll('.btn[title="Refresh"]');
    refreshButtons.forEach(button => {
        button.addEventListener('click', async function() {
            // Find the closest card to determine what to refresh
            const card = this.closest('.card');
            const cardTitle = card.querySelector('.card-title').textContent;
            
            if (cardTitle.includes('Statistics')) {
                const stats = await loadDashboardStatistics();
                updateDashboardUI(stats);
            } else if (cardTitle.includes('Topic')) {
                const stats = await loadDashboardStatistics();
                updateTopicChart(stats.callsByTopic);
            } else if (cardTitle.includes('Region')) {
                const stats = await loadDashboardStatistics();
                updateRegionChart(stats.callsByRegion);
            }
        });
    });
}

/**
 * Initialize dashboard
 */
async function initializeDashboard() {
    // Load initial data
    const stats = await loadDashboardStatistics();
    const calls = await loadRecentCalls();
    
    // Update UI
    updateDashboardUI(stats);
    updateRecentCallsTable(calls);
    
    // Initialize interactive elements
    initializeFilters();
    initializeRefreshButtons();
}

/**
 * Get demo statistics data
 * @returns {Object} - Demo statistics
 */
function getDemoStatistics() {
    return {
        totalCalls: 145,
        avgDuration: 78.5,
        completionRate: 0.87,
        newCallers: 31,
        callTrend: [
            {date: '2025-05-15', count: 5},
            {date: '2025-05-16', count: 12},
            {date: '2025-05-17', count: 18},
            {date: '2025-05-18', count: 15},
            {date: '2025-05-19', count: 22},
            {date: '2025-05-20', count: 30},
            {date: '2025-05-21', count: 25},
            {date: '2025-05-22', count: 18}
        ],
        callsByTopic: {
            'Water Issues': 35,
            'Healthcare': 20,
            'Education': 15,
            'Agriculture': 18,
            'Infrastructure': 12
        },
        callsByRegion: {
            'Chhattisgarh': 45,
            'Jharkhand': 28,
            'Madhya Pradesh': 22,
            'Maharashtra': 15,
            'Odisha': 14
        }
    };
}

/**
 * Get demo recent calls data
 * @returns {Array} - Demo call records
 */
function getDemoRecentCalls() {
    return [
        { id: '1', callSid: 'CA123456789', timestamp: '2025-05-22T10:15:23Z', duration: 85, callerNumber: '+919478456545', region: 'Chhattisgarh', status: 'completed' },
        { id: '2', callSid: 'CA987654321', timestamp: '2025-05-22T09:32:10Z', duration: 62, callerNumber: '+918823742112', region: 'Jharkhand', status: 'completed' },
        { id: '3', callSid: 'CA456789123', timestamp: '2025-05-22T08:45:56Z', duration: 0, callerNumber: '+917702561878', region: 'Madhya Pradesh', status: 'failed' },
        { id: '4', callSid: 'CA654321987', timestamp: '2025-05-21T17:12:34Z', duration: 123, callerNumber: '+919954123434', region: 'Chhattisgarh', status: 'completed' },
        { id: '5', callSid: 'CA321987654', timestamp: '2025-05-21T15:08:19Z', duration: 72, callerNumber: '+918845987756', region: 'Maharashtra', status: 'completed' }
    ];
}

/**
 * Get demo call details
 * @param {string} callId - Call ID
 * @returns {Object} - Demo call details
 */
function getDemoCallDetails(callId) {
    return {
        id: callId,
        callSid: 'CA8971652430abcdef123456789',
        callerNumber: '+919478456545',
        timestamp: '2025-05-22T14:30:22Z',
        duration: 200,
        status: 'completed',
        recordingUrl: '#demo-recording',
        transcription: 'नमस्ते, मेरा नाम राजेश कुमार है और मैं छत्तीसगढ़ के कांकेर जिले के अंतागढ़ गांव से हूँ। हमारे गांव में पिछले दो महीनों से पानी की बहुत समस्या है। पंचायत के लोगों से कई बार बात की है लेकिन कोई हल नहीं निकल रहा है। कृपया हमारी मदद करें।'
    };
}

// Export functions for use in the dashboard
window.dashboardConnector = {
    loadDashboardStatistics,
    loadRecentCalls,
    getCallDetails,
    updateDashboardUI,
    updateRecentCallsTable,
    initializeDashboard,
    formatDate,
    formatTime,
    formatPhoneNumber,
    formatDuration
};

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeDashboard);
