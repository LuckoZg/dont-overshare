export class PythonAnonymizer {
  constructor(core) {
    this.core = core
  }

  anonymize(code) {
    // Function definitions
    code = code.replace(/\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `def ${this.core.anonymize(name, 'function')}`
    })

    // Class definitions
    code = code.replace(/\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `class ${this.core.anonymize(name, 'class')}`
    })

    // Variable assignments (simple cases)
    code = code.replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm, (match, indent, name) => {
      return `${indent}${this.core.anonymize(name, 'variable')} =`
    })

    // Import statements
    code = code.replace(/\bimport\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `import ${this.core.anonymize(name, 'variable')}`
    })

    code = code.replace(/\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `from ${this.core.anonymize(name, 'variable')}`
    })

    // Function calls and variable usage
    code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, (match, name) => {
      if (this.core.isKeyword(name) || this.core.isBuiltin(name, 'python')) {
        return match
      }
      return `${this.core.anonymize(name, 'function')}(`
    })

    return code
  }
}