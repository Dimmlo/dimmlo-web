#!/usr/bin/env node

/**
 * Build script for Dimmlo client sites
 * Generates static HTML for each client by merging template + config
 */

const fs = require('fs');
const path = require('path');

const TEMPLATE_DIR = path.join(__dirname, '_template');
const CLIENTS_DIR = path.join(__dirname, 'clients');
const BUILD_DIR = path.join(__dirname, 'build');

// Simple template engine - replaces {{variable}} with config values
function renderTemplate(template, config) {
    let rendered = template;
    
    // Replace simple variables
    Object.keys(config).forEach(key => {
        if (typeof config[key] === 'string') {
            const regex = new RegExp(`{{${key}}}`, 'g');
            rendered = rendered.replace(regex, config[key]);
        }
    });
    
    // Add current year
    rendered = rendered.replace(/{{year}}/g, new Date().getFullYear().toString());
    
    // Render hours HTML
    if (config.hours) {
        const hoursHTML = Object.entries(config.hours)
            .map(([day, hours]) => `<p><strong>${day}:</strong> ${hours}</p>`)
            .join('\n                ');
        rendered = rendered.replace('{{hoursHTML}}', hoursHTML);
    }
    
    return rendered;
}

function buildClientSite(clientName) {
    console.log(`Building ${clientName}...`);
    
    const clientDir = path.join(CLIENTS_DIR, clientName);
    const configPath = path.join(clientDir, 'config.json');
    const outputDir = path.join(BUILD_DIR, clientName);
    
    // Load config
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Read and render template
    const templateHTML = fs.readFileSync(path.join(TEMPLATE_DIR, 'index.html'), 'utf8');
    const renderedHTML = renderTemplate(templateHTML, config);
    
    // Write output
    fs.writeFileSync(path.join(outputDir, 'index.html'), renderedHTML);
    
    // Copy static assets
    fs.copyFileSync(
        path.join(TEMPLATE_DIR, 'styles.css'),
        path.join(outputDir, 'styles.css')
    );
    fs.copyFileSync(
        path.join(TEMPLATE_DIR, 'script.js'),
        path.join(outputDir, 'script.js')
    );
    
    // Copy config for runtime use
    fs.copyFileSync(configPath, path.join(outputDir, 'config.json'));
    
    console.log(`✓ ${clientName} built successfully`);
}

// Build all clients
function buildAll() {
    console.log('Building all client sites...\n');
    
    const clients = fs.readdirSync(CLIENTS_DIR)
        .filter(name => {
            const clientPath = path.join(CLIENTS_DIR, name);
            return fs.statSync(clientPath).isDirectory();
        });
    
    clients.forEach(buildClientSite);
    
    console.log(`\n✓ Built ${clients.length} client sites`);
}

// Run
buildAll();
