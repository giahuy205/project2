fetch('http://localhost:8080/api/categorys', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({ name: 'TestCat', taxRate: 0.1, note: '' })
}).then(async res => console.log('Status:', res.status, await res.text())).catch(err => console.log('Error:', err.message));
