// Integration test script for SDLC Issue Analysis Assistant
import fetch from 'node-fetch';

const BACKEND_URL = 'http://localhost:3002';

console.log('═══════════════════════════════════════════════════════');
console.log('SDLC Issue Analysis Assistant - Integration Tests');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Health Check
async function testHealthCheck() {
  console.log('Test 1: Health Check Endpoint');
  console.log('─────────────────────────────────────────────────────');
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    console.log('✓ Status:', response.status);
    console.log('✓ Response:', JSON.stringify(data, null, 2));
    console.log('✓ Health check passed!\n');
    return true;
  } catch (error) {
    console.log('✗ Health check failed:', error.message, '\n');
    return false;
  }
}

// Test 2: Debug Mode Analysis
async function testDebugMode() {
  console.log('Test 2: Debug Mode Analysis');
  console.log('─────────────────────────────────────────────────────');
  const testIssue = 'Users unable to login after password reset';
  console.log('Issue:', testIssue);
  
  try {
    const response = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        issue: testIssue,
        mode: 'debug'
      })
    });
    
    const data = await response.json();
    console.log('✓ Status:', response.status);
    
    if (data.success) {
      console.log('✓ Provider:', data.provider);
      console.log('✓ Mode:', data.data.mode);
      console.log('✓ Results count:', data.data.results?.length || 0);
      if (data.data.results && data.data.results.length > 0) {
        console.log('✓ First result:', JSON.stringify(data.data.results[0], null, 2));
      }
      console.log('✓ Debug mode test passed!\n');
      return true;
    } else {
      console.log('✗ Error:', data.error, '\n');
      return false;
    }
  } catch (error) {
    console.log('✗ Debug mode test failed:', error.message, '\n');
    return false;
  }
}

// Test 3: Input Validation
async function testValidation() {
  console.log('Test 3: Input Validation');
  console.log('─────────────────────────────────────────────────────');
  
  try {
    // Test empty issue
    const response1 = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue: '', mode: 'debug' })
    });
    const data1 = await response1.json();
    console.log('✓ Empty issue validation:', response1.status === 400 ? 'PASS' : 'FAIL');
    
    // Test invalid mode
    const response2 = await fetch(`${BACKEND_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issue: 'test issue', mode: 'invalid' })
    });
    const data2 = await response2.json();
    console.log('✓ Invalid mode validation:', response2.status === 400 ? 'PASS' : 'FAIL');
    console.log('✓ Validation tests passed!\n');
    return true;
  } catch (error) {
    console.log('✗ Validation test failed:', error.message, '\n');
    return false;
  }
}

// Test 4: All Modes
async function testAllModes() {
  console.log('Test 4: All Analysis Modes');
  console.log('─────────────────────────────────────────────────────');
  const testIssue = 'Database queries slow during peak hours';
  const modes = ['debug', 'test', 'rootcause', 'prevention'];
  
  let allPassed = true;
  for (const mode of modes) {
    try {
      console.log(`Testing ${mode} mode...`);
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issue: testIssue, mode })
      });
      
      const data = await response.json();
      if (data.success && data.data.mode === mode) {
        console.log(`✓ ${mode} mode: PASS`);
      } else {
        console.log(`✗ ${mode} mode: FAIL -`, data.error || 'Unknown error');
        allPassed = false;
      }
    } catch (error) {
      console.log(`✗ ${mode} mode: FAIL -`, error.message);
      allPassed = false;
    }
  }
  
  console.log(allPassed ? '✓ All modes test passed!\n' : '✗ Some modes failed!\n');
  return allPassed;
}

// Run all tests
async function runTests() {
  const results = {
    health: false,
    debug: false,
    validation: false,
    allModes: false
  };
  
  results.health = await testHealthCheck();
  
  if (results.health) {
    results.debug = await testDebugMode();
    results.validation = await testValidation();
    results.allModes = await testAllModes();
  } else {
    console.log('⚠ Skipping other tests due to health check failure\n');
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Health Check:', results.health ? '✓ PASS' : '✗ FAIL');
  console.log('Debug Mode:', results.debug ? '✓ PASS' : '✗ FAIL');
  console.log('Validation:', results.validation ? '✓ PASS' : '✗ FAIL');
  console.log('All Modes:', results.allModes ? '✓ PASS' : '✗ FAIL');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;
  console.log(`Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Integration successful!\n');
  } else {
    console.log('⚠ Some tests failed. Please check the output above.\n');
  }
}

// Execute tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});

// Made with Bob
