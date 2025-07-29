// Import all modules
import { 
    loadCompanies, 
    renderCompanies, 
    createCompany, 
    deleteCompany, 
    loadCompaniesForSelect 
} from './companies.js';

import { 
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
let companies = [];
let dataEntries = [];

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

// Tab Management
function showTab(tabName, event = null) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    
    // Hide all content sections
    document.querySelectorAll('.content').forEach(content => content.classList.add('hidden'));
    
    // Add active class to clicked tab
    const targetTab = event ? event.target : document.querySelector(`[onclick*="${tabName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Show the selected tab content
    const tabContent = document.getElementById(tabName + '-tab');
    if (tabContent) {
        tabContent.classList.remove('hidden');
    }
    
    // Load data based on selected tab
    switch (tabName) {
        case 'companies':
            loadCompanies();
            break;
        case 'data-entries':
            loadDataEntries();
            loadCompaniesForSelect();
            break;
        case 'statistics':
            loadCompaniesForStats();
            break;
        default:
            console.warn(`Unknown tab: ${tabName}`);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    // Load initial data
    loadCompanies();
    loadCompaniesForStats();
    
    // Make functions globally available
    window.showTab = showTab;
    window.createCompany = createCompany;
    window.deleteCompany = deleteCompany;
    window.createDataEntry = createDataEntry;
    window.deleteDataEntry = deleteDataEntry;
    window.loadCompanyStats = loadCompanyStats;
    window.loadDataEntries = loadDataEntries;
});

// Export utilities for use in other modules
export { 
    API_BASE, 
    companies, 
    dataEntries, 
    showMessage, 
    apiRequest 
};