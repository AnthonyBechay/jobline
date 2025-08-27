import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = 'http://localhost:5000/api';

// Test credentials - replace with your actual test user
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

async function testFileUpload() {
  try {
    console.log('🔐 Logging in...');
    // First, login to get token
    const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    const { token } = loginResponse.data;
    console.log('✅ Login successful');

    console.log('\n📤 Testing file upload...');
    
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, 'This is a test document for Jobline file upload system.');
    
    // Prepare form data
    const formData = new FormData();
    formData.append('files', fs.createReadStream(testFilePath));
    formData.append('entityType', 'application');
    formData.append('entityId', 'test-app-123'); // Replace with actual application ID
    
    // Upload file
    const uploadResponse = await axios.post(
      `${API_URL}/files/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ File uploaded successfully!');
    console.log('📁 Uploaded file:', uploadResponse.data[0]);
    
    // Test getting files
    console.log('\n📋 Fetching uploaded files...');
    const filesResponse = await axios.get(
      `${API_URL}/files?entityType=application&entityId=test-app-123`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('✅ Files retrieved:', filesResponse.data.length, 'file(s)');
    
    if (filesResponse.data.length > 0) {
      const file = filesResponse.data[0];
      console.log('\n🔗 File details:');
      console.log('  - Name:', file.originalName);
      console.log('  - Size:', file.size, 'bytes');
      console.log('  - Type:', file.mimeType);
      console.log('  - Signed URL (valid for 1 hour):', file.url.substring(0, 100) + '...');
      
      // Test URL refresh
      console.log('\n🔄 Testing URL refresh...');
      const refreshResponse = await axios.post(
        `${API_URL}/files/${file.id}/refresh-url`,
        { expiresIn: 7200 }, // 2 hours
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      console.log('✅ New URL generated (valid for 2 hours)');
      
      // Test file deletion (optional - comment out if you want to keep the file)
      // console.log('\n🗑️ Testing file deletion...');
      // await axios.delete(
      //   `${API_URL}/files/${file.id}`,
      //   {
      //     headers: {
      //       'Authorization': `Bearer ${token}`
      //     }
      //   }
      // );
      // console.log('✅ File deleted successfully');
    }
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    console.log('\n✅ All file upload tests passed!');
    console.log('📊 Backblaze B2 integration is working correctly');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.error('🔐 Authentication failed. Make sure the test user exists.');
    } else if (error.response?.status === 404) {
      console.error('🔗 Endpoint not found. Make sure the backend is running.');
    }
  }
}

// Run the test
console.log('================================');
console.log('Jobline File Upload Test');
console.log('================================\n');

testFileUpload();
