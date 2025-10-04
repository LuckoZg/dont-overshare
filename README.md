# 🔒 Don't overshare

TL-DR: Tool for code anonymization before you paste it somewhere where you shouldn't paste it.

Fancy description:
A browser-based tool to anonymize code by replacing variable names, function names, class names, and database identifiers with generic placeholders. Perfect for sharing code samples, creating public bug reports, or building training datasets while protecting sensitive information.

## ✨ Features

- **Multiple Languages**: Python, PHP, JavaScript, SQL
- **Browser-Only Processing**: All processing happens in your browser - no data sent to servers
- **Session-Only Storage**: Data is automatically cleared when you close the tab
- **Auto Language Detection**: Automatically detects the programming language
- **Mapping Export**: Download JSON mapping to reverse anonymization later
- **Clean UI**: Split-screen interface with original code, anonymized code, and mapping view
- **No Network Communication**: Enforced via Content Security Policy - completely offline after initial load

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd code-anonymizer
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Open your browser at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📖 How to Use

1. **Paste Your Code**: Copy and paste your code into the left panel
2. **Select Language**: Choose the language from the dropdown (or use Auto Detect)
3. **Click Anonymize**: Click the "Anonymize" button to process your code
4. **View Results**: 
   - Middle panel shows anonymized code
   - Right panel shows the mapping (original → anonymized)
5. **Export Mapping**: Click "Export Mapping" to download the JSON mapping file
6. **Copy Mapping**: Click "Copy" in the mapping panel to copy the mapping to clipboard

## 🔧 What Gets Anonymized

### Python
- Function definitions (`def`)
- Class definitions (`class`)
- Variable assignments
- Import statements
- Function calls

### PHP
- Function definitions
- Class definitions
- Variables (starting with `$`)
- Class properties and methods (`->`, `::`)
- Constants (all caps)

### JavaScript
- Function declarations
- Arrow functions
- Class declarations
- Variable declarations (`const`, `let`, `var`)
- Destructuring
- Function parameters

### SQL
- Table names (FROM, JOIN, INTO, UPDATE)
- Column names (SELECT, WHERE, ON)
- CREATE TABLE statements
- Table aliases

## 🛡️ Security & Privacy

- **No Server Communication**: All code processing happens locally in your browser
- **Content Security Policy**: Enforced CSP prevents any network requests
- **Session-Only Data**: No localStorage - everything clears when you close the tab
- **No External Dependencies at Runtime**: All parsers are bundled into the application

## 📁 Project Structure

```
code-anonymizer/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.js              # Vue app entry point
    ├── style.css            # Global styles
    ├── App.vue              # Main component
    └── anonymizer/
        ├── core.js          # Core anonymizer logic
        └── languages/
            ├── python.js    # Python anonymizer
            ├── php.js       # PHP anonymizer
            ├── javascript.js # JavaScript anonymizer
            └── sql.js       # SQL anonymizer
```

## 🎯 Use Cases

- **Sharing Code Publicly**: Remove sensitive variable/function names before posting to forums
- **Bug Reports**: Sanitize code before sharing with third-party support
- **Code Reviews**: Anonymize proprietary code for external review
- **Training Data**: Create anonymized datasets for ML models
- **Documentation**: Create generic examples from real code

## 🔄 Mapping File Format

The exported mapping is a JSON file with the format:

```json
{
  "variable:userEmail": "variable_1",
  "function:calculateDiscount": "function_1",
  "table:users": "table_1",
  "column:email_address": "column_1"
}
```

## ⚙️ Configuration

The anonymizer can be configured by modifying `src/anonymizer/core.js`:

- **Add more builtins**: Edit the `isBuiltin()` method
- **Add more keywords**: Edit the `isKeyword()` method
- **Change naming pattern**: Modify the `anonymize()` method

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## ⚠️ Limitations

- **Regex-based parsing**: Uses regex patterns, not full AST parsing (lighter but less accurate)
- **Line limit**: Optimized for files up to 1500 lines
- **Simple patterns**: May miss complex code structures
- **Language detection**: Auto-detection may not work for all edge cases

## 🚧 Future Enhancements

- [ ] Support for more languages (Go, Rust, Java, C#)
- [ ] AST-based parsing for higher accuracy
- [ ] Custom anonymization rules
- [ ] Batch file processing
- [ ] Dark/Light theme toggle
- [ ] De-anonymization feature using mapping file

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Made with ❤️ for developers who value privacy**