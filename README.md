# 🔐 Shamir's Secret Sharing Demo

A fully client-side web application that demonstrates Shamir's Secret Sharing algorithm for both text and grayscale images. This implementation runs entirely in the browser without requiring any server setup or backend dependencies.

## 🌟 Features

### Text Secret Sharing
- **Share Text**: Convert any text into multiple shares using polynomial interpolation
- **Reconstruct Text**: Reconstruct original text from shares using Lagrange interpolation
- **Configurable Parameters**: Set threshold (minimum shares needed) and total number of shares
- **Download Shares**: Save generated shares as downloadable .txt files

### Image Secret Sharing
- **Share Images**: Convert grayscale images into shares pixel-by-pixel
- **Reconstruct Images**: Reconstruct original images from shares
- **Image Preview**: View uploaded and reconstructed images
- **Download Results**: Save both shares and reconstructed images

### User Interface
- **Clean Design**: Modern, responsive interface with gradient backgrounds
- **Tab Navigation**: Easy switching between sharing and reconstruction modes
- **Drag & Drop**: Support for file uploads via drag and drop
- **Real-time Feedback**: Loading indicators and success/error messages
- **Mobile Friendly**: Responsive design that works on all devices

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required - runs entirely in the browser

### Installation
1. Download all files to a folder:
   - `index.html` - Main HTML file
   - `shamir.js` - Core Shamir's Secret Sharing implementation
   - `app.js` - User interface and application logic
   - `README.md` - This documentation

2. Open `index.html` in your web browser

That's it! The application is ready to use.

## 📖 How to Use

### Sharing Text Secrets

1. **Select "Share a Secret" tab**
2. **Choose "Text" from the dropdown**
3. **Enter your secret text** in the text area
4. **Set parameters**:
   - **Threshold**: Minimum number of shares needed to reconstruct (default: 3)
   - **Total Shares**: Total number of shares to generate (default: 5)
5. **Click "Generate Shares"**
6. **Download the shares file** using the "Download Shares" button

### Reconstructing Text Secrets

1. **Select "Reconstruct a Secret" tab**
2. **Choose "Text" from the dropdown**
3. **Upload your shares file** (.txt format)
4. **Click "Reconstruct Text"**
5. **View the reconstructed text** in the results section

### Sharing Image Secrets

1. **Select "Share a Secret" tab**
2. **Choose "Grayscale Image" from the dropdown**
3. **Upload an image** (PNG, JPG, JPEG supported)
4. **Set parameters** (threshold and total shares)
5. **Click "Generate Image Shares"**
6. **Download the shares file**

### Reconstructing Image Secrets

1. **Select "Reconstruct a Secret" tab**
2. **Choose "Grayscale Image" from the dropdown**
3. **Upload your image shares file** (.txt format)
4. **Click "Reconstruct Image"**
5. **View and download the reconstructed image**

## 🔧 Technical Details

### Algorithm Implementation
- **Prime Field**: Uses prime 2³¹ - 1 (2147483647) for finite field arithmetic
- **BigInt Support**: Uses JavaScript BigInt for secure arithmetic operations
- **Polynomial Generation**: Random coefficients for secure sharing
- **Lagrange Interpolation**: For secret reconstruction

### File Formats
- **Text Shares**: Plain text format with character count and share coordinates
- **Image Shares**: Plain text format with dimensions and pixel share coordinates
- **Reconstructed Images**: PNG format for download

### Security Features
- **Cryptographically Secure**: Uses large prime field arithmetic
- **Random Coefficients**: Each sharing operation uses fresh random values
- **Threshold Security**: Original secret cannot be reconstructed with fewer than threshold shares

## 📁 File Structure

```
shamir-secret-sharing/
├── index.html          # Main HTML interface
├── shamir.js           # Core Shamir's Secret Sharing implementation
├── app.js              # User interface and application logic
├── README.md           # This documentation
└── shamir.go           # Original Go implementation (for reference)
```

## 🧮 Mathematical Background

### Shamir's Secret Sharing
Shamir's Secret Sharing is a cryptographic algorithm that allows a secret to be split into multiple shares such that:

1. **Any k shares** can reconstruct the original secret (where k is the threshold)
2. **Fewer than k shares** reveal no information about the secret
3. **Each share** is independent and equally important

### How It Works
1. **Polynomial Generation**: A random polynomial of degree (k-1) is generated where the constant term is the secret
2. **Share Creation**: Each share is a point (x, f(x)) on the polynomial
3. **Reconstruction**: Lagrange interpolation is used to reconstruct the polynomial and recover the secret

### Example
For a (3,5) scheme (threshold=3, total shares=5):
- Secret: 42
- Polynomial: f(x) = 42 + 7x + 3x² (random coefficients)
- Shares: (1,52), (2,68), (3,90), (4,118), (5,152)
- Any 3 shares can reconstruct the secret 42

## 🔒 Security Considerations

- **Browser Security**: All processing happens locally in the browser
- **No Data Transmission**: No data is sent to external servers
- **Prime Field**: Uses a large prime for secure modular arithmetic
- **Random Generation**: Uses cryptographically secure random number generation

## 🐛 Troubleshooting

### Common Issues

1. **"Threshold cannot be greater than number of shares"**
   - Solution: Ensure threshold ≤ total shares

2. **"Insufficient shares to reconstruct secret"**
   - Solution: Make sure you have at least the threshold number of shares

3. **Large images take a long time to process**
   - Solution: Use smaller images or increase browser memory allocation

4. **File upload not working**
   - Solution: Ensure you're using a modern browser with File API support

### Browser Compatibility
- ✅ Chrome 67+
- ✅ Firefox 68+
- ✅ Safari 14+
- ✅ Edge 79+

## 🤝 Contributing

This is a demonstration project. Feel free to:
- Report bugs or issues
- Suggest improvements
- Fork and modify for your own use

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Original Shamir's Secret Sharing algorithm by Adi Shamir
- JavaScript BigInt support for secure arithmetic
- HTML5 Canvas API for image processing
- Modern web APIs for file handling

---

**Note**: This is a demonstration implementation. For production use, consider using established cryptographic libraries and proper key management practices. 