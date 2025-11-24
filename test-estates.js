// Quick test to check estates
import fetch from 'node-fetch';

const backendURL = 'http://localhost:5000';

async function testEstates() {
  console.log('Testing Estate API...\n');

  try {
    const response = await fetch(`${backendURL}/api/estate/all`);
    const result = await response.json();

    console.log('Response status:', response.status);
    console.log('Result:', JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n✅ Found ${result.estates.length} estates`);
      result.estates.forEach((estate, i) => {
        console.log(`\n${i + 1}. ${estate.title}`);
        console.log(`   ID: ${estate.id}`);
        console.log(`   Location: ${estate.location}`);
        console.log(`   Status: ${estate.status}`);
        console.log(`   Agent Email: ${estate.agent_email || 'None'}`);
      });
    } else {
      console.log('❌ Failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure:');
    console.log('1. Backend server is running on', backendURL);
    console.log('2. Database has estates in real_estates table');
  }
}

testEstates();
