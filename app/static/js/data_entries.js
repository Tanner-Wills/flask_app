// data_entries.js - Data entries related functions

import { dataEntries, showMessage, apiRequest } from './main.js';

function openEntryModal() {
    document.getElementById('entry-modal').classList.remove('hidden');
}

function closeEntryModal() {
    document.getElementById('entry-modal').classList.add('hidden');
}


// Load companies for the filter dropdown in Data Entries tab
async function loadCompaniesForDataFilters() {
    try {
        const companies = await apiRequest('/companies');
        const filterSelect = document.getElementById('filter-company');

        filterSelect.innerHTML = '<option value="">All Companies</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            filterSelect.appendChild(option);
        });

        console.log(`Loaded ${companies.length} companies into filter dropdown`);
    } catch (error) {
        console.error('Failed to load filter companies:', error);
        showMessage('data-message', 'Failed to load companies for filtering', 'error');
    }
}


// Load data entries from API
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
        
        const entriesData = await apiRequest(endpoint);
        // Update global dataEntries array
        dataEntries.length = 0; // Clear existing
        dataEntries.push(...entriesData); // Add new data
        renderDataEntries();
    } catch (error) {
        showMessage('data-message', 'Failed to load data entries', 'error');
    }
}

// Render data entries table
function renderDataEntries() {
    const container = document.getElementById('data-entries-list');
    
    if (!container) {
        console.warn('data-entries-list container not found');
        return;
    }
    
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

// Create new data entry
async function createDataEntry() {
    const companySelect = document.getElementById('entry-company');
    if (!companySelect) {
        console.error('entry-company select not found');
        return;
    }
    
    const companyId = companySelect.value;
    if (!companyId) {
        showMessage('data-message', 'Please select a company', 'error');
        return;
    }

    // Get form data
    const entryData = {
        company_id: parseInt(companyId),
        device_type: document.getElementById('entry-device-type')?.value || '',
        uid: document.getElementById('entry-uid')?.value || '',
        data_type: document.getElementById('entry-data-type')?.value || '',
        data_set: document.getElementById('entry-data-set')?.value || '',
        data_going_to: document.getElementById('entry-data-going-to')?.value || ''
    };

    // Validate required fields
    if (!entryData.uid.trim()) {
        showMessage('data-message', 'UID is required', 'error');
        return;
    }

    try {
        await apiRequest('/data-entries', {
            method: 'POST',
            body: JSON.stringify(entryData)
        });
        
        // Clear form
        clearDataEntryForm();
        
        showMessage('data-message', 'Data entry created successfully');
        loadDataEntries();
    } catch (error) {
        showMessage('data-message', 'Failed to create data entry', 'error');
    }
}

// Clear data entry form
function clearDataEntryForm() {
    const formFields = [
        'entry-company',
        'entry-device-type',
        'entry-uid',
        'entry-data-type',
        'entry-data-set',
        'entry-data-going-to'
    ];
    
    formFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });
}

// Delete data entry
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

// Filter data entries
function filterDataEntries() {
    loadDataEntries(); // Reload with current filter values
}

// Clear filters
function clearFilters() {
    const filterFields = [
        'filter-company',
        'filter-uid', 
        'filter-data-set'
    ];
    
    filterFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
        }
    });
    
    loadDataEntries(); // Reload without filters
}

async function uploadCSVFile(file) {
    const status = document.getElementById('upload-status');

    if (!file || file.type !== 'text/csv') {
        status.textContent = 'Please upload a valid CSV file.';
        return;
    }

    const formData = new FormData();
    formData.append('csv_file', file);

    status.textContent = 'Uploading...';

    fetch('/data-entries/upload-csv', {
        method: 'POST',
        body: formData
    }).then(res => res.json())
        .then(data => {
            if (data.error) {
                status.textContent = `Error: ${data.error}`;
            } else {
                status.textContent = `Upload successful: ${data.message}`;
                loadDataEntries();
            }
        }).catch(() => {
            status.textContent = 'Upload failed. Please try again.';
        });
}


function addDataEntryListener() {
    const dropArea = document.getElementById('csv-upload-area');
    const fileInput = document.getElementById('csv-file-input');

    dropArea.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName =>
        dropArea.addEventListener(eventName, e => {
            e.preventDefault();
            dropArea.classList.add('hover');
        })
    );

    ['dragleave', 'drop'].forEach(eventName =>
        dropArea.addEventListener(eventName, e => {
            e.preventDefault();
            dropArea.classList.remove('hover');
        })
    );

    dropArea.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        uploadCSVFile(file);
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        uploadCSVFile(file);
    });
}


// Event Listeners
if (document.getElementById("data-entries-page")) {
    document.addEventListener('DOMContentLoaded', () => {
        loadCompaniesForDataFilters();
        loadDataEntries();
        addDataEntryListener();
    });

    window.loadDataEntries = loadDataEntries;
    window.openEntryModal = openEntryModal;
    window.closeEntryModal = closeEntryModal;
    window.loadCompaniesForDataFilters = loadCompaniesForDataFilters;
    window.createDataEntry = createDataEntry;
    window.deleteDataEntry = deleteDataEntry;

}
