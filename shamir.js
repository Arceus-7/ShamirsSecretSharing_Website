// Shamir's Secret Sharing Implementation in JavaScript
// Uses BigInt for secure arithmetic operations

// Prime used for finite field operations (same as Go implementation)
const PRIME = BigInt(2147483647); // 2^31 - 1

// Point represents a point on the polynomial
class Point {
    constructor(x, y) {
        this.x = BigInt(x);
        this.y = BigInt(y);
    }
}

// ShamirSecretSharing implements the algorithm
class ShamirSecretSharing {
    constructor(threshold, numShares) {
        if (threshold > numShares) {
            throw new Error("Threshold cannot be greater than number of shares");
        }
        this.threshold = threshold;
        this.numShares = numShares;
    }

    // Modular inverse using extended Euclidean algorithm
    modInverse(a, m) {
        a = ((a % m) + m) % m; // Ensure positive
        
        let [old_r, r] = [a, m];
        let [old_s, s] = [BigInt(1), BigInt(0)];
        let [old_t, t] = [BigInt(0), BigInt(1)];

        while (r !== BigInt(0)) {
            const quotient = old_r / r;
            [old_r, r] = [r, old_r - quotient * r];
            [old_s, s] = [s, old_s - quotient * s];
            [old_t, t] = [t, old_t - quotient * t];
        }

        if (old_r !== BigInt(1)) {
            throw new Error("Modular inverse does not exist");
        }

        return ((old_s % m) + m) % m;
    }

    // Generate random coefficients for the polynomial
    generateRandomCoefficients(secret) {
        const coefficients = new Array(this.threshold);
        coefficients[0] = BigInt(secret); // a0 = secret

        for (let i = 1; i < this.threshold; i++) {
            // Generate random coefficient (0 to PRIME-1)
            const coeff = BigInt(Math.floor(Math.random() * Number(PRIME)));
            coefficients[i] = coeff;
        }

        return coefficients;
    }

    // Evaluate polynomial at given x
    evaluatePolynomial(coefficients, x) {
        let result = coefficients[0];
        let xPower = BigInt(1);
        const xBig = BigInt(x);

        for (let i = 1; i < coefficients.length; i++) {
            xPower = (xPower * xBig) % PRIME;
            const term = (coefficients[i] * xPower) % PRIME;
            result = (result + term) % PRIME;
        }

        return result;
    }

    // Generate shares for a secret
    generateShares(secret) {
        const coefficients = this.generateRandomCoefficients(secret);
        const shares = new Array(this.numShares);

        for (let i = 0; i < this.numShares; i++) {
            const x = i + 1; // x cannot be 0
            const y = this.evaluatePolynomial(coefficients, x);
            shares[i] = new Point(x, y);
        }

        return shares;
    }

    // Lagrange interpolation to reconstruct secret
    lagrangeInterpolation(points) {
        if (points.length < this.threshold) {
            throw new Error("Insufficient shares to reconstruct secret");
        }

        // Take only threshold number of points
        const selectedPoints = points.slice(0, this.threshold);
        let secret = BigInt(0);

        for (let i = 0; i < selectedPoints.length; i++) {
            const xi = selectedPoints[i].x;
            const yi = selectedPoints[i].y;

            // Calculate Lagrange basis polynomial
            let numerator = BigInt(1);
            let denominator = BigInt(1);

            for (let j = 0; j < selectedPoints.length; j++) {
                if (i !== j) {
                    const xj = selectedPoints[j].x;

                    // numerator *= (0 - xj) = -xj
                    numerator = (numerator * (-xj)) % PRIME;

                    // denominator *= (xi - xj)
                    const diff = xi - xj;
                    denominator = (denominator * diff) % PRIME;
                }
            }

            // Ensure denominator is positive
            denominator = ((denominator % PRIME) + PRIME) % PRIME;
            
            // Calculate numerator / denominator mod prime
            const inv = this.modInverse(denominator, PRIME);
            const lagrangeBasis = (numerator * inv) % PRIME;

            // Add yi * lagrangeBasis to secret
            const term = (yi * lagrangeBasis) % PRIME;
            secret = (secret + term) % PRIME;
        }

        // Ensure result is positive
        secret = ((secret % PRIME) + PRIME) % PRIME;
        return secret;
    }

    // Reconstruct the original secret from shares
    reconstructSecret(shares) {
        return this.lagrangeInterpolation(shares);
    }

