// Global variables
let folderFiles = [];
let photoFile = null;
let imageStore = {}; // { imageId: { name, colors } }
let mainImage = null; // NEW
let imageCounter = 0; // to generate unique IDs

// DOM elements
const folderInput = document.getElementById('folderInput');
const photoInput = document.getElementById('photoInput');
const folderPreview = document.getElementById('folderPreview');
const photoPreview = document.getElementById('photoPreview');
const processBtn = document.getElementById('processBtn');
const clearBtn = document.getElementById('clearBtn');
const resultsSection = document.getElementById('resultsSection');
const colorPalette = document.getElementById('colorPalette');
const fileList = document.getElementById('fileList');

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Folder input change
    folderInput.addEventListener('change', handleFolderUpload);
    
    // Photo input change
    photoInput.addEventListener('change', handlePhotoUpload);
    
    // Process button
    processBtn.addEventListener('click', processFiles);
    
    // Clear button
    clearBtn.addEventListener('click', clearAll);
    
    // Drag and drop for upload cards
    setupDragAndDrop();
}

function setupDragAndDrop() {
    const uploadCards = document.querySelectorAll('.upload-card');
    
    uploadCards.forEach(card => {
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    const card = e.currentTarget;
    
    if (card.classList.contains('folder-upload')) {
        // For folder upload, we can't directly handle dropped folders
        // So we'll just show a message
        showNotification('Please use the "Choose Folder" button to select a folder', 'info');
    } else if (card.classList.contains('photo-upload')) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            photoFile = imageFiles[0];
            displayPhotoPreview();
            updateProcessButton();
        } else {
            showNotification('Please select a valid image file', 'error');
        }
    }
}

function handleFolderUpload(e) {
    const files = Array.from(e.target.files);
    folderFiles = files;
    displayFolderPreview();

    files.forEach(file => {
        if (file.type.startsWith("image/")) { // check if its even an image
            const imageId = `img_${++imageCounter}`;
            const reader = new FileReader();

            reader.onload = function(event) {
                const img = new Image();
                img.src = event.target.result;

                img.onload = function() {
                    const colorThief = new ColorThief();
                    const palette = colorThief.getPalette(img, 8);
                    const colors = palette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));
                    // store in object
                    imageStore[imageId] = {
                        name: file.name,
                        colors: colors,
                        src: event.target.result  // NEW CHANGES 
                    };

                    console.log("Stored:", imageStore);
                };
            };

            reader.readAsDataURL(file);
        }
    });

    updateProcessButton();
}

function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        photoFile = file;
        displayPhotoPreview();

        const imageId = `img_${++imageCounter}`;
        const reader = new FileReader();

        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;

            img.onload = function() {
                const colorThief = new ColorThief();
                const palette = colorThief.getPalette(img, 8);
                const colors = palette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));

                mainImage = {
                    name: file.name,
                    colors: colors,
                    src: event.target.result,
                };
                sortDisplayImages(mainImage); // NEWLY ADDED 
                console.log("Stored:", imageStore);
            };
        };

        reader.readAsDataURL(file);

        updateProcessButton();
    } else {
        showNotification('Please select a valid image file', 'error');
    }
}

function displayFolderPreview() {
    folderPreview.innerHTML = '';
    
    if (folderFiles.length === 0) {
        folderPreview.innerHTML = '<p style="color: #666; font-style: italic;">No files selected</p>';
        return;
    }
    
    const fileCount = folderFiles.length;
    const totalSize = folderFiles.reduce((sum, file) => sum + file.size, 0);
    const sizeText = formatFileSize(totalSize);
    
    folderPreview.innerHTML = `
        <div class="file-item">
            <i class="fas fa-folder"></i>
            <span><strong>${fileCount}</strong> files selected (${sizeText})</span>
        </div>
    `;
    
    // Show first few files
    const maxDisplay = 5;
    const filesToShow = folderFiles.slice(0, maxDisplay);
    
    filesToShow.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-file"></i>
            <span>${file.name} (${formatFileSize(file.size)})</span>
        `;
        folderPreview.appendChild(fileItem);
    });
    
    if (folderFiles.length > maxDisplay) {
        const moreItem = document.createElement('div');
        moreItem.className = 'file-item';
        moreItem.innerHTML = `
            <i class="fas fa-ellipsis-h"></i>
            <span>... and ${folderFiles.length - maxDisplay} more files</span>
        `;
        folderPreview.appendChild(moreItem);
    }
}

function displayPhotoPreview() {
    photoPreview.innerHTML = '';
    
    if (!photoFile) {
        photoPreview.innerHTML = '<p style="color: #666; font-style: italic;">No photo selected</p>';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Preview";
        img.className = "image-preview";

        // Call color extraction when image is actually loaded
        img.onload = function() {
            generateColorPalette(img);
        };

        photoPreview.innerHTML = '';
        photoPreview.appendChild(img);

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <i class="fas fa-image"></i>
            <span>${photoFile.name} (${formatFileSize(photoFile.size)})</span>
        `;
        photoPreview.appendChild(fileItem);
    };
    reader.readAsDataURL(photoFile);
}

function updateProcessButton() {
    const hasFiles = folderFiles.length > 0 || photoFile !== null;
    processBtn.disabled = !hasFiles;
    
    if (hasFiles) {
        processBtn.innerHTML = '<i class="fas fa-magic"></i> Process Files';
    } else {
        processBtn.innerHTML = '<i class="fas fa-magic"></i> Process Files';
    }
}

