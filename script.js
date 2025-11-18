// Sample product data
const products = [
    { id: 1, name: "Dell XPS 13", category: "Laptops", brand: "Dell", price: 1299, rating: 5, icon: "💻" },
    { id: 2, name: "HP Spectre x360", category: "Laptops", brand: "HP", price: 1499, rating: 5, icon: "💻" },
    { id: 3, name: "Lenovo ThinkPad X1", category: "Laptops", brand: "Lenovo", price: 1399, rating: 4, icon: "💻" },
    { id: 4, name: "MacBook Air M2", category: "Laptops", brand: "Apple", price: 1199, rating: 5, icon: "💻" },
    { id: 5, name: "Samsung Galaxy S24", category: "Smartphones", brand: "Samsung", price: 899, rating: 5, icon: "📱" },
    { id: 6, name: "iPhone 15 Pro", category: "Smartphones", brand: "Apple", price: 1099, rating: 5, icon: "📱" },
    { id: 7, name: "Dell Gaming Mouse", category: "Gaming Accessories", brand: "Dell", price: 79, rating: 4, icon: "🖱️" },
    { id: 8, name: "Logitech Headset", category: "Audio Equipment", brand: "Logitech", price: 149, rating: 4, icon: "🎧" },
    { id: 9, name: "Mechanical Keyboard", category: "Accessories", brand: "Corsair", price: 159, rating: 5, icon: "⌨️" },
    { id: 10, name: "4K Monitor", category: "Electronics", brand: "Dell", price: 599, rating: 4, icon: "🖥️" },
    { id: 11, name: "Webcam HD", category: "Accessories", brand: "Logitech", price: 89, rating: 4, icon: "📷" },
    { id: 12, name: "USB-C Hub", category: "Accessories", brand: "Anker", price: 49, rating: 3, icon: "🔌" }
];

// User data (simulating user history and preferences)
const userData = {
    name: "John Doe",
    recentlyViewed: ["Laptops", "Smartphones"],
    savedFilters: [
        { name: "Electronics Under $500", filters: { maxPrice: 500, categories: ["Electronics", "Accessories"] } },
        { name: "Premium Laptops", filters: { minPrice: 1000, categories: ["Laptops"] } }
    ],
    preferences: {
        suggestedCategories: ["Gaming Accessories", "Audio Equipment"]
    }
};

// Current filter state
let currentFilters = {
    categories: [],
    brands: [],
    minPrice: 0,
    maxPrice: 2000,
    ratings: []
};

// Current filtered products
let currentFilteredProducts = [...products];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    renderProducts(products);
    setupEventListeners();
});

// Initialize filter controls
function initializeFilters() {
    // Price range sliders
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    const priceMinInput = document.getElementById('price-min-input');
    const priceMaxInput = document.getElementById('price-max-input');
    
    priceMin.addEventListener('input', function() {
        currentFilters.minPrice = parseInt(this.value);
        document.getElementById('min-price').textContent = this.value;
        priceMinInput.value = this.value;
        applyFilters();
    });
    
    priceMax.addEventListener('input', function() {
        currentFilters.maxPrice = parseInt(this.value);
        document.getElementById('max-price').textContent = this.value;
        priceMaxInput.value = this.value;
        applyFilters();
    });
    
    priceMinInput.addEventListener('change', function() {
        priceMin.value = this.value;
        currentFilters.minPrice = parseInt(this.value);
        document.getElementById('min-price').textContent = this.value;
        applyFilters();
    });
    
    priceMaxInput.addEventListener('change', function() {
        priceMax.value = this.value;
        currentFilters.maxPrice = parseInt(this.value);
        document.getElementById('max-price').textContent = this.value;
        applyFilters();
    });
}

// Setup event listeners
function setupEventListeners() {
    // Category checkboxes
    document.querySelectorAll('input[name="category"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateFilterArray('categories', this.value, this.checked);
            applyFilters();
        });
    });
    
    // Recent category checkboxes
    document.querySelectorAll('input[name="recent-category"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateFilterArray('categories', this.value, this.checked);
            applyFilters();
        });
    });
    
    // Suggested category checkboxes
    document.querySelectorAll('input[name="suggested"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateFilterArray('categories', this.value, this.checked);
            applyFilters();
        });
    });
    
    // Brand checkboxes
    document.querySelectorAll('input[name="brand"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateFilterArray('brands', this.value, this.checked);
            applyFilters();
        });
    });
    
    // Rating checkboxes
    document.querySelectorAll('input[name="rating"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateFilterArray('ratings', this.value, this.checked);
            applyFilters();
        });
    });
    
    // Saved filter buttons
    document.querySelectorAll('.saved-filter-btn').forEach(button => {
        button.addEventListener('click', function() {
            applySavedFilter(this.dataset.filter);
        });
    });
    
    // Clear filters button
    document.getElementById('clear-filters-btn').addEventListener('click', clearAllFilters);
    
    // Save filter button
    document.getElementById('save-filter-btn').addEventListener('click', showSaveFilterModal);
    
    // Sort dropdown
    document.getElementById('sort-by').addEventListener('change', function() {
        sortProducts(this.value);
    });
    
    // Modal functionality
    const modal = document.getElementById('save-filter-modal');
    const closeBtn = document.querySelector('.close');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    confirmSaveBtn.addEventListener('click', saveCurrentFilter);
}

