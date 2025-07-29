// companies.js - Companies related functions

import {showMessage, apiRequest, companies, dataEntries } from './main.js';



// Load companies for select dropdowns
async function loadCompaniesForSelect() {
    try {
        const companies = await apiRequest('/companies');
        const companySelect = document.getElementById('company-selector');
        // Clear existing options
        companySelect.innerHTML = '<option value="">Select a company</option>';

        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.id;
            option.textContent = company.name;
            companySelect.appendChild(option);
        });
        
        console.log(`Loaded ${companies.length} companies for companies dropdown`);
    } catch (error) {
        console.error('Failed to load companies for dropdown:', error);
        showMessage('companies-message', 'Failed to load companies for dropdown', 'error');
    }
}


// Render companies table
function renderCompanies() {
    const container = document.getElementById('companies-list');
    
    if (!container) {
        console.warn('companies-list container not found');
        return;
    }
    
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

// Create new company
async function createCompany() {
    const nameInput = document.getElementById('company-name');
    if (!nameInput) {
        console.error('company-name input not found');
        return;
    }
    
    const name = nameInput.value.trim();
    if (!name) {
        showMessage('message', 'Please enter a company name', 'error');
        return;
    }

    try {
        await apiRequest('/companies', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
        
        nameInput.value = '';
        showMessage('message', 'Company created successfully');
        loadCompanies();
    } catch (error) {
        showMessage('message', 'Failed to create company', 'error');
    }
}

// Delete company
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


// Export functions
export {
    renderCompanies,
    createCompany,
    deleteCompany,
    loadCompaniesForSelect
};