function processFiles() {
    if (folderFiles.length === 0 && !photoFile) {
        showNotification('Please upload files before processing', 'error');
        return;
    }

    // Show loading state
    processBtn.innerHTML = '<div class="loading"></div> Processing...';
    processBtn.disabled = true;

    setTimeout(() => {
        if (mainImage) {
            sortDisplayImages(mainImage);   // ✅ show only matches
        } else {
            displayStoredImages();          // fallback: show all
        }
        processBtn.innerHTML = '<i class="fas fa-magic"></i> Process Files';
        processBtn.disabled = false;
        showNotification('Files processed successfully!', 'success');
    }, 2000);
}

function displayResults() {
    resultsSection.style.display = 'block';
    displayFileList();
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function generateColorPalette(imgElement) {
    colorPalette.innerHTML = '<h4>Color Palette</h4>';

    const colorThief = new ColorThief();

    if (imgElement.complete && imgElement.naturalWidth > 0) {
        const palette = colorThief.getPalette(imgElement, 6); 

        palette.forEach((rgb, index) => {
            const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.innerHTML = `
                <div class="color-swatch" style="background-color: ${hex}"></div>
                <div class="color-info">
                    <div class="color-name">Color ${index + 1}</div>
                    <div class="color-value">${hex}</div>
                </div>
            `;
            colorPalette.appendChild(colorItem);
        });
    } else {
        setTimeout(() => generateColorPalette(imgElement), 100);
    }
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
        .toString(16).slice(1).toUpperCase();
}


function displayFileList() {
    fileList.innerHTML = '<h4>Uploaded Files</h4>';
    
    // Add folder files
    if (folderFiles.length > 0) {
        const folderHeader = document.createElement('div');
        folderHeader.className = 'file-list-item';
        folderHeader.innerHTML = '<i class="fas fa-folder"></i> <strong>Folder Contents:</strong>';
        fileList.appendChild(folderHeader);
        
        folderFiles.forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-list-item';
            fileItem.innerHTML = `
                <i class="fas fa-file"></i>
                <span>${file.name} (${formatFileSize(file.size)})</span>
            `;
            fileList.appendChild(fileItem);
        });
    }
    
    // Add photo file
    if (photoFile) {
        const photoHeader = document.createElement('div');
        photoHeader.className = 'file-list-item';
        photoHeader.innerHTML = '<i class="fas fa-image"></i> <strong>Photo:</strong>';
        fileList.appendChild(photoHeader);
        
        const photoItem = document.createElement('div');
        photoItem.className = 'file-list-item';
        photoItem.innerHTML = `
            <i class="fas fa-image"></i>
            <span>${photoFile.name} (${formatFileSize(photoFile.size)})</span>
        `;
        fileList.appendChild(photoItem);
    }
}


function clearAll() {
    // Reset all variables
    folderFiles = [];
    photoFile = null;
    
    // Clear inputs
    folderInput.value = '';
    photoInput.value = '';
    
    // Clear previews
    folderPreview.innerHTML = '<p style="color: #666; font-style: italic;">No files selected</p>';
    photoPreview.innerHTML = '<p style="color: #666; font-style: italic;">No photo selected</p>';
    
    // Hide results
    resultsSection.style.display = 'none';
    
    // Update process button
    updateProcessButton();
    
    showNotification('All files cleared', 'info');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#667eea'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

console.log("Stored:", imageStore);

function displayStoredImages(images = Object.entries(imageStore)) {
    resultsSection.style.display = 'block';
    resultsSection.innerHTML = "<h4>Stored Images & Colors</h4>";

    for (const [id, data] of images) {
        const item = document.createElement("div");
        item.className = "image-result";

        const img = document.createElement("img");
        img.src = data.src;
        img.alt = data.name;
        img.style.maxWidth = "150px";
        img.style.display = "block";
        img.style.marginBottom = "10px";

        const title = document.createElement("p");
        title.innerHTML = `<strong>${data.name}</strong> (${id})`;

        const paletteDiv = document.createElement("div");
        paletteDiv.className = "palette";

        data.colors.forEach(hex => {
            const swatch = document.createElement("div");
            swatch.className = "swatch";
            swatch.style.backgroundColor = hex;
            swatch.style.display = "inline-block";
            swatch.style.width = "30px";
            swatch.style.height = "30px";
            swatch.style.marginRight = "5px";
            paletteDiv.appendChild(swatch);
        });

        item.appendChild(img);
        item.appendChild(title);
        item.appendChild(paletteDiv);

        resultsSection.appendChild(item);
    }
}

function colorDistance(c1, c2) {
    const rDiff = c1[0] - c2[0];
    const gDiff = c1[1] - c2[1];
    const bDiff = c1[2] - c2[2];
    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

// hex → [r,g,b]
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255
    ];
}

function paletteSimilarity(colorsA, colorsB) {
    let total = 0;
    let count = 0;

    colorsA.forEach(hexA => {
        const rgbA = hexToRgb(hexA);

        let best = Infinity;
        colorsB.forEach(hexB => {
            const rgbB = hexToRgb(hexB);
            const dist = colorDistance(rgbA, rgbB);
            if (dist < best) best = dist;
        });

        total += best;
        count++;
    });

    return total / count; // average distance
}


function sortDisplayImages(theMainImage) {
    if (!theMainImage) {
        showNotification("No main image selected", "error");
        return [];
    }

    const results = [];
    const threshold = 60; // loosen for debugging

    for (const [id, data] of Object.entries(imageStore)) {
        const score = paletteSimilarity(theMainImage.colors, data.colors);
        console.log(`Image ${id} score:`, score); // DEBUG
        if (score < threshold) {
            results.push([id, { ...data, score }]);
        }
    }

    results.sort((a, b) => a[1].score - b[1].score);

    if (results.length === 0) {
        resultsSection.style.display = 'block';
        resultsSection.innerHTML = "<p>No matches found</p>";
        return [];
    }

    displayStoredImages(results);
    return results;
}