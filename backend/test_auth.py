import sys
sys.path.append('.')
try:
    from auth.auth_manager import AuthenticationManager
    print('✅ AuthenticationManager imported successfully')
    
    # Test creating an instance
    auth_manager = AuthenticationManager()
    print('✅ AuthenticationManager instance created')
    
    # Test with sample data
    test_data = {
        'email': 'test@example.com',
        'password': 'Password123!',
        'first_name': 'Test',
        'last_name': 'User',
        'phone': '+971501234567',
        'emirate': 'Dubai'
    }
    
    print('Testing registration...')
    result = auth_manager.register_user(test_data)
    print(f'Result: {result}')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()
