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

// function showTab(tabName) {
//     const tabs = document.querySelectorAll('.tab');
//     tabs.forEach(tab => tab.classList.remove('active'));
//     document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');

//     const contentArea = document.getElementById('tab-content');
//     contentArea.innerHTML = '<p>Loading...</p>';

//     fetch(`/load-tab/${tabName}`)
//         .then(response => response.text())
//         .then(html => {
//             contentArea.innerHTML = html;
//         })
//         .catch(() => {
//             contentArea.innerHTML = '<p>Error loading content.</p>';
//         });
// }

// function showTab(tabName) {
//     document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
//     document.querySelectorAll('.content').forEach(content => content.classList.add('hidden'));
    
//     event.target.classList.add('active');
//     document.getElementById(tabName + '-tab').classList.remove('hidden');
    
//     if (tabName === 'companies') {
//         loadCompanies();
//     } else if (tabName === 'data-entries') {
//         loadDataEntries();
//         loadCompaniesForSelect();
//     } else if (tabName === 'statistics') {
//         loadCompaniesForStats();
//     }
// }

// Utility Functions
function showMessage(elementId, message, type = 'success') {
    const messageEl = document.getElementById(elementId);
    messageEl.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => messageEl.innerHTML = '', 5000);
}

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Companies Functions
async function loadCompanies() {
    try {
        companies = await apiRequest('/companies');
        renderCompanies();
    } catch (error) {
        showMessage('message', 'Failed to load companies', 'error');
    }
}

