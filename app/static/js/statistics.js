// statistics.js - Statistics related functions
import { showMessage, apiRequest, companies, dataEntries } from './main.js';

// Load companies for statistics dropdown
async function loadCompaniesForStats() {
    try {
        const companies = await apiRequest('/companies');
        const statsSelect = document.getElementById('stats-company');

        if (!statsSelect) {
            console.warn('stats-company select element not found.');
            return;
        }

        // Clear existing options
        statsSelect.innerHTML = '<option value="">Select a company</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            statsSelect.appendChild(option);
        });
        
        console.log(`Loaded ${companies.length} companies for stats dropdown`);
    } catch (error) {
        console.error('Failed to load companies for stats:', error);
        showMessage('stats-message', 'Failed to load companies for dropdown', 'error');
    }
}

// Load statistics for selected company
async function loadCompanyStats() {
    const companySelect = document.getElementById('stats-company');
    const statsContent = document.getElementById('stats-content');
    
    if (!companySelect || !statsContent) {
        console.error('Required elements not found for stats loading');
        return;
    }
    
    const companyId = companySelect.value;
    if (!companyId) {
        statsContent.innerHTML = '<div class="loading">Select a company to view statistics</div>';
        return;
    }

    // Show loading state
    statsContent.innerHTML = '<div class="loading">Loading statistics...</div>';

    try {
        const stats = await apiRequest(`/stats/company/${companyId}`);
        renderStats(stats);
    } catch (error) {
        console.error('Error loading company stats:', error);
        showMessage('stats-message', 'Failed to load statistics', 'error');
        statsContent.innerHTML = '<div class="error">Failed to load statistics</div>';
    }
}

// Render statistics data
function renderStats(stats) {
    const container = document.getElementById('stats-content');
    
    if (!container) {
        console.error('stats-content container not found');
        return;
    }
    
    let html = `
        <div class="stats-overview">
            <h3>Statistics for ${stats.company?.name || 'Unknown Company'}</h3>
            <div class="stats-card">
                <div class="stats-number">${stats.total_entries || 0}</div>
                <div class="stats-label">Total Data Entries</div>
            </div>
        </div>
    `;

    // Data Set Distribution
    if (stats.data_set_counts && stats.data_set_counts.length > 0) {
        html += `
            <div class="stats-section">
                <h3>Data Set Distribution</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data Set</th>
                                <th>Count</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        const total = stats.total_entries || 1; // Avoid division by zero
        stats.data_set_counts.forEach(item => {
            const percentage = ((item.count / total) * 100).toFixed(1);
            html += `
                <tr>
                    <td>${item.data_set || 'N/A'}</td>
                    <td>${item.count}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div></div>';
    }

    // Device Type Distribution
    if (stats.device_type_counts && stats.device_type_counts.length > 0) {
        html += `
            <div class="stats-section">
                <h3>Device Type Distribution</h3>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Device Type</th>
                                <th>Count</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        const total = stats.total_entries || 1; // Avoid division by zero
        stats.device_type_counts.forEach(item => {
            const percentage = ((item.count / total) * 100).toFixed(1);
            html += `
                <tr>
                    <td>${item.device_type || 'N/A'}</td>
                    <td>${item.count}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div></div>';
    }

    // If no data available
    if ((!stats.data_set_counts || stats.data_set_counts.length === 0) && 
        (!stats.device_type_counts || stats.device_type_counts.length === 0)) {
        html += `
            <div class="stats-section">
                <p class="no-data">No detailed statistics available for this company.</p>
            </div>
        `;
    }

    container.innerHTML = html;
}

// Generate summary statistics (optional enhancement)
function generateStatsSummary(stats) {
    const summary = {
        totalEntries: stats.total_entries || 0,
        uniqueDataSets: stats.data_set_counts ? stats.data_set_counts.length : 0,
        uniqueDeviceTypes: stats.device_type_counts ? stats.device_type_counts.length : 0,
        mostCommonDataSet: null,
        mostCommonDeviceType: null
    };
    
    // Find most common data set
    if (stats.data_set_counts && stats.data_set_counts.length > 0) {
        const sortedDataSets = [...stats.data_set_counts].sort((a, b) => b.count - a.count);
        summary.mostCommonDataSet = sortedDataSets[0];
    }
    
    // Find most common device type
    if (stats.device_type_counts && stats.device_type_counts.length > 0) {
        const sortedDeviceTypes = [...stats.device_type_counts].sort((a, b) => b.count - a.count);
        summary.mostCommonDeviceType = sortedDeviceTypes[0];
    }
    
    return summary;
}

// Export company stats data (optional feature)
function exportStatsData(stats) {
    const csvContent = generateStatsCSV(stats);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `company_${stats.company?.id || 'unknown'}_stats.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Generate CSV content for stats export
function generateStatsCSV(stats) {
    let csv = 'Company Statistics\n\n';
    csv += `Company Name,${stats.company?.name || 'Unknown'}\n`;
    csv += `Total Entries,${stats.total_entries || 0}\n\n`;
    
    if (stats.data_set_counts && stats.data_set_counts.length > 0) {
        csv += 'Data Set Distribution\n';
        csv += 'Data Set,Count\n';
        stats.data_set_counts.forEach(item => {
            csv += `"${item.data_set || 'N/A'}",${item.count}\n`;
        });
        csv += '\n';
    }
    
    if (stats.device_type_counts && stats.device_type_counts.length > 0) {
        csv += 'Device Type Distribution\n';
        csv += 'Device Type,Count\n';
        stats.device_type_counts.forEach(item => {
            csv += `"${item.device_type || 'N/A'}",${item.count}\n`;
        });
    }
    
    return csv;
}


// Event Listeners
if (document.getElementById("statistics-page")) {
    document.addEventListener('DOMContentLoaded', () => {
        loadCompaniesForStats();
    });

    window.loadCompanyStats = loadCompanyStats;
}
