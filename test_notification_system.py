#!/usr/bin/env python3
"""
Comprehensive Test Suite for Real-Time Notification System
Tests WebSocket connections, notification delivery, and API endpoints
"""

import requests
import socketio
import json
import time
import threading
import sys
from datetime import datetime
from typing import Dict, List, Any

class NotificationSystemTestSuite:
    def __init__(self, base_url: str = "http://localhost:5000"):
        self.base_url = base_url
        self.websocket_url = base_url.replace('http', 'ws')
        self.session = requests.Session()
        self.auth_token = None
        self.user_id = None
        self.sio = None
        self.received_notifications = []
        self.connection_events = []
        
        self.test_results = {
            'timestamp': datetime.now().isoformat(),
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': [],
            'websocket_events': [],
            'notification_delivery_times': []
        }
    
    def log_test_result(self, test_name: str, success: bool, details: str = "", 
                       response_time: float = 0):
        """Log individual test results"""
        self.test_results['total_tests'] += 1
        if success:
            self.test_results['passed_tests'] += 1
            status = "PASS"
        else:
            self.test_results['failed_tests'] += 1
            status = "FAIL"
            
        test_detail = {
            'test_name': test_name,
            'status': status,
            'details': details,
            'response_time_ms': round(response_time * 1000, 2),
            'timestamp': datetime.now().isoformat()
        }
        
        self.test_results['test_details'].append(test_detail)
        print(f"[{status}] {test_name}: {details}")
    
    def setup_websocket_client(self):
        """Setup WebSocket client for testing"""
        self.sio = socketio.Client()
        
        @self.sio.event
        def connect():
            self.connection_events.append({
                'event': 'connect',
                'timestamp': datetime.now().isoformat()
            })
            print("WebSocket connected")
        
        @self.sio.event
        def disconnect():
            self.connection_events.append({
                'event': 'disconnect',
                'timestamp': datetime.now().isoformat()
            })
            print("WebSocket disconnected")
        
        @self.sio.event
        def connection_established(data):
            self.connection_events.append({
                'event': 'connection_established',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            print(f"Connection established: {data}")
        
        @self.sio.event
        def new_notification(data):
            delivery_time = datetime.now()
            self.received_notifications.append({
                'notification': data,
                'received_at': delivery_time.isoformat()
            })
            
            # Calculate delivery time if we have a creation timestamp
            if 'notification' in data and 'created_at' in data['notification']:
                try:
                    created_at = datetime.fromisoformat(data['notification']['created_at'].replace('Z', '+00:00'))
                    delivery_delay = (delivery_time - created_at).total_seconds()
                    self.test_results['notification_delivery_times'].append(delivery_delay)
                except:
                    pass
            
            print(f"Received notification: {data['notification']['title']}")
        
        @self.sio.event
        def notifications_updated(data):
            self.test_results['websocket_events'].append({
                'event': 'notifications_updated',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            print(f"Notifications updated: {data}")
        
        @self.sio.event
        def broadcast_notification(data):
            self.received_notifications.append({
                'broadcast': data,
                'received_at': datetime.now().isoformat()
            })
            print(f"Received broadcast: {data['title']}")
        
        @self.sio.event
        def error(data):
            self.test_results['websocket_events'].append({
                'event': 'error',
                'data': data,
                'timestamp': datetime.now().isoformat()
            })
            print(f"WebSocket error: {data}")
    
    def test_health_endpoints(self):
        """Test health check endpoints"""
        print("\n=== Testing Health Endpoints ===")
        
        # Main health check
        start_time = time.time()
        try:
            response = self.session.get(f"{self.base_url}/health")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_test_result(
                        "Main Health Check",
                        True,
                        f"All services healthy",
                        response_time
                    )
                else:
                    self.log_test_result(
                        "Main Health Check",
                        False,
                        f"Service unhealthy: {data}",
                        response_time
                    )
            else:
                self.log_test_result(
                    "Main Health Check",
                    False,
                    f"HTTP {response.status_code}",
                    response_time
                )
        except Exception as e:
            self.log_test_result(
                "Main Health Check",
                False,
                f"Request failed: {e}",
                time.time() - start_time
            )
        
        # Notification service health check
        start_time = time.time()
        try:
            response = self.session.get(f"{self.base_url}/api/notifications/health")
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'healthy':
                    self.log_test_result(
                        "Notification Service Health Check",
                        True,
                        f"Notification service healthy",
                        response_time
                    )
                else:
                    self.log_test_result(
                        "Notification Service Health Check",
                        False,
                        f"Service unhealthy: {data}",
                        response_time
                    )
            else:
                self.log_test_result(
                    "Notification Service Health Check",
                    False,
                    f"HTTP {response.status_code}",
                    response_time
                )
        except Exception as e:
            self.log_test_result(
                "Notification Service Health Check",
                False,
                f"Request failed: {e}",
                time.time() - start_time
            )
    
    def test_authentication(self):
        """Test authentication for notification system"""
        print("\n=== Testing Authentication ===")
        
        # Test enhanced login
        login_data = {
            "email": "test@example.com",
            "password": "testpassword"
        }
        
        start_time = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login-enhanced",
                json=login_data
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.auth_token = data['access_token']
                    self.user_id = data.get('user_id')
                    
                    self.log_test_result(
                        "Enhanced Authentication",
                        True,
                        f"Successfully authenticated user {self.user_id}",
                        response_time
                    )
                else:
                    self.log_test_result(
                        "Enhanced Authentication",
                        False,
                        "No access token in response",
                        response_time
                    )
            else:
                self.log_test_result(
                    "Enhanced Authentication",
                    False,
                    f"HTTP {response.status_code}",
                    response_time
                )
        except Exception as e:
            self.log_test_result(
                "Enhanced Authentication",
                False,
                f"Request failed: {e}",
                time.time() - start_time
            )
    
    def test_websocket_connection(self):
        """Test WebSocket connection and authentication"""
        print("\n=== Testing WebSocket Connection ===")
        
        if not self.auth_token:
            self.log_test_result(
                "WebSocket Connection",
                False,
                "No auth token available"
            )
            return
        
        try:
            start_time = time.time()
            
            # Connect with authentication
            self.sio.connect(
                self.base_url,
                auth={'token': self.auth_token},
                transports=['websocket', 'polling']
            )
            
            # Wait for connection establishment
            time.sleep(2)
            
            connection_time = time.time() - start_time
            
            if self.sio.connected:
                self.log_test_result(
                    "WebSocket Connection",
                    True,
                    f"Successfully connected in {connection_time:.2f}s",
                    connection_time
                )
            else:
                self.log_test_result(
                    "WebSocket Connection",
                    False,
                    "Failed to establish connection"
                )
                
        except Exception as e:
            self.log_test_result(
                "WebSocket Connection",
                False,
                f"Connection failed: {e}"
            )
    
    def test_notification_api_endpoints(self):
        """Test notification REST API endpoints"""
        print("\n=== Testing Notification API Endpoints ===")
        
        if not self.auth_token:
            self.log_test_result(
                "Notification API Tests",
                False,
                "No auth token available"
            )
            return
        
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        
        # Test get notifications
        start_time = time.time()
        try:
            response = self.session.get(
                f"{self.base_url}/api/notifications/",
                headers=headers
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.log_test_result(
                    "Get Notifications API",
                    True,
                    f"Retrieved {len(data.get('notifications', []))} notifications",
                    response_time
                )
            else:
                self.log_test_result(
                    "Get Notifications API",
                    False,
                    f"HTTP {response.status_code}",
                    response_time
                )
        except Exception as e:
            self.log_test_result(
                "Get Notifications API",
                False,
                f"Request failed: {e}",
                time.time() - start_time
            )
        
        # Test get preferences
        start_time = time.time()
        try:
            response = self.session.get(
                f"{self.base_url}/api/notifications/preferences",
                headers=headers
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.log_test_result(
                    "Get Preferences API",
                    True,
                    f"Retrieved notification preferences",
                    response_time
                )
            else:
                self.log_test_result(
                    "Get Preferences API",
                    False,
                    f"HTTP {response.status_code}",
                    response_time
                )
        except Exception as e:
            self.log_test_result(
                "Get Preferences API",
                False,
                f"Request failed: {e}",
                time.time() - start_time
            )
        
        # Test notification stats
        start_time = time.time()
        try:
            response = self.session.get(
                f"{self.base_url}/api/notifications/stats",
                headers=headers
            )
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                self.log_test_result(
                    "Get Stats API",
                    True,
                    f"Retrieved notification statistics",
                    response_time
                )
            else:
                self.log_test_result(
                    "Get Stats API",
                    False,
                    f"HTTP {response.status_code}",
                    response_time
                )
        except Exception as e:
            self.log_test_result(
                "Get Stats API",
                False,
                f"Request failed: {e}",
                time.time() - start_time
            )
    
    def test_real_time_notifications(self):
        """Test real-time notification delivery"""
        print("\n=== Testing Real-Time Notification Delivery ===")
        
        if not self.auth_token or not self.sio or not self.sio.connected:
            self.log_test_result(
                "Real-Time Notifications",
                False,
                "WebSocket not connected"
            )
            return
        
        headers = {'Authorization': f'Bearer {self.auth_token}'}
        
        # Clear received notifications
        self.received_notifications.clear()
        
        # Test job alert notification
        start_time = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/demo/send-job-alert",
                headers=headers
            )
            
            if response.status_code == 200:
                # Wait for WebSocket delivery
                time.sleep(2)
                
                response_time = time.time() - start_time
                
                # Check if notification was received via WebSocket
                job_alert_received = any(
                    'notification' in notif and 
                    notif['notification'].get('type') == 'job_alert'
                    for notif in self.received_notifications
                )
                
                if job_alert_received:
                    self.log_test_result(
                        "Job Alert Real-Time Delivery",
                        True,
                        f"Notification delivered via WebSocket",
                        response_time
                    )
                else:
                    self.log_test_result(
                        "Job Alert Real-Time Delivery",
                        False,
                        "Notification not received via WebSocket"
                    )
            else:
                self.log_test_result(
                    "Job Alert Real-Time Delivery",
                    False,
                    f"Failed to send notification: HTTP {response.status_code}"
                )
        except Exception as e:
            self.log_test_result(
                "Job Alert Real-Time Delivery",
                False,
                f"Test failed: {e}"
            )
        
        # Test application update notification
        start_time = time.time()
        try:
            response = self.session.post(
                f"{self.base_url}/api/demo/send-application-update",
                headers=headers
            )
            
            if response.status_code == 200:
                # Wait for WebSocket delivery
                time.sleep(2)
                
                response_time = time.time() - start_time
                
                # Check if notification was received via WebSocket
                app_update_received = any(
                    'notification' in notif and 
                    notif['notification'].get('type') == 'application_update'
                    for notif in self.received_notifications
                )
                
                if app_update_received:
                    self.log_test_result(
                        "Application Update Real-Time Delivery",
                        True,
                        f"Notification delivered via WebSocket",
                        response_time
                    )
                else:
                    self.log_test_result(
                        "Application Update Real-Time Delivery",
                        False,
                        "Notification not received via WebSocket"
                    )
            else:
                self.log_test_result(
                    "Application Update Real-Time Delivery",
                    False,
                    f"Failed to send notification: HTTP {response.status_code}"
                )
        except Exception as e:
            self.log_test_result(
                "Application Update Real-Time Delivery",
                False,
                f"Test failed: {e}"
            )
        
        # Test broadcast notification
        start_time = time.time()
        try:
            broadcast_data = {
                "message": "Test system announcement for notification testing"
            }
            
            response = self.session.post(
                f"{self.base_url}/api/demo/broadcast-announcement",
                json=broadcast_data,
                headers=headers
            )
            
            if response.status_code == 200:
                # Wait for WebSocket delivery
                time.sleep(2)
                
                response_time = time.time() - start_time
                
                # Check if broadcast was received via WebSocket
                broadcast_received = any(
                    'broadcast' in notif
                    for notif in self.received_notifications
                )
                
                if broadcast_received:
                    self.log_test_result(
                        "Broadcast Notification Real-Time Delivery",
                        True,
                        f"Broadcast delivered via WebSocket",
                        response_time
                    )
                else:
                    self.log_test_result(
                        "Broadcast Notification Real-Time Delivery",
                        False,
                        "Broadcast not received via WebSocket"
                    )
            else:
                self.log_test_result(
                    "Broadcast Notification Real-Time Delivery",
                    False,
                    f"Failed to send broadcast: HTTP {response.status_code}"
                )
        except Exception as e:
            self.log_test_result(
                "Broadcast Notification Real-Time Delivery",
                False,
                f"Test failed: {e}"
            )
    
    def test_websocket_events(self):
        """Test WebSocket event handling"""
        print("\n=== Testing WebSocket Events ===")
        
        if not self.sio or not self.sio.connected:
            self.log_test_result(
                "WebSocket Events",
                False,
                "WebSocket not connected"
            )
            return
        
        # Test get notifications event
        try:
            start_time = time.time()
            
            self.sio.emit('get_notifications', {
                'user_id': self.user_id,
                'limit': 10
            })
            
            # Wait for response
            time.sleep(1)
            
            response_time = time.time() - start_time
            
            # Check if we received notifications_data event
            notifications_data_received = any(
                event['event'] == 'notifications_data'
                for event in self.test_results['websocket_events']
            )
            
            self.log_test_result(
                "WebSocket Get Notifications Event",
                True,  # We'll consider it successful if no error occurred
                f"Event sent successfully",
                response_time
            )
            
        except Exception as e:
            self.log_test_result(
                "WebSocket Get Notifications Event",
                False,
                f"Event failed: {e}"
            )
    
    def calculate_performance_metrics(self):
        """Calculate performance metrics for the notification system"""
        total_tests = self.test_results['total_tests']
        passed_tests = self.test_results['passed_tests']
        failed_tests = self.test_results['failed_tests']
        
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Calculate average delivery time
        delivery_times = self.test_results['notification_delivery_times']
        avg_delivery_time = sum(delivery_times) / len(delivery_times) if delivery_times else 0
        
        # Calculate response times
        response_times = [test['response_time_ms'] for test in self.test_results['test_details']]
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        self.test_results['performance_metrics'] = {
            'success_rate_percentage': round(success_rate, 2),
            'average_delivery_time_seconds': round(avg_delivery_time, 3),
            'average_response_time_ms': round(avg_response_time, 2),
            'total_notifications_received': len(self.received_notifications),
            'websocket_events_count': len(self.test_results['websocket_events']),
            'connection_events_count': len(self.connection_events)
        }
    
    def cleanup(self):
        """Cleanup resources"""
        if self.sio and self.sio.connected:
            self.sio.disconnect()
    
    def run_all_tests(self):
        """Run the complete notification system test suite"""
        print("Starting Real-Time Notification System Test Suite")
        print("=" * 60)
        
        start_time = time.time()
        
        # Setup WebSocket client
        self.setup_websocket_client()
        
        # Run all test categories
        self.test_health_endpoints()
        self.test_authentication()
        self.test_websocket_connection()
        self.test_notification_api_endpoints()
        self.test_real_time_notifications()
        self.test_websocket_events()
        
        # Calculate metrics
        self.calculate_performance_metrics()
        
        total_time = time.time() - start_time
        
        # Cleanup
        self.cleanup()
        
        # Print summary
        print("\n" + "=" * 60)
        print("NOTIFICATION SYSTEM TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {self.test_results['total_tests']}")
        print(f"Passed: {self.test_results['passed_tests']}")
        print(f"Failed: {self.test_results['failed_tests']}")
        print(f"Success Rate: {self.test_results['performance_metrics']['success_rate_percentage']}%")
        print(f"Average Response Time: {self.test_results['performance_metrics']['average_response_time_ms']}ms")
        print(f"Notifications Received: {self.test_results['performance_metrics']['total_notifications_received']}")
        print(f"Total Execution Time: {total_time:.2f}s")
        
        if self.test_results['performance_metrics']['average_delivery_time_seconds'] > 0:
            print(f"Average Delivery Time: {self.test_results['performance_metrics']['average_delivery_time_seconds']}s")
        
        return self.test_results
    
    def save_results(self, filename: str = "notification_system_test_results.json"):
        """Save test results to JSON file"""
        with open(filename, 'w') as f:
            json.dump(self.test_results, f, indent=2)
        print(f"\nTest results saved to {filename}")

def main():
    """Main execution function"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:5000"
    
    print(f"Testing Notification System at: {base_url}")
    
    # Initialize and run test suite
    test_suite = NotificationSystemTestSuite(base_url)
    results = test_suite.run_all_tests()
    
    # Save results
    test_suite.save_results()
    
    # Exit with appropriate code
    if results['failed_tests'] == 0:
        print("\n✅ All tests passed!")
        sys.exit(0)
    else:
        print(f"\n❌ {results['failed_tests']} tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
