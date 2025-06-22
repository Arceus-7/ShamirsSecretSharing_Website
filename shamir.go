package main

import (
	"bufio"
	"crypto/rand"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"math/big"
	"os"
	"strconv"
	"strings"
)

// Prime used for finite field operations (large prime for security)
var PRIME = big.NewInt(2147483647) // 2^31 - 1

// Point represents a point on the polynomial
type Point struct {
	X, Y *big.Int
}

// ShamirSecretSharing implements the algorithm
type ShamirSecretSharing struct {
	threshold int
	numShares int
}

// NewShamirSecretSharing creates a new instance
func NewShamirSecretSharing(threshold, numShares int) *ShamirSecretSharing {
	if threshold > numShares {
		panic("Threshold cannot be greater than number of shares")
	}
	return &ShamirSecretSharing{
		threshold: threshold,
		numShares: numShares,
	}
}

// modInverse calculates modular inverse using extended Euclidean algorithm
func modInverse(a, m *big.Int) *big.Int {
	if a.Cmp(big.NewInt(0)) < 0 {
		a = new(big.Int).Mod(a, m)
	}

	// Using big.Int's ModInverse method
	inv := new(big.Int).ModInverse(a, m)
	if inv == nil {
		panic("Modular inverse does not exist")
	}
	return inv
}

// generateRandomCoefficients generates random coefficients for the polynomial
func (sss *ShamirSecretSharing) generateRandomCoefficients(secret *big.Int) []*big.Int {
	coefficients := make([]*big.Int, sss.threshold)
	coefficients[0] = new(big.Int).Set(secret) // a0 = secret

	for i := 1; i < sss.threshold; i++ {
		// Generate random coefficient
		coeff, err := rand.Int(rand.Reader, PRIME)
		if err != nil {
			panic("Failed to generate random coefficient")
		}
		coefficients[i] = coeff
	}

	return coefficients
}

// evaluatePolynomial evaluates polynomial at given x
func (sss *ShamirSecretSharing) evaluatePolynomial(coefficients []*big.Int, x int) *big.Int {
	result := new(big.Int).Set(coefficients[0])
	xBig := big.NewInt(int64(x))
	xPower := big.NewInt(1)

	for i := 1; i < len(coefficients); i++ {
		xPower.Mul(xPower, xBig)
		term := new(big.Int).Mul(coefficients[i], xPower)
		result.Add(result, term)
	}

	return result.Mod(result, PRIME)
}

// GenerateShares creates shares for a secret
func (sss *ShamirSecretSharing) GenerateShares(secret *big.Int) []Point {
	coefficients := sss.generateRandomCoefficients(secret)
	shares := make([]Point, sss.numShares)

	for i := 0; i < sss.numShares; i++ {
		x := i + 1 // x cannot be 0
		y := sss.evaluatePolynomial(coefficients, x)
		shares[i] = Point{
			X: big.NewInt(int64(x)),
			Y: y,
		}
	}

	return shares
}

// lagrangeInterpolation reconstructs secret using Lagrange interpolation
func (sss *ShamirSecretSharing) lagrangeInterpolation(points []Point) *big.Int {
	if len(points) < sss.threshold {
		panic("Insufficient shares to reconstruct secret")
	}

	// Take only threshold number of points
	points = points[:sss.threshold]

	secret := big.NewInt(0)

	for i := 0; i < len(points); i++ {
		xi := points[i].X
		yi := points[i].Y

		// Calculate Lagrange basis polynomial
		numerator := big.NewInt(1)
		denominator := big.NewInt(1)

		for j := 0; j < len(points); j++ {
			if i != j {
				xj := points[j].X

				// numerator *= (0 - xj) = -xj
				temp := new(big.Int).Neg(xj)
				numerator.Mul(numerator, temp)

				// denominator *= (xi - xj)
				temp = new(big.Int).Sub(xi, xj)
				denominator.Mul(denominator, temp)
			}
		}

		// Calculate numerator / denominator mod prime
		denominator.Mod(denominator, PRIME)
		if denominator.Cmp(big.NewInt(0)) < 0 {
			denominator.Add(denominator, PRIME)
		}

		inv := modInverse(denominator, PRIME)
		lagrangeBasis := new(big.Int).Mul(numerator, inv)
		lagrangeBasis.Mod(lagrangeBasis, PRIME)

		// Add yi * lagrangeBasis to secret
		term := new(big.Int).Mul(yi, lagrangeBasis)
		secret.Add(secret, term)
	}

	secret.Mod(secret, PRIME)
	if secret.Cmp(big.NewInt(0)) < 0 {
		secret.Add(secret, PRIME)
	}

	return secret
}