    // Text processing functions
    shareText(text) {
        const bytes = new TextEncoder().encode(text);
        const allShares = new Array(bytes.length);

        for (let i = 0; i < bytes.length; i++) {
            const secret = BigInt(bytes[i]);
            const shares = this.generateShares(secret);
            allShares[i] = shares;
        }

        return allShares;
    }

    reconstructText(allShares) {
        const bytes = new Uint8Array(allShares.length);

        for (let i = 0; i < allShares.length; i++) {
            const secret = this.reconstructSecret(allShares[i]);
            bytes[i] = Number(secret);
        }

        return new TextDecoder().decode(bytes);
    }

    // Image processing functions
    shareImage(imageData) {
        const pixels = new Uint8Array(imageData.data.length / 4); // RGBA to grayscale
        
        // Convert RGBA to grayscale
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            // Convert to grayscale using luminance formula
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            pixels[i / 4] = gray;
        }

        // Generate shares for each pixel
        const allShares = new Array(pixels.length);
        for (let i = 0; i < pixels.length; i++) {
            const secret = BigInt(pixels[i]);
            const shares = this.generateShares(secret);
            allShares[i] = shares;
        }

        return allShares;
    }

    reconstructImage(allShares, width, height) {
        // Reconstruct pixel values
        const pixels = new Uint8Array(allShares.length);
        for (let i = 0; i < allShares.length; i++) {
            const secret = this.reconstructSecret(allShares[i]);
            pixels[i] = Number(secret);
        }

        // Create RGBA image data
        const imageData = new ImageData(width, height);
        for (let i = 0; i < pixels.length; i++) {
            const gray = pixels[i];
            const idx = i * 4;
            imageData.data[idx] = gray;     // R
            imageData.data[idx + 1] = gray; // G
            imageData.data[idx + 2] = gray; // B
            imageData.data[idx + 3] = 255;  // A
        }

        return imageData;
    }
}

// Utility functions for saving/loading shares
function saveTextShares(allShares, filename) {
    let content = `${allShares.length}\n`; // Number of characters
    
    // Write shares for each character
    for (const shares of allShares) {
        content += `${shares.length}\n`; // Number of shares for this character
        for (const share of shares) {
            content += `${share.x} ${share.y}\n`;
        }
    }
    
    downloadFile(content, filename, 'text/plain');
}

function loadTextShares(content) {
    const lines = content.trim().split('\n');
    let lineIndex = 0;
    
    // Read number of characters
    const numChars = parseInt(lines[lineIndex++]);
    const allShares = new Array(numChars);
    
    for (let i = 0; i < numChars; i++) {
        const numShares = parseInt(lines[lineIndex++]);
        const shares = new Array(numShares);
        
        for (let j = 0; j < numShares; j++) {
            const [x, y] = lines[lineIndex++].split(' ');
            shares[j] = new Point(x, y);
        }
        allShares[i] = shares;
    }
    
    return allShares;
}

function saveImageShares(allShares, width, height, filename) {
    let content = `${width} ${height} ${allShares.length}\n`; // Dimensions and number of pixels
    
    // Write shares for each pixel
    for (const shares of allShares) {
        content += `${shares.length}\n`; // Number of shares for this pixel
        for (const share of shares) {
            content += `${share.x} ${share.y}\n`;
        }
    }
    
    downloadFile(content, filename, 'text/plain');
}

function loadImageShares(content) {
    const lines = content.trim().split('\n');
    let lineIndex = 0;
    
    // Read dimensions and number of pixels
    const [width, height, numPixels] = lines[lineIndex++].split(' ').map(Number);
    const allShares = new Array(numPixels);
    
    for (let i = 0; i < numPixels; i++) {
        const numShares = parseInt(lines[lineIndex++]);
        const shares = new Array(numShares);
        
        for (let j = 0; j < numShares; j++) {
            const [x, y] = lines[lineIndex++].split(' ');
            shares[j] = new Point(x, y);
        }
        allShares[i] = shares;
    }
    
    return { allShares, width, height };
}

// Utility function to download files
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Export for use in other scripts
window.ShamirSecretSharing = ShamirSecretSharing;
window.Point = Point;
window.saveTextShares = saveTextShares;
window.loadTextShares = loadTextShares;
window.saveImageShares = saveImageShares;
window.loadImageShares = loadImageShares;
window.downloadFile = downloadFile; 