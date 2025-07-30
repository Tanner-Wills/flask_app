// Import all modules
import { 
    renderCompanies, 
    createCompany, 
    deleteCompany, 
    loadCompaniesForSelect 
} from './companies.js';

import { 
    loadCompaniesForDataFilters,
    loadDataEntries, 
    renderDataEntries, 
    createDataEntry, 
    deleteDataEntry 
} from './data_entries.js';

import { 
    loadCompaniesForStats, 
    loadCompanyStats, 
    renderStats 
} from './stats.js';

// Global Configuration
const API_BASE = 'http://127.0.0.1:5000';

// Global State
export let companies = [];
export let dataEntries = [];

// Utility Functions
function showMessage(elementId, message, type = 'success') {
    const messageEl = document.getElementById(elementId);
    if (!messageEl) {
        console.warn(`Element with ID "${elementId}" not found.`);
        return;
    }
    messageEl.innerHTML = `<div class="${type}">${message}</div>`;
    setTimeout(() => {
        if (messageEl) messageEl.innerHTML = '';
    }, 5000);
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
        const responseText = await error.response?.text?.();
        console.error('Response body:', responseText);
        throw error;
    }
}

// Load companies from API
async function loadCompanies() {
    try {
        const companiesData = await apiRequest('/companies');
        // Update global companies array
        companies.length = 0; // Clear existing
        companies.push(...companiesData); // Add new data
    } catch (error) {
        showMessage('message', 'Failed to load companies', 'error');
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadCompanies();

    if (document.getElementById("companies-page")) {
        loadCompaniesForSelect();
        renderCompanies();
    }
    else if (document.getElementById("data-entries-page")) {
        loadCompaniesForDataFilters();
        loadDataEntries();
    }
    else if (document.getElementById("statistics-page")) {
        loadCompaniesForStats();
    } 
    
    // Make functions globally available
    window.renderCompanies = renderCompanies;
    window.createCompany = createCompany;
    window.deleteCompany = deleteCompany;
    window.loadCompaniesForDataFilters = loadCompaniesForDataFilters;
    window.createDataEntry = createDataEntry;
    window.deleteDataEntry = deleteDataEntry;
    window.loadCompanyStats = loadCompanyStats;
    window.loadDataEntries = loadDataEntries;
});

// Export utilities for use in other modules
export { 
    API_BASE, 
    showMessage, 
    apiRequest 
};