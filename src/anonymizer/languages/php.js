// src/anonymizer/languages/php.js
// COPY THIS ENTIRE FILE - REPLACE YOUR CURRENT php.js

export class PhpAnonymizer {
  constructor(core) {
    this.core = core
  }

  anonymize(code) {
    // STEP 1: Anonymize SQL within strings FIRST (before touching PHP variables)
    code = this.anonymizeSqlInStrings(code)
    
    // STEP 2: Anonymize string literals in array access BEFORE variable names
    // Handles: $_POST["username"] or $array['key_name']
    code = code.replace(/\[["']([a-zA-Z_][a-zA-Z0-9_]*)["']\]/g, (match, name) => {
      if (this.core.isBuiltin(name, 'php')) return match
      return `["${this.core.anonymize(name, 'string')}"]`
    })
    
    // STEP 3: Function definitions
    code = code.replace(/\bfunction\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      if (this.core.isBuiltin(name, 'php')) return match
      return `function ${this.core.anonymize(name, 'function')}`
    })

    // STEP 4: Class definitions
    code = code.replace(/\bclass\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      if (this.core.isBuiltin(name, 'php')) return match
      return `class ${this.core.anonymize(name, 'class')}`
    })

    // STEP 5: Variables - CRITICAL FIX HERE
    // The full match includes $, so $_POST stays as $_POST
    code = code.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      // match = "$username" or "$_POST"
      // name = "username" or "_POST"
      
      // Check the FULL match to detect superglobals
      if (match.startsWith('$_')) {
        return match  // Preserve $_POST, $_GET, $_SESSION, etc.
      }
      
      // Preserve built-in function names
      if (this.core.isBuiltin(name, 'php')) {
        return match
      }
      
      // Anonymize regular variables
      return `$${this.core.anonymize(name, 'variable')}`
    })

    // STEP 6: Object properties and methods (->property, ->method())
    code = code.replace(/->([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      if (this.core.isBuiltin(name, 'php')) return match
      return `->${this.core.anonymize(name, 'variable')}`
    })

    // STEP 7: Static calls (::method, ::property)
    code = code.replace(/::([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, name) => {
      if (this.core.isBuiltin(name, 'php')) return match
      return `::${this.core.anonymize(name, 'variable')}`
    })

    // STEP 8: Constants (all uppercase with at least 2 chars)
    code = code.replace(/\b([A-Z_][A-Z0-9_]{2,})\b/g, (match, name) => {
      if (this.core.isBuiltin(name, 'php')) return match
      return this.core.anonymize(name, 'constant')
    })

    return code
  }

  /**
   * Find and anonymize SQL queries within PHP strings
   */
  anonymizeSqlInStrings(code) {
    // Match SQL in double-quoted strings
    const doubleQuoteRegex = /"([^"]*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|DROP|ALTER)[^"]*)"/gi
    code = code.replace(doubleQuoteRegex, (match, sqlContent) => {
      const anonymizedSql = this.anonymizeSqlQuery(sqlContent)
      return `"${anonymizedSql}"`
    })

    // Match SQL in single-quoted strings
    const singleQuoteRegex = /'([^']*(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|CREATE|DROP|ALTER)[^']*)'/gi
    code = code.replace(singleQuoteRegex, (match, sqlContent) => {
      const anonymizedSql = this.anonymizeSqlQuery(sqlContent)
      return `'${anonymizedSql}'`
    })

    return code
  }

  /**
   * Anonymize SQL query while preserving PHP variables inside it
   * Example: "WHERE username = '$username'" 
   *       -> "WHERE column_1 = '$username'" (PHP var preserved)
   */
  anonymizeSqlQuery(sql) {
    // STEP 1: Protect PHP variables by replacing with placeholders
    const phpVars = []
    sql = sql.replace(/\$([a-zA-Z_][a-zA-Z0-9_]*)/g, (match) => {
      const placeholder = `__PHPVAR${phpVars.length}__`
      phpVars.push(match)
      return placeholder
    })

    // STEP 2: Anonymize table names (FROM, JOIN, INTO, UPDATE)
    sql = sql.replace(/\b(FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi, 
      (match, keyword, name) => {
        return `${keyword} ${this.core.anonymize(name, 'table')}`
      }
    )

    // STEP 3: Anonymize table names in CREATE/DROP/ALTER TABLE
    sql = sql.replace(/\b(CREATE|DROP|ALTER)\s+TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi, 
      (match, keyword, name) => {
        return `${keyword} TABLE ${this.core.anonymize(name, 'table')}`
      }
    )

    // STEP 4: Anonymize column names in WHERE/ON/AND/OR clauses
    sql = sql.replace(/\b(WHERE|ON|AND|OR)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(=|LIKE|>|<|>=|<=|!=|<>)/gi, 
      (match, keyword, column, operator) => {
        const upperColumn = column.toUpperCase()
        if (this.core.isKeyword(upperColumn) || this.core.isBuiltin(upperColumn, 'sql')) {
          return match
        }
        return `${keyword} ${this.core.anonymize(column, 'column')} ${operator}`
      }
    )

    // STEP 5: Anonymize column names in SELECT clause
    sql = sql.replace(/\bSELECT\s+([\s\S]*?)\s+FROM/gi, (match, columns) => {
      // Don't touch SELECT *
      if (columns.trim() === '*') {
        return match
      }
      
      const anonymizedColumns = columns.split(',').map(col => {
        col = col.trim()
        
        // Skip * and aggregate functions
        if (col === '*' || 
            col.toUpperCase().startsWith('COUNT') || 
            col.toUpperCase().startsWith('SUM') ||
            col.toUpperCase().startsWith('AVG') ||
            col.toUpperCase().startsWith('MIN') ||
            col.toUpperCase().startsWith('MAX')) {
          return col
        }
        
        // Handle table.column notation
        const parts = col.split('.')
        if (parts.length === 2) {
          return `${this.core.anonymize(parts[0].trim(), 'table')}.${this.core.anonymize(parts[1].trim(), 'column')}`
        }
        
        // Handle AS alias
        if (col.toUpperCase().includes(' AS ')) {
          const [colName, alias] = col.split(/\s+AS\s+/i)
          const anonCol = this.anonymizeColumnRef(colName.trim())
          const anonAlias = this.core.anonymize(alias.trim(), 'column')
          return `${anonCol} AS ${anonAlias}`
        }
        
        // Simple column
        return this.anonymizeColumnRef(col)
      }).join(', ')
      
      return `SELECT ${anonymizedColumns} FROM`
    })

    // STEP 6: Restore PHP variables
    phpVars.forEach((phpVar, index) => {
      sql = sql.replace(`__PHPVAR${index}__`, phpVar)
    })

    return sql
  }

  /**
   * Helper to anonymize a column reference
   */
  anonymizeColumnRef(col) {
    col = col.trim()
    
    // Handle table.column
    const parts = col.split('.')
    if (parts.length === 2) {
      return `${this.core.anonymize(parts[0], 'table')}.${this.core.anonymize(parts[1], 'column')}`
    }
    
    // Don't anonymize SQL keywords
    const upperCol = col.toUpperCase()
    if (this.core.isKeyword(upperCol) || this.core.isBuiltin(upperCol, 'sql')) {
      return col
    }
    
    // Anonymize as column
    return this.core.anonymize(col, 'column')
  }
}