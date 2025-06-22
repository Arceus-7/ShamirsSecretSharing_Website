// Main application JavaScript for Shamir's Secret Sharing Demo

// Global variables to store current data
let currentTextShares = null;
let currentImageShares = null;
let currentImageData = null;
let currentImageWidth = 0;
let currentImageHeight = 0;
let currentReconstructedImageData = null;

// Tab management
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Remove active class from all tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Share type toggle
function toggleShareType() {
    const shareType = document.getElementById('shareType').value;
    const textShare = document.getElementById('textShare');
    const imageShare = document.getElementById('imageShare');
    
    if (shareType === 'text') {
        textShare.style.display = 'block';
        imageShare.style.display = 'none';
    } else {
        textShare.style.display = 'none';
        imageShare.style.display = 'block';
    }
}

// Reconstruct type toggle
function toggleReconstructType() {
    const reconstructType = document.getElementById('reconstructType').value;
    const textReconstruct = document.getElementById('textReconstruct');
    const imageReconstruct = document.getElementById('imageReconstruct');
    
    if (reconstructType === 'text') {
        textReconstruct.style.display = 'block';
        imageReconstruct.style.display = 'none';
    } else {
        textReconstruct.style.display = 'none';
        imageReconstruct.style.display = 'block';
    }
}

// Text sharing functionality
function shareText() {
    const text = document.getElementById('textInput').value.trim();
    const threshold = parseInt(document.getElementById('threshold').value);
    const numShares = parseInt(document.getElementById('numShares').value);
    
    if (!text) {
        showResult('shareResult', 'Please enter some text to share.', true);
        return;
    }
    
    if (threshold > numShares) {
        showResult('shareResult', 'Threshold cannot be greater than number of shares.', true);
        return;
    }
    
    showLoading(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            const sss = new ShamirSecretSharing(threshold, numShares);
            currentTextShares = sss.shareText(text);
            
            const resultHtml = `
                <h4>✅ Text Shares Generated Successfully!</h4>
                <p><strong>Original text:</strong> "${text}"</p>
                <p><strong>Characters:</strong> ${text.length}</p>
                <p><strong>Threshold:</strong> ${threshold}</p>
                <p><strong>Total shares:</strong> ${numShares}</p>
                <p><strong>Generated:</strong> ${currentTextShares.length * numShares} total share points</p>
            `;
            
            showResult('shareResult', resultHtml, false);
            document.getElementById('downloadTextBtn').style.display = 'inline-block';
            
        } catch (error) {
            showResult('shareResult', `Error generating shares: ${error.message}`, true);
        } finally {
            showLoading(false);
        }
    }, 100);
}

function downloadTextShares() {
    if (!currentTextShares) {
        showResult('shareResult', 'No shares to download. Please generate shares first.', true);
        return;
    }
    
    const filename = `text_shares_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    saveTextShares(currentTextShares, filename);
}

// Image sharing functionality
function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processImageFile(file);
    }
}

function handleImageDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        processImageFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
}

function processImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('imageCanvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas size
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image to canvas
            ctx.drawImage(img, 0, 0);
            
            // Get image data
            currentImageData = ctx.getImageData(0, 0, img.width, img.height);
            currentImageWidth = img.width;
            currentImageHeight = img.height;
            
            // Show preview
            canvas.style.display = 'block';
            
            const resultHtml = `
                <h4>✅ Image Loaded Successfully!</h4>
                <p><strong>Dimensions:</strong> ${img.width} × ${img.height} pixels</p>
                <p><strong>File size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
                <p><strong>Total pixels:</strong> ${img.width * img.height}</p>
            `;
            
            showResult('shareResult', resultHtml, false);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function shareImage() {
    if (!currentImageData) {
        showResult('shareResult', 'Please upload an image first.', true);
        return;
    }
    
    const threshold = parseInt(document.getElementById('imageThreshold').value);
    const numShares = parseInt(document.getElementById('imageNumShares').value);
    
    if (threshold > numShares) {
        showResult('shareResult', 'Threshold cannot be greater than number of shares.', true);
        return;
    }
    
    showLoading(true);
    
    setTimeout(() => {
        try {
            const sss = new ShamirSecretSharing(threshold, numShares);
            currentImageShares = sss.shareImage(currentImageData);
            
            const totalPixels = currentImageWidth * currentImageHeight;
            const resultHtml = `
                <h4>✅ Image Shares Generated Successfully!</h4>
                <p><strong>Image dimensions:</strong> ${currentImageWidth} × ${currentImageHeight}</p>
                <p><strong>Total pixels:</strong> ${totalPixels}</p>
                <p><strong>Threshold:</strong> ${threshold}</p>
                <p><strong>Total shares:</strong> ${numShares}</p>
                <p><strong>Generated:</strong> ${totalPixels * numShares} total share points</p>
            `;
            
            showResult('shareResult', resultHtml, false);
            document.getElementById('downloadImageBtn').style.display = 'inline-block';
            
        } catch (error) {
            showResult('shareResult', `Error generating image shares: ${error.message}`, true);
        } finally {
            showLoading(false);
        }
    }, 100);
}

function downloadImageShares() {
    if (!currentImageShares) {
        showResult('shareResult', 'No image shares to download. Please generate shares first.', true);
        return;
    }
    
    const filename = `image_shares_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    saveImageShares(currentImageShares, currentImageWidth, currentImageHeight, filename);
}

// Text reconstruction functionality
function handleTextSharesSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processTextSharesFile(file);
    }
}

function handleTextSharesDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
        processTextSharesFile(file);
    }
}

function processTextSharesFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const allShares = loadTextShares(content);
            
            const resultHtml = `
                <h4>✅ Text Shares File Loaded!</h4>
                <p><strong>Characters:</strong> ${allShares.length}</p>
                <p><strong>Shares per character:</strong> ${allShares[0] ? allShares[0].length : 0}</p>
                <p><strong>File size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
            `;
            
            showResult('reconstructResult', resultHtml, false);
            window.loadedTextShares = allShares;
            
        } catch (error) {
            showResult('reconstructResult', `Error loading text shares: ${error.message}`, true);
        }
    };
    reader.readAsText(file);
}

function reconstructText() {
    if (!window.loadedTextShares) {
        showResult('reconstructResult', 'Please upload a text shares file first.', true);
        return;
    }
    
    showLoading(true);
    
    setTimeout(() => {
        try {
            // Use the first character's shares to determine parameters
            const firstShares = window.loadedTextShares[0];
            const threshold = Math.min(firstShares.length, 3); // Default threshold
            const sss = new ShamirSecretSharing(threshold, firstShares.length);
            
            const reconstructedText = sss.reconstructText(window.loadedTextShares);
            
            const resultHtml = `
                <h4>✅ Text Reconstructed Successfully!</h4>
                <p><strong>Reconstructed text:</strong></p>
                <div style="background: white; color: #09090b; padding: 15px; border-radius: 8px; border: 1px solid #ddd; font-family: monospace; white-space: pre-wrap;">${reconstructedText}</div>
                <p><strong>Characters:</strong> ${reconstructedText.length}</p>
            `;
            
            showResult('reconstructResult', resultHtml, false);
            
        } catch (error) {
            showResult('reconstructResult', `Error reconstructing text: ${error.message}`, true);
        } finally {
            showLoading(false);
        }
    }, 100);
}

// Image reconstruction functionality
function handleImageSharesSelect(event) {
    const file = event.target.files[0];
    if (file) {
        processImageSharesFile(file);
    }
}

function handleImageSharesDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.txt')) {
        processImageSharesFile(file);
    }
}

function processImageSharesFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const { allShares, width, height } = loadImageShares(content);
            
            const resultHtml = `
                <h4>✅ Image Shares File Loaded!</h4>
                <p><strong>Image dimensions:</strong> ${width} × ${height}</p>
                <p><strong>Total pixels:</strong> ${allShares.length}</p>
                <p><strong>Shares per pixel:</strong> ${allShares[0] ? allShares[0].length : 0}</p>
                <p><strong>File size:</strong> ${(file.size / 1024).toFixed(2)} KB</p>
            `;
            
            showResult('reconstructResult', resultHtml, false);
            window.loadedImageShares = { allShares, width, height };
            
        } catch (error) {
            showResult('reconstructResult', `Error loading image shares: ${error.message}`, true);
        }
    };
    reader.readAsText(file);
}

function reconstructImage() {
    if (!window.loadedImageShares) {
        showResult('reconstructResult', 'Please upload an image shares file first.', true);
        return;
    }
    
    showLoading(true);
    
    setTimeout(() => {
        try {
            const { allShares, width, height } = window.loadedImageShares;
            
            // Use the first pixel's shares to determine parameters
            const firstShares = allShares[0];
            const threshold = Math.min(firstShares.length, 3); // Default threshold
            const sss = new ShamirSecretSharing(threshold, firstShares.length);
            
            const reconstructedImageData = sss.reconstructImage(allShares, width, height);
            currentReconstructedImageData = reconstructedImageData;
            
            // Create canvas to display the reconstructed image
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(reconstructedImageData, 0, 0);
            
            const resultHtml = `
                <h4>✅ Image Reconstructed Successfully!</h4>
                <p><strong>Dimensions:</strong> ${width} × ${height} pixels</p>
                <p><strong>Total pixels:</strong> ${allShares.length}</p>
                <div style="text-align: center; margin-top: 15px;">
                    <img src="${canvas.toDataURL()}" alt="Reconstructed Image" class="image-preview">
                </div>
            `;
            
            showResult('reconstructResult', resultHtml, false);
            document.getElementById('downloadReconstructedBtn').style.display = 'inline-block';
            
        } catch (error) {
            showResult('reconstructResult', `Error reconstructing image: ${error.message}`, true);
        } finally {
            showLoading(false);
        }
    }, 100);
}

function downloadReconstructedImage() {
    if (!currentReconstructedImageData) {
        showResult('reconstructResult', 'No reconstructed image to download.', true);
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = currentReconstructedImageData.width;
    canvas.height = currentReconstructedImageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(currentReconstructedImageData, 0, 0);
    
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reconstructed_image_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}

// Utility functions
function showResult(elementId, html, isError) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<div class="result ${isError ? 'error' : ''}">${html}</div>`;
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'block' : 'none';
}

// GSAP Animations
function animateIn() {
    gsap.from('.container', {
        duration: 1,
        opacity: 0,
        y: 50,
        ease: 'power3.out'
    });

    gsap.from('.header h1, .header p, .tabs, .section', {
        duration: 0.8,
        opacity: 0,
        y: 20,
        stagger: 0.1,
        ease: 'power2.out',
        delay: 0.3
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Set up drag and drop event listeners
    const fileUploads = document.querySelectorAll('.file-upload');
    fileUploads.forEach(upload => {
        upload.addEventListener('dragover', handleDragOver);
        upload.addEventListener('dragleave', handleDragLeave);
        upload.addEventListener('drop', function(event) {
            event.preventDefault();
            this.classList.remove('dragover');
        });
    });
    
    // Initialize with text sharing
    toggleShareType();
    toggleReconstructType();
    
    // Run animations
    animateIn();
    
    console.log('🔐 Shamir\'s Secret Sharing Demo loaded successfully!');
}); 