// Load client configuration
let config = {};

async function loadConfig() {
    try {
        const response = await fetch('config.json');
        config = await response.json();
        applyConfig();
        loadGallery();
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

function applyConfig() {
    // Apply custom colors if provided
    if (config.colors) {
        const root = document.documentElement;
        if (config.colors.primary) {
            root.style.setProperty('--primary-color', config.colors.primary);
        }
        if (config.colors.secondary) {
            root.style.setProperty('--secondary-color', config.colors.secondary);
        }
    }

    // Set year in footer
    document.querySelectorAll('.year').forEach(el => {
        el.textContent = new Date().getFullYear();
    });
}

async function loadGallery() {
    const galleryContainer = document.getElementById('gallery');
    if (!galleryContainer) return;

    // In production, this would fetch from your Airtable/API
    // For now, placeholder implementation
    if (config.galleryImages && config.galleryImages.length > 0) {
        config.galleryImages.forEach(imageUrl => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = config.businessName;
            galleryContainer.appendChild(img);
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadConfig);
