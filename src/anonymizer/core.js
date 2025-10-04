import { PythonAnonymizer } from './languages/python'
import { PhpAnonymizer } from './languages/php'
import { JavaScriptAnonymizer } from './languages/javascript'
import { SqlAnonymizer } from './languages/sql'

export class Anonymizer {
  constructor() {
    this.symbolTable = new Map()
    this.counters = {
      variable: 0,
      function: 0,
      class: 0,
      table: 0,
      column: 0,
      constant: 0
    }
    
    this.anonymizers = {
      python: new PythonAnonymizer(this),
      php: new PhpAnonymizer(this),
      javascript: new JavaScriptAnonymizer(this),
      sql: new SqlAnonymizer(this)
    }
  }

  process(code, language = 'auto') {
    if (language === 'auto') {
      language = this.detectLanguage(code)
    }

    const anonymizer = this.anonymizers[language]
    if (!anonymizer) {
      throw new Error(`Unsupported language: ${language}`)
    }

    const anonymizedCode = anonymizer.anonymize(code)
    
    return {
      code: anonymizedCode,
      mapping: new Map(this.symbolTable),
      language
    }
  }

  detectLanguage(code) {
    if (code.includes('<?php') || code.includes('$')) return 'php'
    if (code.match(/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\b/i)) return 'sql'
    if (code.includes('def ') || code.includes('import ')) return 'python'
    if (code.includes('function') || code.includes('const ') || code.includes('let ')) return 'javascript'
    return 'python'
  }

  anonymize(name, type) {
    if (this.isBuiltin(name, type)) return name
    if (this.isKeyword(name)) return name
    
    const key = `${type}:${name}`
    if (this.symbolTable.has(key)) {
      return this.symbolTable.get(key)
    }
    
    this.counters[type]++
    const anonymized = `${type}_${this.counters[type]}`
    this.symbolTable.set(key, anonymized)
    return anonymized
  }

  isBuiltin(name, type) {
    const builtins = {
      python: ['print', 'len', 'str', 'int', 'list', 'dict', 'range', 'enumerate', 'zip', 'map', 'filter', 'open', 'file', 'input', 'type', 'isinstance', 'True', 'False', 'None'],
      php: ['echo', 'print', 'var_dump', 'isset', 'empty', 'array', 'count', 'strlen', 'strpos', 'substr', 'explode', 'implode', 'true', 'false', 'null', 'TRUE', 'FALSE', 'NULL'],
      javascript: ['console', 'log', 'window', 'document', 'alert', 'prompt', 'confirm', 'setTimeout', 'setInterval', 'parseInt', 'parseFloat', 'JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'true', 'false', 'null', 'undefined'],
      sql: ['SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'DATABASE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX']
    }
    
    for (const lang in builtins) {
      if (builtins[lang].includes(name)) return true
    }
    return false
  }

  isKeyword(name) {
    const keywords = [
      'if', 'else', 'elif', 'while', 'for', 'return', 'break', 'continue', 'pass', 'def', 'class', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'yield', 'async', 'await',
      'function', 'var', 'let', 'const', 'return', 'if', 'else', 'switch', 'case', 'default', 'for', 'while', 'do', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'typeof', 'instanceof',
      'public', 'private', 'protected', 'static', 'final', 'abstract', 'interface', 'extends', 'implements', 'namespace', 'use', 'require', 'include',
      'AS', 'DESC', 'ASC', 'DISTINCT', 'UNION', 'ALL', 'EXISTS', 'BETWEEN', 'IS', 'NULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'DEFAULT', 'CHECK', 'CONSTRAINT'
    ]
    return keywords.includes(name)
  }

  clear() {
    this.symbolTable.clear()
    this.counters = {
      variable: 0,
      function: 0,
      class: 0,
      table: 0,
      column: 0,
      constant: 0
    }
  }
}