// src/anonymizer/core.js
// COPY THIS ENTIRE FILE - REPLACE YOUR CURRENT core.js

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
      constant: 0,
      string: 0  // NEW: for string literals in arrays
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
    // CRITICAL FIX: Check for PHP superglobals FIRST
    if (name.startsWith('$_')) {
      return name  // Preserve $_POST, $_GET, $_SESSION, etc.
    }
    
    // Check if it's a built-in
    if (this.isBuiltin(name, type)) {
      return name
    }
    
    // Check if it's a keyword
    if (this.isKeyword(name)) {
      return name
    }
    
    // Check if we've already anonymized this
    const key = `${type}:${name}`
    if (this.symbolTable.has(key)) {
      return this.symbolTable.get(key)
    }
    
    // Create new anonymized name
    this.counters[type]++
    const anonymized = `${type}_${this.counters[type]}`
    this.symbolTable.set(key, anonymized)
    return anonymized
  }

  isBuiltin(name, type) {
    const builtins = {
      python: [
        // Basic built-ins
        'print', 'len', 'str', 'int', 'list', 'dict', 'range', 'enumerate', 'zip', 
        'map', 'filter', 'open', 'file', 'input', 'type', 'isinstance', 'True', 'False', 'None',
        // More built-ins
        'abs', 'all', 'any', 'bin', 'bool', 'bytes', 'chr', 'complex', 'dir', 'divmod',
        'float', 'format', 'frozenset', 'hex', 'id', 'iter', 'max', 'min', 'next', 'oct',
        'ord', 'pow', 'reversed', 'round', 'set', 'slice', 'sorted', 'sum', 'tuple'
      ],
      php: [
        // Basic PHP functions
        'echo', 'print', 'var_dump', 'isset', 'empty', 'array', 'count', 'strlen', 'strpos', 
        'substr', 'explode', 'implode', 'true', 'false', 'null', 'TRUE', 'FALSE', 'NULL', 
        'die', 'exit', 'include', 'require', 'include_once', 'require_once',
        // MySQL functions (old mysql_* API)
        'mysql_query', 'mysql_fetch_array', 'mysql_fetch_assoc', 'mysql_num_rows', 
        'mysql_real_escape_string', 'mysql_error', 'mysql_connect', 'mysql_select_db', 
        'mysql_close',
        // MySQLi functions
        'mysqli_query', 'mysqli_connect', 'mysqli_close', 'mysqli_fetch_assoc',
        // Common PHP functions
        'md5', 'sha1', 'hash', 'json_encode', 'json_decode', 'serialize', 'unserialize', 
        'file_get_contents', 'file_put_contents', 'is_array', 'is_string', 'is_numeric',
        'in_array', 'array_merge', 'array_push', 'array_pop', 'trim', 'strtolower', 'strtoupper',
        'preg_match', 'preg_replace', 'str_replace', 'strstr', 'strrev', 'ucfirst', 'lcfirst'
      ],
      javascript: [
        'console', 'log', 'window', 'document', 'alert', 'prompt', 'confirm', 
        'setTimeout', 'setInterval', 'parseInt', 'parseFloat', 'JSON', 'Math', 'Date', 
        'Array', 'Object', 'String', 'Number', 'Boolean', 'true', 'false', 'null', 'undefined',
        'isNaN', 'isFinite', 'eval', 'Error', 'Promise', 'Symbol', 'Map', 'Set', 'WeakMap', 'WeakSet'
      ],
      sql: [
        'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 
        'TABLE', 'DATABASE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 
        'AND', 'OR', 'NOT', 'IN', 'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'DISTINCT', 'AS', 'DESC', 'ASC', 'UNION', 'ALL',
        'EXISTS', 'BETWEEN', 'IS', 'NULL'
      ]
    }
    
    // Special check for PHP superglobals
    if (name.startsWith('$_')) {
      return true
    }
    
    // Check against builtin lists
    for (const lang in builtins) {
      if (builtins[lang].includes(name)) {
        return true
      }
    }
    
    return false
  }

  isKeyword(name) {
    const keywords = [
      // Python keywords
      'if', 'else', 'elif', 'while', 'for', 'return', 'break', 'continue', 'pass', 
      'def', 'class', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 
      'yield', 'async', 'await', 'lambda', 'in', 'is', 'not', 'and', 'or',
      // JavaScript keywords
      'function', 'var', 'let', 'const', 'return', 'if', 'else', 'switch', 'case', 
      'default', 'for', 'while', 'do', 'break', 'continue', 'try', 'catch', 'finally', 
      'throw', 'new', 'this', 'typeof', 'instanceof', 'delete', 'void', 'of',
      // PHP keywords
      'public', 'private', 'protected', 'static', 'final', 'abstract', 'interface', 
      'extends', 'implements', 'namespace', 'use', 'require', 'include',
      // SQL keywords
      'AS', 'DESC', 'ASC', 'DISTINCT', 'UNION', 'ALL', 'EXISTS', 'BETWEEN', 'IS', 
      'NULL', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'DEFAULT', 'CHECK', 'CONSTRAINT'
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
      constant: 0,
      string: 0
    }
  }
}