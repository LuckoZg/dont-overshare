export class SqlAnonymizer {
  constructor(core) {
    this.core = core
  }

  anonymize(code) {
    // Table names after FROM, JOIN, INTO, UPDATE
    code = code.replace(/\b(FROM|JOIN|INTO|UPDATE)\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi, (match, keyword, name) => {
      return `${keyword} ${this.core.anonymize(name, 'table')}`
    })

    // Table names after CREATE TABLE, DROP TABLE, ALTER TABLE
    code = code.replace(/\b(CREATE|DROP|ALTER)\s+TABLE\s+([a-zA-Z_][a-zA-Z0-9_]*)/gi, (match, keyword, name) => {
      return `${keyword} TABLE ${this.core.anonymize(name, 'table')}`
    })

    // Column names in SELECT
    code = code.replace(/\bSELECT\s+([\s\S]*?)\s+FROM/gi, (match, columns) => {
      const anonymizedColumns = columns.split(',').map(col => {
        col = col.trim()
        if (col === '*' || col.toUpperCase().startsWith('COUNT') || 
            col.toUpperCase().startsWith('SUM') || col.toUpperCase().startsWith('AVG') ||
            col.toUpperCase().startsWith('MIN') || col.toUpperCase().startsWith('MAX')) {
          return col
        }
        
        // Handle table.column
        const parts = col.split('.')
        if (parts.length === 2) {
          return `${this.core.anonymize(parts[0], 'table')}.${this.core.anonymize(parts[1], 'column')}`
        }
        
        // Handle AS alias
        if (col.toUpperCase().includes(' AS ')) {
          const [colName, alias] = col.split(/\s+AS\s+/i)
          return `${this.anonymizeColumnRef(colName)} AS ${this.core.anonymize(alias.trim(), 'column')}`
        }
        
        return this.anonymizeColumnRef(col)
      }).join(', ')
      
      return `SELECT ${anonymizedColumns} FROM`
    })

    // Column names in WHERE, ON clauses
    code = code.replace(/\b(WHERE|ON|AND|OR)\s+([a-zA-Z_][a-zA-Z0-9_]*\.)?([a-zA-Z_][a-zA-Z0-9_]*)/gi, 
      (match, keyword, table, column) => {
        if (this.core.isKeyword(column) || this.core.isBuiltin(column, 'sql')) {
          return match
        }
        const tablePrefix = table ? `${this.core.anonymize(table.slice(0, -1), 'table')}.` : ''
        return `${keyword} ${tablePrefix}${this.core.anonymize(column, 'column')}`
      }
    )

    // Column definitions in CREATE TABLE
    code = code.replace(/\bCREATE\s+TABLE[\s\S]*?\(([\s\S]*?)\)/gi, (match, columns) => {
      const anonymizedCols = columns.split(',').map(col => {
        const parts = col.trim().split(/\s+/)
        if (parts.length > 0 && !this.core.isKeyword(parts[0])) {
          parts[0] = this.core.anonymize(parts[0], 'column')
        }
        return parts.join(' ')
      }).join(', ')
      
      return match.replace(columns, anonymizedCols)
    })

    return code
  }

  anonymizeColumnRef(col) {
    col = col.trim()
    const parts = col.split('.')
    if (parts.length === 2) {
      return `${this.core.anonymize(parts[0], 'table')}.${this.core.anonymize(parts[1], 'column')}`
    }
    if (!this.core.isKeyword(col) && !this.core.isBuiltin(col, 'sql')) {
      return this.core.anonymize(col, 'column')
    }
    return col
  }
}