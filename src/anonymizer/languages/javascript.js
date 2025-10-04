export class JavaScriptAnonymizer {
  constructor(core) {
    this.core = core
  }

  anonymize(code) {
    // Function declarations
    code = code.replace(/\bfunction\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, name) => {
      return `function ${this.core.anonymize(name, 'function')}`
    })

    // Arrow functions and function expressions
    code = code.replace(/\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(\([^)]*\)|[a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g, 
      (match, keyword, name) => {
        return match.replace(name, this.core.anonymize(name, 'function'))
      }
    )

    // Class declarations
    code = code.replace(/\bclass\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, name) => {
      return `class ${this.core.anonymize(name, 'class')}`
    })

    // Variable declarations
    code = code.replace(/\b(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, (match, keyword, name) => {
      if (this.core.isBuiltin(name, 'javascript')) {
        return match
      }
      return `${keyword} ${this.core.anonymize(name, 'variable')}`
    })

    // Object properties in destructuring
    code = code.replace(/{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*}/g, (match, name) => {
      if (this.core.isBuiltin(name, 'javascript')) {
        return match
      }
      return `{ ${this.core.anonymize(name, 'variable')} }`
    })

    // Function parameters (simple)
    code = code.replace(/\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)/g, (match, name) => {
      if (this.core.isBuiltin(name, 'javascript') || this.core.isKeyword(name)) {
        return match
      }
      return `(${this.core.anonymize(name, 'variable')})`
    })

    return code
  }
}