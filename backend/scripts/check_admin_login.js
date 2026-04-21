const API_URL = 'http://localhost:5000/api';

const checkAdminLogin = async () => {
    try {
        const username = 'superadmin_test';
        const password = 'Password123!';

        console.log(`Attempting login for ${username}...`);

        const res = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        console.log('Response:', data);

        if (res.ok && data.token) {
            console.log('SUCCESS: Admin Login working.');
        } else {
            console.error('FAILURE: Admin Login failed.');
        }

    } catch (err) {
        console.error('Test Error:', err);
    }
};

checkAdminLogin();