// Update filter arrays
function updateFilterArray(filterType, value, isChecked) {
    if (isChecked) {
        if (!currentFilters[filterType].includes(value)) {
            currentFilters[filterType].push(value);
        }
    } else {
        currentFilters[filterType] = currentFilters[filterType].filter(item => item !== value);
    }
}

// Apply filters to products
function applyFilters() {
    let filteredProducts = products.filter(product => {
        // Category filter
        const categoryMatch = currentFilters.categories.length === 0 || 
            currentFilters.categories.some(cat => 
                product.category.toLowerCase() === cat.toLowerCase()
            );
        
        // Brand filter
        const brandMatch = currentFilters.brands.length === 0 || 
            currentFilters.brands.some(brand => 
                product.brand.toLowerCase() === brand.toLowerCase()
            );
        
        // Price filter
        const priceMatch = product.price >= currentFilters.minPrice && 
                          product.price <= currentFilters.maxPrice;
        
        // Rating filter
        const ratingMatch = currentFilters.ratings.length === 0 || 
            currentFilters.ratings.some(rating => product.rating >= parseInt(rating));
        
        return categoryMatch && brandMatch && priceMatch && ratingMatch;
    });
    
    currentFilteredProducts = filteredProducts;
    renderProducts(filteredProducts);
}

// Apply saved filter
function applySavedFilter(filterName) {
    clearAllFilters();
    
    if (filterName === 'electronics-budget') {
        currentFilters.maxPrice = 500;
        document.getElementById('price-max').value = 500;
        document.getElementById('max-price').textContent = 500;
        document.getElementById('price-max-input').value = 500;
        
        // Check electronics and accessories
        const electronicsCheck = document.querySelector('input[name="category"][value="electronics"]');
        const accessoriesCheck = document.querySelector('input[name="category"][value="accessories"]');
        if (electronicsCheck) {
            electronicsCheck.checked = true;
            updateFilterArray('categories', 'electronics', true);
        }
        if (accessoriesCheck) {
            accessoriesCheck.checked = true;
            updateFilterArray('categories', 'accessories', true);
        }
    } else if (filterName === 'premium-laptops') {
        currentFilters.minPrice = 1000;
        document.getElementById('price-min').value = 1000;
        document.getElementById('min-price').textContent = 1000;
        document.getElementById('price-min-input').value = 1000;
        
        // Check laptops
        const laptopsCheck = document.querySelector('input[name="recent-category"][value="Laptops"]');
        if (laptopsCheck) {
            laptopsCheck.checked = true;
            updateFilterArray('categories', 'Laptops', true);
        }
    }
    
    applyFilters();
}

// Clear all filters
function clearAllFilters() {
    currentFilters = {
        categories: [],
        brands: [],
        minPrice: 0,
        maxPrice: 2000,
        ratings: []
    };
    
    currentFilteredProducts = [...products];
    
    // Reset all checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Reset price sliders
    document.getElementById('price-min').value = 0;
    document.getElementById('price-max').value = 2000;
    document.getElementById('min-price').textContent = 0;
    document.getElementById('max-price').textContent = 2000;
    document.getElementById('price-min-input').value = 0;
    document.getElementById('price-max-input').value = 2000;
    
    renderProducts(products);
}

// Render products
function renderProducts(productsToRender) {
    const container = document.getElementById('products-container');
    const countElement = document.getElementById('product-count');
    
    countElement.textContent = `(${productsToRender.length} items)`;
    
    if (productsToRender.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 60px; color: #888;"><h3>No products found</h3><p>Try adjusting your filters</p></div>';
        return;
    }
    
    container.innerHTML = productsToRender.map(product => `
        <div class="product-card">
            <div class="product-image">${product.icon}</div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-category">${product.category}</div>
                <div class="product-rating">${'⭐'.repeat(product.rating)}</div>
                <div class="product-price">$${product.price}</div>
                <div class="product-brand">${product.brand}</div>
            </div>
        </div>
    `).join('');
}

// Sort products
function sortProducts(sortBy) {
    let sortedProducts = [...currentFilteredProducts];
    
    switch(sortBy) {
        case 'price-low':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            sortedProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'newest':
            sortedProducts.reverse();
            break;
        default: // relevance
            break;
    }
    
    renderProducts(sortedProducts);
}

// Show save filter modal
function showSaveFilterModal() {
    document.getElementById('save-filter-modal').style.display = 'block';
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Save current filter
function saveCurrentFilter() {
    const filterName = document.getElementById('filter-name-input').value.trim();
    
    if (!filterName) {
        showToast('Please enter a filter name', 'error');
        return;
    }
    
    // In a real application, this would save to a backend
    console.log('Saving filter:', filterName, currentFilters);
    
    // Create new saved filter button
    const savedFiltersContainer = document.querySelector('.saved-filters');
    const newButton = document.createElement('button');
    newButton.className = 'saved-filter-btn';
    newButton.textContent = `🔖 ${filterName}`;
    newButton.dataset.filter = filterName.toLowerCase().replace(/\s+/g, '-');
    newButton.addEventListener('click', function() {
        // Apply the current filter state when clicked
        showToast(`Applied saved filter: ${filterName}`, 'info');
    });
    
    savedFiltersContainer.appendChild(newButton);
    
    // Close modal
    document.getElementById('save-filter-modal').style.display = 'none';
    document.getElementById('filter-name-input').value = '';
    
    // Show success message
    showToast(`Filter "${filterName}" saved successfully!`, 'success');
}
