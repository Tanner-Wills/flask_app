// Enhanced tab handling with loading states and error handling
const API_BASE = 'http://127.0.0.1:5000';
let companies = [];
let dataEntries = [];

// Tab Management
function showTab(tabName, event = null) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    // Hide all content sections
    document.querySelectorAll('.content').forEach(content => content.classList.add('hidden'));
    
    // Add active class to clicked tab (handle both event and direct calls)
    const targetTab = event ? event.target : document.querySelector(`[onclick*="${tabName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Show the selected tab content
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        tabContent.classList.remove('hidden');
    }
    
    // Show loading state
    showLoading(tabName);
    
    // Load data based on selected tab
    switch (tabName) {
        case 'companies':
            loadCompanies();
            break;
        case 'data-entries':
            // Load both data entries and company options for the select dropdown
            Promise.all([
                loadDataEntries(),
                loadCompaniesForSelect()
            ]).then(() => {
                hideLoading(tabName);
            }).catch(error => {
                console.error('Error loading data entries tab:', error);
                showError(tabName, 'Failed to load data entries');
            });
            break;
        case 'statistics':
            loadCompaniesForStats();
            break;
        default:
            hideLoading(tabName);
            console.warn(`Unknown tab: ${tabName}`);
    }
}

// Show loading indicator for a specific tab
function showLoading(tabName) {
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        // Create or show loading indicator
        let loadingEl = tabContent.querySelector('.loading-indicator');
        if (!loadingEl) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'loading-indicator';
            loadingEl.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
            tabContent.appendChild(loadingEl);
        }
        loadingEl.style.display = 'block';
    }
}

// Hide loading indicator for a specific tab
function hideLoading(tabName) {
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        const loadingEl = tabContent.querySelector('.loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }
}

// Show error message for a specific tab
function showError(tabName, message) {
    hideLoading(tabName);
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        // Create or update error indicator
        let errorEl = tabContent.querySelector('.error-indicator');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'error-indicator';
            tabContent.appendChild(errorEl);
        }
        errorEl.innerHTML = `<p class="error">Error: ${message}</p><button onclick="retryTabLoad('${tabName}')">Retry</button>`;
        errorEl.style.display = 'block';
    }
}

// Retry loading for a specific tab
function retryTabLoad(tabName) {
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        const errorEl = tabContent.querySelector('.error-indicator');
        if (errorEl) {
            errorEl.style.display = 'none';
        }
    }
    showTab(tabName);
}

// Enhanced Ajax functions with proper error handling
async function loadCompanies() {
    try {
        const response = await fetch('/api/companies');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const companies = await response.json();
        
        // Update the companies table/list
        updateCompaniesDisplay(companies);
        hideLoading('companies');
        
    } catch (error) {
        console.error('Error loading companies:', error);
        showError('companies', 'Failed to load companies data');
    }
}

async function loadDataEntries(companyId = null) {
    try {
        const url = companyId ? `/api/data-entries?company_id=${companyId}` : '/api/data-entries';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const dataEntries = await response.json();
        
        // Update the data entries table/list
        updateDataEntriesDisplay(dataEntries);
        
    } catch (error) {
        console.error('Error loading data entries:', error);
        throw error; // Re-throw to be handled by Promise.all in showTab
    }
}

async function loadCompaniesForSelect() {
    try {
        const response = await fetch('/api/companies');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const companies = await response.json();
        
        // Update company select dropdown
        updateCompanySelect(companies);
        
    } catch (error) {
        console.error('Error loading companies for select:', error);
        throw error; // Re-throw to be handled by Promise.all in showTab
    }
}

async function loadCompaniesForStats() {
    try {
        const response = await fetch('/api/companies/stats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stats = await response.json();
        
        // Update statistics display
        updateStatsDisplay(stats);
        hideLoading('statistics');
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        showError('statistics', 'Failed to load statistics data');
    }
}

// Helper functions to update the UI (implement these based on your HTML structure)
function updateCompaniesDisplay(companies) {
    const container = document.getElementById('companies-list') || document.querySelector('#companies-tab .data-container');
    if (container) {
        container.innerHTML = companies.map(company => `
            <div class="company-item">
                <h3>${company.name}</h3>
                <p>ID: ${company.id}</p>
                <p>Created: ${new Date(company.created_at).toLocaleDateString()}</p>
            </div>
        `).join('');
    }
}

function updateDataEntriesDisplay(dataEntries) {
    const container = document.getElementById('data-entries-list') || document.querySelector('#data-entries-tab .data-container');
    if (container) {
        container.innerHTML = dataEntries.map(entry => `
            <div class="data-entry-item">
                <h4>${entry.uid}</h4>
                <p>Device Type: ${entry.device_type}</p>
                <p>Data Type: ${entry.data_type}</p>
                <p>Data Set: ${entry.data_set}</p>
                <p>Going To: ${entry.data_going_to}</p>
            </div>
        `).join('');
    }
}

function updateCompanySelect(companies) {
    const select = document.getElementById('company-filter-select');
    if (select) {
        select.innerHTML = '<option value="">All Companies</option>' + 
            companies.map(company => `<option value="${company.id}">${company.name}</option>`).join('');
    }
}

function updateStatsDisplay(stats) {
    const container = document.getElementById('stats-container') || document.querySelector('#statistics-tab .data-container');
    if (container) {
        container.innerHTML = `
            <div class="stats-overview">
                <h3>Statistics Overview</h3>
                <p>Total Companies: ${stats.total_companies || 0}</p>
                <p>Total Data Entries: ${stats.total_entries || 0}</p>
                <!-- Add more stats as needed -->
            </div>
        `;
    }
}

// Optional: Cache management to avoid unnecessary requests
const dataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData(key) {
    const cached = dataCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
}

function setCachedData(key, data) {
    dataCache.set(key, {
        data: data,
        timestamp: Date.now()
    });
}

// Enhanced version with caching (optional)
async function loadCompaniesWithCache() {
    const cached = getCachedData('companies');
    if (cached) {
        updateCompaniesDisplay(cached);
        hideLoading('companies');
        return;
    }
    
    // If not cached, load from server
    await loadCompanies();
}









// Enhanced Ajax functions with corrected API URLs
async function loadCompanies() {
    try {
        const response = await fetch('/api/companies');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const companies = await response.json();
        
        // Update the companies table/list
        updateCompaniesDisplay(companies);
        hideLoading('companies');
        
    } catch (error) {
        console.error('Error loading companies:', error);
        showError('companies', 'Failed to load companies data');
    }
}

async function loadDataEntries(companyId = null) {
    try {
        const url = companyId ? `/api/data-entries?company_id=${companyId}` : '/api/data-entries';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const dataEntries = await response.json();
        
        // Update the data entries table/list
        updateDataEntriesDisplay(dataEntries);
        
    } catch (error) {
        console.error('Error loading data entries:', error);
        throw error; // Re-throw to be handled by Promise.all in showTab
    }
}

async function loadCompaniesForSelect() {
    try {
        const response = await fetch('/api/companies');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const companies = await response.json();
        
        // Update company select dropdown
        updateCompanySelect(companies);
        
    } catch (error) {
        console.error('Error loading companies for select:', error);
        throw error; // Re-throw to be handled by Promise.all in showTab
    }
}

async function loadCompaniesForStats() {
    try {
        const response = await fetch('/api/companies/stats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stats = await response.json();
        
        // Update statistics display
        updateStatsDisplay(stats);
        hideLoading('statistics');
        
    } catch (error) {
        console.error('Error loading statistics:', error);
        showError('statistics', 'Failed to load statistics data');
    }
}

// Additional functions for creating new records
async function createCompany(companyName) {
    try {
        const response = await fetch('/api/companies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: companyName })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }
        
        const newCompany = await response.json();
        console.log('Company created:', newCompany);
        
        // Refresh the companies list
        loadCompanies();
        
        return newCompany;
        
    } catch (error) {
        console.error('Error creating company:', error);
        alert(`Failed to create company: ${error.message}`);
        throw error;
    }
}

async function createDataEntry(entryData) {
    try {
        const response = await fetch('/api/data-entries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(entryData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }
        
        const newEntry = await response.json();
        console.log('Data entry created:', newEntry);
        
        // Refresh the data entries list
        loadDataEntries();
        
        return newEntry;
        
    } catch (error) {
        console.error('Error creating data entry:', error);
        alert(`Failed to create data entry: ${error.message}`);
        throw error;
    }
}

// Enhanced updateStatsDisplay function to handle the new stats structure
function updateStatsDisplay(stats) {
    const container = document.getElementById('stats-container') || document.querySelector('#statistics-tab .data-container');
    if (container) {
        let html = `
            <div class="stats-overview">
                <h3>Statistics Overview</h3>
                <div class="stat-item">
                    <h4>Total Companies: ${stats.total_companies || 0}</h4>
                </div>
                <div class="stat-item">
                    <h4>Total Data Entries: ${stats.total_entries || 0}</h4>
                </div>
            </div>
        `;
        
        // Company entry counts
        if (stats.company_entry_counts && stats.company_entry_counts.length > 0) {
            html += `
                <div class="stats-section">
                    <h4>Entries by Company</h4>
                    <ul>
                        ${stats.company_entry_counts.map(item => 
                            `<li>${item.company}: ${item.entries} entries</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Device type distribution
        if (stats.device_type_distribution && stats.device_type_distribution.length > 0) {
            html += `
                <div class="stats-section">
                    <h4>Device Types</h4>
                    <ul>
                        ${stats.device_type_distribution.map(item => 
                            `<li>${item.device_type}: ${item.count}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Data set distribution
        if (stats.data_set_distribution && stats.data_set_distribution.length > 0) {
            html += `
                <div class="stats-section">
                    <h4>Data Sets</h4>
                    <ul>
                        ${stats.data_set_distribution.map(item => 
                            `<li>${item.data_set}: ${item.count}</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
}

// Enhanced data entries display to show company names
function updateDataEntriesDisplay(dataEntries) {
    const container = document.getElementById('data-entries-list') || document.querySelector('#data-entries-tab .data-container');
    if (container) {
        if (dataEntries.length === 0) {
            container.innerHTML = '<p>No data entries found.</p>';
            return;
        }
        
        container.innerHTML = dataEntries.map(entry => `
            <div class="data-entry-item">
                <h4>${entry.uid}</h4>
                <p><strong>Company:</strong> ${entry.company_name || 'Unknown'}</p>
                <p><strong>Device Type:</strong> ${entry.device_type || 'N/A'}</p>
                <p><strong>Data Type:</strong> ${entry.data_type || 'N/A'}</p>
                <p><strong>Data Set:</strong> ${entry.data_set || 'N/A'}</p>
                <p><strong>Going To:</strong> ${entry.data_going_to || 'N/A'}</p>
                <p><strong>Created:</strong> ${entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'N/A'}</p>
                <button onclick="deleteDataEntry(${entry.id})" class="delete-btn">Delete</button>
            </div>
        `).join('');
    }
}

// Enhanced companies display
function updateCompaniesDisplay(companies) {
    const container = document.getElementById('companies-list') || document.querySelector('#companies-tab .data-container');
    if (container) {
        if (companies.length === 0) {
            container.innerHTML = '<p>No companies found.</p>';
            return;
        }
        
        container.innerHTML = companies.map(company => `
            <div class="company-item">
                <h3>${company.name}</h3>
                <p><strong>ID:</strong> ${company.id}</p>
                <p><strong>Created:</strong> ${company.created_at ? new Date(company.created_at).toLocaleDateString() : 'N/A'}</p>
                <button onclick="deleteCompany(${company.id})" class="delete-btn">Delete</button>
            </div>
        `).join('');
    }
}

// Delete functions
async function deleteCompany(companyId) {
    if (!confirm('Are you sure you want to delete this company? This will also delete all associated data entries.')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/companies/${companyId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Refresh the companies list
        loadCompanies();
        
    } catch (error) {
        console.error('Error deleting company:', error);
        alert('Failed to delete company');
    }
}

async function deleteDataEntry(entryId) {
    if (!confirm('Are you sure you want to delete this data entry?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/data-entries/${entryId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Refresh the data entries list
        loadDataEntries();
        
    } catch (error) {
        console.error('Error deleting data entry:', error);
        alert('Failed to delete data entry');
    }
}