// ReconstructSecret reconstructs the original secret from shares
func (sss *ShamirSecretSharing) ReconstructSecret(shares []Point) *big.Int {
	return sss.lagrangeInterpolation(shares)
}

// Text processing functions
func (sss *ShamirSecretSharing) ShareText(text string) ([][]Point, error) {
	bytes := []byte(text)
	allShares := make([][]Point, len(bytes))

	for i, b := range bytes {
		secret := big.NewInt(int64(b))
		shares := sss.GenerateShares(secret)
		allShares[i] = shares
	}

	return allShares, nil
}

func (sss *ShamirSecretSharing) ReconstructText(allShares [][]Point) (string, error) {
	bytes := make([]byte, len(allShares))

	for i, shares := range allShares {
		secret := sss.ReconstructSecret(shares)
		bytes[i] = byte(secret.Int64())
	}

	return string(bytes), nil
}

// Image processing functions
func (sss *ShamirSecretSharing) ShareImage(imagePath string) ([][]Point, int, int, error) {
	file, err := os.Open(imagePath)
	if err != nil {
		return nil, 0, 0, err
	}
	defer file.Close()

	img, _, err := image.Decode(file)
	if err != nil {
		return nil, 0, 0, err
	}

	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()

	// Convert to grayscale and get pixel values
	pixels := make([]uint8, width*height)
	idx := 0

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			c := color.GrayModel.Convert(img.At(x, y)).(color.Gray)
			pixels[idx] = c.Y
			idx++
		}
	}

	// Generate shares for each pixel
	allShares := make([][]Point, len(pixels))
	for i, pixel := range pixels {
		secret := big.NewInt(int64(pixel))
		shares := sss.GenerateShares(secret)
		allShares[i] = shares
	}

	return allShares, width, height, nil
}

func (sss *ShamirSecretSharing) ReconstructImage(allShares [][]Point, width, height int, outputPath string) error {
	// Reconstruct pixel values
	pixels := make([]uint8, len(allShares))
	for i, shares := range allShares {
		secret := sss.ReconstructSecret(shares)
		pixels[i] = uint8(secret.Int64())
	}

	// Create image
	img := image.NewGray(image.Rect(0, 0, width, height))
	idx := 0

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			img.Set(x, y, color.Gray{Y: pixels[idx]})
			idx++
		}
	}

	// Save image
	file, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer file.Close()

	return png.Encode(file, img)
}

// Utility functions for saving/loading shares
func saveTextShares(allShares [][]Point, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := bufio.NewWriter(file)
	defer writer.Flush()

	// Write number of characters
	fmt.Fprintf(writer, "%d\n", len(allShares))

	// Write shares for each character
	for _, shares := range allShares {
		fmt.Fprintf(writer, "%d\n", len(shares))
		for _, share := range shares {
			fmt.Fprintf(writer, "%s %s\n", share.X.String(), share.Y.String())
		}
	}

	return nil
}

func loadTextShares(filename string) ([][]Point, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	// Read number of characters
	scanner.Scan()
	numChars, _ := strconv.Atoi(scanner.Text())

	allShares := make([][]Point, numChars)

	for i := 0; i < numChars; i++ {
		scanner.Scan()
		numShares, _ := strconv.Atoi(scanner.Text())

		shares := make([]Point, numShares)
		for j := 0; j < numShares; j++ {
			scanner.Scan()
			parts := strings.Split(scanner.Text(), " ")
			x, _ := new(big.Int).SetString(parts[0], 10)
			y, _ := new(big.Int).SetString(parts[1], 10)
			shares[j] = Point{X: x, Y: y}
		}
		allShares[i] = shares
	}

	return allShares, nil
}

func saveImageShares(allShares [][]Point, width, height int, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := bufio.NewWriter(file)
	defer writer.Flush()

	// Write image dimensions and number of pixels
	fmt.Fprintf(writer, "%d %d %d\n", width, height, len(allShares))

	// Write shares for each pixel
	for _, shares := range allShares {
		fmt.Fprintf(writer, "%d\n", len(shares))
		for _, share := range shares {
			fmt.Fprintf(writer, "%s %s\n", share.X.String(), share.Y.String())
		}
	}

	return nil
}

func loadImageShares(filename string) ([][]Point, int, int, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, 0, 0, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	// Read dimensions and number of pixels
	scanner.Scan()
	parts := strings.Split(scanner.Text(), " ")
	width, _ := strconv.Atoi(parts[0])
	height, _ := strconv.Atoi(parts[1])
	numPixels, _ := strconv.Atoi(parts[2])

	allShares := make([][]Point, numPixels)

	for i := 0; i < numPixels; i++ {
		scanner.Scan()
		numShares, _ := strconv.Atoi(scanner.Text())

		shares := make([]Point, numShares)
		for j := 0; j < numShares; j++ {
			scanner.Scan()
			parts := strings.Split(scanner.Text(), " ")
			x, _ := new(big.Int).SetString(parts[0], 10)
			y, _ := new(big.Int).SetString(parts[1], 10)
			shares[j] = Point{X: x, Y: y}
		}
		allShares[i] = shares
	}

	return allShares, width, height, nil
}