function renderCompanies() {
    const container = document.getElementById('companies-list');
    
    if (companies.length === 0) {
        container.innerHTML = '<div class="loading">No companies found</div>';
        return;
    }

    let html = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Created At</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    companies.forEach(company => {
        html += `
            <tr>
                <td>${company.id}</td>
                <td>${company.name}</td>
                <td>${new Date(company.created_at).toLocaleString()}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteCompany(${company.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

async function createCompany() {
    const name = document.getElementById('company-name').value.trim();
    if (!name) {
        showMessage('message', 'Please enter a company name', 'error');
        return;
    }

    try {
        await apiRequest('/companies', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        
        document.getElementById('company-name').value = '';
        showMessage('message', 'Company created successfully');
        loadCompanies();
    } catch (error) {
        showMessage('message', 'Failed to create company', 'error');
    }
}

async function deleteCompany(id) {
    if (!confirm('Are you sure you want to delete this company?')) return;

    try {
        await apiRequest(`/companies/${id}`, { method: 'DELETE' });
        showMessage('message', 'Company deleted successfully');
        loadCompanies();
    } catch (error) {
        showMessage('message', 'Failed to delete company', 'error');
    }
}

// Data Entries Functions
async function loadDataEntries() {
    try {
        const params = new URLSearchParams();
        
        const companyName = document.getElementById('filter-company')?.value;
        const uid = document.getElementById('filter-uid')?.value;
        const dataSet = document.getElementById('filter-data-set')?.value;
        
        if (companyName) params.append('company_name', companyName);
        if (uid) params.append('uid', uid);
        if (dataSet) params.append('data_set', dataSet);

        const queryString = params.toString();
        const endpoint = `/data-entries${queryString ? '?' + queryString : ''}`;
        
        dataEntries = await apiRequest(endpoint);
        renderDataEntries();
    } catch (error) {
        showMessage('data-message', 'Failed to load data entries', 'error');
    }
}

function renderDataEntries() {
    const container = document.getElementById('data-entries-list');
    
    if (dataEntries.length === 0) {
        container.innerHTML = '<div class="loading">No data entries found</div>';
        return;
    }

    let html = `
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Company</th>
                        <th>Device Type</th>
                        <th>UID</th>
                        <th>Data Type</th>
                        <th>Data Set</th>
                        <th>Data Going To</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    dataEntries.forEach(entry => {
        html += `
            <tr>
                <td>${entry.id}</td>
                <td>${entry.company_name || 'N/A'}</td>
                <td>${entry.device_type || 'N/A'}</td>
                <td>${entry.uid || 'N/A'}</td>
                <td>${entry.data_type || 'N/A'}</td>
                <td>${entry.data_set || 'N/A'}</td>
                <td>${entry.data_going_to || 'N/A'}</td>
                <td>
                    <button class="action-btn delete-btn" onclick="deleteDataEntry(${entry.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

async function createDataEntry() {
    const companyId = document.getElementById('entry-company').value;
    if (!companyId) {
        showMessage('data-message', 'Please select a company', 'error');
        return;
    }

    const entryData = {
        company_id: parseInt(companyId),
        device_type: document.getElementById('entry-device-type').value,
        uid: document.getElementById('entry-uid').value,
        data_type: document.getElementById('entry-data-type').value,
        data_set: document.getElementById('entry-data-set').value,
        data_going_to: document.getElementById('entry-data-going-to').value
    };

    try {
        await apiRequest('/data-entries', {
            method: 'POST',
            body: JSON.stringify(entryData)
        });
        
        // Clear form
        document.getElementById('entry-company').value = '';
        document.getElementById('entry-device-type').value = '';
        document.getElementById('entry-uid').value = '';
        document.getElementById('entry-data-type').value = '';
        document.getElementById('entry-data-set').value = '';
        document.getElementById('entry-data-going-to').value = '';
        
        showMessage('data-message', 'Data entry created successfully');
        loadDataEntries();
    } catch (error) {
        showMessage('data-message', 'Failed to create data entry', 'error');
    }
}

async function deleteDataEntry(id) {
    if (!confirm('Are you sure you want to delete this data entry?')) return;

    try {
        await apiRequest(`/data-entries/${id}`, { method: 'DELETE' });
        showMessage('data-message', 'Data entry deleted successfully');
        loadDataEntries();
    } catch (error) {
        showMessage('data-message', 'Failed to delete data entry', 'error');
    }
}

async function loadCompaniesForSelect() {
    try {
        const companies = await apiRequest('/companies');
        const entrySelect = document.getElementById('entry-company');
        const filterSelect = document.getElementById('filter-company');
        
        [entrySelect, filterSelect].forEach(select => {
            select.innerHTML = '<option value="">Select a company</option>';
            companies.forEach(company => {
                select.innerHTML += `<option value="${company.id}">${company.name}</option>`;
            });
        });
    } catch (error) {
        console.error('Failed to load companies for select:', error);
    }
}

// Statistics Functions
async function loadCompaniesForStats() {
    try {
        const companies = await apiRequest('/companies');
        const statsSelect = document.getElementById('stats-company');
        
        statsSelect.innerHTML = '<option value="">Select a company</option>';
        companies.forEach(company => {
            statsSelect.innerHTML += `<option value="${company.id}">${company.name}</option>`;
        });
    } catch (error) {
        console.error('Failed to load companies for stats:', error);
    }
}

async function loadCompanyStats() {
    const companyId = document.getElementById('stats-company').value;
    if (!companyId) {
        document.getElementById('stats-content').innerHTML = '<div class="loading">Select a company to view statistics</div>';
        return;
    }

    try {
        const stats = await apiRequest(`/stats/company/${companyId}`);
        renderStats(stats);
    } catch (error) {
        showMessage('stats-message', 'Failed to load statistics', 'error');
    }
}

function renderStats(stats) {
    const container = document.getElementById('stats-content');
    
    let html = `
        <div class="stats-card">
            <div class="stats-number">${stats.total_entries}</div>
            <div class="stats-label">Total Data Entries</div>
        </div>
    `;

    if (stats.data_set_counts.length > 0) {
        html += `
            <h3>Data Set Distribution</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Data Set</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        stats.data_set_counts.forEach(item => {
            html += `
                <tr>
                    <td>${item.data_set || 'N/A'}</td>
                    <td>${item.count}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
    }

    if (stats.device_type_counts.length > 0) {
        html += `
            <h3>Device Type Distribution</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Device Type</th>
                            <th>Count</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        stats.device_type_counts.forEach(item => {
            html += `
                <tr>
                    <td>${item.device_type || 'N/A'}</td>
                    <td>${item.count}</td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
    }

    container.innerHTML = html;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCompanies();
});