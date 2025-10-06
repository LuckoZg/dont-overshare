// src/anonymizer/languages/python.js

export class PythonAnonymizer {
  constructor(core) {
    this.core = core
  }

  anonymize(code) {
    // STEP 1: Function definitions with parameters
    // This regex captures BOTH function name AND parameters
    code = code.replace(/\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/g, (match, funcName, params) => {
      // Anonymize the function name
      const anonFunc = this.core.anonymize(funcName, 'function')
      
      // Anonymize parameters if they exist
      if (params.trim()) {
        const paramList = params.split(',').map(param => {
          param = param.trim()
          
          // Handle default values: param=value
          if (param.includes('=')) {
            const [paramName, defaultValue] = param.split('=')
            const anonParam = this.core.anonymize(paramName.trim(), 'variable')
            return `${anonParam}=${defaultValue.trim()}`
          }
          
          // Handle **kwargs
          if (param.startsWith('**')) {
            return `**${this.core.anonymize(param.substring(2), 'variable')}`
          }
          
          // Handle *args
          if (param.startsWith('*')) {
            return `*${this.core.anonymize(param.substring(1), 'variable')}`
          }
          
          // Regular parameter
          return this.core.anonymize(param, 'variable')
        })
        
        return `def ${anonFunc}(${paramList.join(', ')})`
      }
      
      // No parameters
      return `def ${anonFunc}()`
    })

    // STEP 2: Class definitions
    code = code.replace(/\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      return `class ${this.core.anonymize(name, 'class')}`
    })

    // STEP 3: Variable assignments (at start of line with optional indentation)
    code = code.replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*=/gm, (match, indent, name) => {
      if (this.core.isKeyword(name) || this.core.isBuiltin(name, 'python')) {
        return match
      }
      return `${indent}${this.core.anonymize(name, 'variable')} =`
    })

    // STEP 4: Import statements
    code = code.replace(/\bimport\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      if (this.core.isBuiltin(name, 'python')) return match
      return `import ${this.core.anonymize(name, 'variable')}`
    })

    code = code.replace(/\bfrom\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      if (this.core.isBuiltin(name, 'python')) return match
      return `from ${this.core.anonymize(name, 'variable')}`
    })

    // STEP 5: Variable usage in expressions
    // This catches variables used in expressions like: price * 0.1
    // The negative lookahead (?!\s*\() ensures we don't match function calls
    code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\b(?!\s*\()/g, (match, name) => {
      // Skip keywords and built-ins
      if (this.core.isKeyword(name) || this.core.isBuiltin(name, 'python')) {
        return match
      }
      
      // Check if this variable is in our symbol table
      // (meaning we've anonymized it during assignment or as a parameter)
      const key = `variable:${name}`
      if (this.core.symbolTable.has(key)) {
        return this.core.symbolTable.get(key)
      }
      
      // Not in symbol table yet - leave as is
      // (might be defined in outer scope or later in code)
      return match
    })

    // STEP 6: Function calls
    // This ensures function names used in calls match their definitions
    code = code.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, (match, name) => {
      if (this.core.isKeyword(name) || this.core.isBuiltin(name, 'python')) {
        return match
      }
      
      // Check if we've seen this function before
      const key = `function:${name}`
      if (this.core.symbolTable.has(key)) {
        return `${this.core.symbolTable.get(key)}(`
      }
      
      return match
    })

    return code
  }
}