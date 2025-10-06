// tests/anonymizer.test.js

// Import the Anonymizer class
// In browser: import { Anonymizer } from '../src/anonymizer/core.js'
// For testing, you'll need to use the actual implementation

import { Anonymizer } from '../src/anonymizer/core.js'

class TestRunner {
  constructor() {
    this.tests = []
    this.passed = 0
    this.failed = 0
  }

  test(name, fn) {
    this.tests.push({ name, fn })
  }

  assertEqual(actual, expected, message = '') {
    if (actual !== expected) {
      throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`)
    }
  }

  assertIncludes(actual, expected, message = '') {
    if (!actual.includes(expected)) {
      throw new Error(`${message}\nExpected to include: ${expected}\nActual: ${actual}`)
    }
  }

  async run() {
    console.log('🧪 Running tests...\n')
    
    for (const test of this.tests) {
      try {
        await test.fn()
        console.log(`✅ ${test.name}`)
        this.passed++
      } catch (error) {
        console.log(`❌ ${test.name}`)
        console.log(`   ${error.message}\n`)
        this.failed++
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed`)
    return this.failed === 0
  }
}

// Test suite
const runner = new TestRunner()

runner.test('PHP + SQL mixed code with string literals', () => {
  const anonymizer = new Anonymizer()
  
  const input = `<?php

if(isset($_POST["btn_login"]))
{
	$username = mysql_real_escape_string($_POST["username"]);
	$password = mysql_real_escape_string(md5($_POST["password"]));

	$query = "SELECT *
			  FROM administratori
			  WHERE username LIKE '$username'
			  AND password = '$password'";
			  
	$result = mysql_query($query) or die (mysql_error());

	$br_row = mysql_num_rows($result);

}
else
{
	include("login_interface.php");
	exit;
}


?>`

  const result = anonymizer.process(input, 'php')
  
  // Check that built-in functions are NOT anonymized
  runner.assertIncludes(result.code, 'mysql_real_escape_string', 'Should preserve built-in functions')
  runner.assertIncludes(result.code, 'md5', 'Should preserve md5')
  runner.assertIncludes(result.code, 'mysql_query', 'Should preserve mysql_query')
  runner.assertIncludes(result.code, 'isset', 'Should preserve isset')
  
  // Check that variables ARE anonymized
  runner.assertIncludes(result.code, '$variable_', 'Should anonymize variables')
  
  // Check that SQL table names are anonymized
  runner.assertIncludes(result.code, 'table_', 'Should anonymize table names')
  
  // Check that SQL column names are anonymized
  runner.assertIncludes(result.code, 'column_', 'Should anonymize column names')
  
  // Check that string literals in arrays are anonymized
  runner.assertIncludes(result.code, '"string_', 'Should anonymize string literals in arrays')
  
  // Built-in variables like $_POST should be preserved
  runner.assertIncludes(result.code, '$_POST', 'Should preserve $_POST')
})

runner.test('Simple Python function', () => {
  const anonymizer = new Anonymizer()
  
  const input = `def calculate_total(price, tax_rate):
    return price * (1 + tax_rate)`

  const result = anonymizer.process(input, 'python')
  
  runner.assertIncludes(result.code, 'def function_', 'Should anonymize function name')
  runner.assertIncludes(result.code, 'variable_', 'Should anonymize parameters')
  runner.assertEqual(result.code.includes('calculate_total'), false, 'Should not contain original function name')
})

runner.test('JavaScript with multiple variable types', () => {
  const anonymizer = new Anonymizer()
  
  const input = `const userName = "John";
let userAge = 25;
var isActive = true;

function getUserInfo(id) {
  return { userName, userAge };
}`

  const result = anonymizer.process(input, 'javascript')
  
  runner.assertIncludes(result.code, 'const variable_', 'Should anonymize const variables')
  runner.assertIncludes(result.code, 'let variable_', 'Should anonymize let variables')
  runner.assertIncludes(result.code, 'var variable_', 'Should anonymize var variables')
  runner.assertIncludes(result.code, 'function function_', 'Should anonymize functions')
})

runner.test('SQL with joins and complex queries', () => {
  const anonymizer = new Anonymizer()
  
  const input = `SELECT u.user_id, u.email, o.order_total
FROM users u
JOIN orders o ON u.user_id = o.user_id
WHERE u.is_active = 1
AND o.order_date > '2024-01-01'`

  const result = anonymizer.process(input, 'sql')
  
  runner.assertIncludes(result.code, 'FROM table_', 'Should anonymize table names')
  runner.assertIncludes(result.code, 'JOIN table_', 'Should anonymize joined tables')
  runner.assertIncludes(result.code, 'column_', 'Should anonymize column names')
  runner.assertIncludes(result.code, 'SELECT', 'Should preserve SQL keywords')
})

runner.test('PHP with class definitions', () => {
  const anonymizer = new Anonymizer()
  
  const input = `class UserController {
    private $database;
    
    public function getUser($userId) {
        return $this->database->query("SELECT * FROM users WHERE id = $userId");
    }
}`

  const result = anonymizer.process(input, 'php')
  
  runner.assertIncludes(result.code, 'class class_', 'Should anonymize class name')
  runner.assertIncludes(result.code, '$variable_', 'Should anonymize properties')
  runner.assertIncludes(result.code, 'function function_', 'Should anonymize methods')
})

runner.test('Preserve built-in PHP superglobals', () => {
  const anonymizer = new Anonymizer()
  
  const input = `$user = $_POST['username'];
$session = $_SESSION['user_id'];
$cookie = $_COOKIE['token'];
$server = $_SERVER['REQUEST_METHOD'];`

  const result = anonymizer.process(input, 'php')
  
  runner.assertIncludes(result.code, '$_POST', 'Should preserve $_POST')
  runner.assertIncludes(result.code, '$_SESSION', 'Should preserve $_SESSION')
  runner.assertIncludes(result.code, '$_COOKIE', 'Should preserve $_COOKIE')
  runner.assertIncludes(result.code, '$_SERVER', 'Should preserve $_SERVER')
})

runner.test('Mapping consistency - same names get same anonymization', () => {
  const anonymizer = new Anonymizer()
  
  const input = `def calculate(price):
    tax = price * 0.1
    total = price + tax
    return total`

  const result = anonymizer.process(input, 'python')
  const mapping = result.mapping
  
  // Get the anonymized name for 'price'
  const priceKey = 'variable:price'
  const anonymizedPrice = mapping.get(priceKey)
  
  // Count occurrences of anonymized price in output
  const regex = new RegExp(anonymizedPrice, 'g')
  const matches = result.code.match(regex)
  
  if (matches.length !== 3) {
    throw new Error(`Expected 'price' to be consistently anonymized 3 times, but found ${matches.length} times`)
  }
})

runner.test('String literals in array access', () => {
  const anonymizer = new Anonymizer()
  
  const input = `$name = $_POST["user_name"];
$email = $_POST["user_email"];
$data = $array["some_key"];`

  const result = anonymizer.process(input, 'php')
  
  // String literals should be anonymized
  runner.assertIncludes(result.code, '"string_', 'Should anonymize string literals')
  
  // But $_POST should be preserved
  runner.assertIncludes(result.code, '$_POST', 'Should preserve $_POST')
})

// Run all tests
runner.run().then(success => {
  if (!success) {
    process.exit(1)
  }
})