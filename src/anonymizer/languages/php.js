export class PhpAnonymizer {
  constructor(core) {
    this.core = core
  }

  anonymize(code) {
    // Function definitions
    code = code.replace(/\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `function ${this.core.anonymize(name, 'function')}`
    })

    // Class definitions
    code = code.replace(/\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `class ${this.core.anonymize(name, 'class')}`
    })

    // Variables (PHP variables start with $)
    code = code.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      if (this.core.isBuiltin(name, 'php')) {
        return match
      }
      return `$${this.core.anonymize(name, 'variable')}`
    })

    // Class properties and methods
    code = code.replace(/->([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `->${this.core.anonymize(name, 'variable')}`
    })

    code = code.replace(/::([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `::${this.core.anonymize(name, 'variable')}`
    })

    // Constants (all caps)
    code = code.replace(/\b([A-Z_][A-Z0-9_]{2,})\b/g, (match, name) => {
      if (this.core.isBuiltin(name, 'php')) {
        return match
      }
      return this.core.anonymize(name, 'constant')
    })

    return code
  }
}