func main() {
	reader := bufio.NewReader(os.Stdin)

	fmt.Println("Shamir's Secret Sharing Implementation")
	fmt.Println("=====================================")

	// Get parameters
	fmt.Print("Enter threshold (minimum shares needed to reconstruct): ")
	thresholdStr, _ := reader.ReadString('\n')
	threshold, _ := strconv.Atoi(strings.TrimSpace(thresholdStr))

	fmt.Print("Enter total number of shares to generate: ")
	numSharesStr, _ := reader.ReadString('\n')
	numShares, _ := strconv.Atoi(strings.TrimSpace(numSharesStr))

	sss := NewShamirSecretSharing(threshold, numShares)

	// Choose operation
	fmt.Println("\nChoose operation:")
	fmt.Println("1. Share text")
	fmt.Println("2. Reconstruct text")
	fmt.Println("3. Share image")
	fmt.Println("4. Reconstruct image")
	fmt.Print("Enter choice (1-4): ")

	choiceStr, _ := reader.ReadString('\n')
	choice, _ := strconv.Atoi(strings.TrimSpace(choiceStr))

	switch choice {
	case 1:
		// Share text
		fmt.Print("Enter text to share: ")
		text, _ := reader.ReadString('\n')
		text = strings.TrimSpace(text)

		allShares, err := sss.ShareText(text)
		if err != nil {
			fmt.Printf("Error sharing text: %v\n", err)
			return
		}

		fmt.Print("Enter filename to save shares: ")
		filename, _ := reader.ReadString('\n')
		filename = strings.TrimSpace(filename)

		err = saveTextShares(allShares, filename)
		if err != nil {
			fmt.Printf("Error saving shares: %v\n", err)
			return
		}

		fmt.Printf("Text shares saved to %s\n", filename)
		fmt.Printf("Generated %d shares for %d characters\n", numShares, len(text))

	case 2:
		// Reconstruct text
		fmt.Print("Enter filename containing text shares: ")
		filename, _ := reader.ReadString('\n')
		filename = strings.TrimSpace(filename)

		allShares, err := loadTextShares(filename)
		if err != nil {
			fmt.Printf("Error loading shares: %v\n", err)
			return
		}

		reconstructedText, err := sss.ReconstructText(allShares)
		if err != nil {
			fmt.Printf("Error reconstructing text: %v\n", err)
			return
		}

		fmt.Printf("Reconstructed text: %s\n", reconstructedText)

	case 3:
		// Share image
		fmt.Print("Enter path to black & white image: ")
		imagePath, _ := reader.ReadString('\n')
		imagePath = strings.TrimSpace(imagePath)

		allShares, width, height, err := sss.ShareImage(imagePath)
		if err != nil {
			fmt.Printf("Error sharing image: %v\n", err)
			return
		}

		fmt.Print("Enter filename to save image shares: ")
		filename, _ := reader.ReadString('\n')
		filename = strings.TrimSpace(filename)

		err = saveImageShares(allShares, width, height, filename)
		if err != nil {
			fmt.Printf("Error saving image shares: %v\n", err)
			return
		}

		fmt.Printf("Image shares saved to %s\n", filename)
		fmt.Printf("Generated shares for %dx%d image (%d pixels)\n", width, height, len(allShares))

	case 4:
		// Reconstruct image
		fmt.Print("Enter filename containing image shares: ")
		filename, _ := reader.ReadString('\n')
		filename = strings.TrimSpace(filename)

		allShares, width, height, err := loadImageShares(filename)
		if err != nil {
			fmt.Printf("Error loading image shares: %v\n", err)
			return
		}

		fmt.Print("Enter output filename for reconstructed image (e.g., reconstructed.png): ")
		outputPath, _ := reader.ReadString('\n')
		outputPath = strings.TrimSpace(outputPath)

		// Ensure the output path has a .png extension
		if !strings.HasSuffix(strings.ToLower(outputPath), ".png") {
			outputPath += ".png"
		}

		err = sss.ReconstructImage(allShares, width, height, outputPath)
		if err != nil {
			fmt.Printf("Error reconstructing image: %v\n", err)
			return
		}

		fmt.Printf("Image reconstructed and saved to %s\n", outputPath)

	default:
		fmt.Println("Invalid choice")
	}
}
