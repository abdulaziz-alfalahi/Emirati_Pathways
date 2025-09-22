# Matching Performance Optimizer - Fixed Version
# This version fixes the decorator syntax error

import os
import time
import logging
from typing import Dict, List, Any, Optional, Callable
import json
from datetime import datetime, timedelta
from functools import wraps
import hashlib

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logging.warning("Redis not available. Using in-memory caching.")

import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MatchingPerformanceOptimizer:
    """Performance optimizer for job matching operations"""
    
    def __init__(self):
        """Initialize the performance optimizer"""
        logger.info("Initializing Matching Performance Optimizer...")
        
        # Setup cache
        self.setup_cache()
        
        # Performance metrics
        self.metrics = {
            'cache_operations': {
                'hits': 0,
                'misses': 0,
                'sets': 0,
                'errors': 0
            },
            'processing_times': {
                'total_operations': 0,
                'total_time': 0,
                'average_time': 0,
                'min_time': float('inf'),
                'max_time': 0
            },
            'batch_operations': {
                'total_batches': 0,
                'total_items': 0,
                'average_batch_size': 0,
                'processing_time': 0
            }
        }
        
        # Cache statistics
        self.cache_stats = {
            'total_entries': 0,
            'memory_usage': 0,
            'hit_rate': 0,
            'cleanup_operations': 0
        }
        
        logger.info("✅ Matching Performance Optimizer initialized")
    
    def setup_cache(self):
        """Setup Redis cache with fallback to in-memory"""
        try:
            if REDIS_AVAILABLE:
                redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
                self.cache = redis.from_url(redis_url, decode_responses=True)
                # Test connection
                self.cache.ping()
                self.cache_type = 'redis'
                logger.info("✅ Redis cache initialized for performance optimization")
            else:
                raise Exception("Redis not available")
                
        except Exception as e:
            logger.warning(f"Redis cache not available: {e}")
            # Fallback to in-memory cache
            self.cache = {}
            self.cache_type = 'memory'
            logger.info("✅ In-memory cache initialized for performance optimization")
    
    def performance_monitor(self, operation_type: str):
        """Decorator to monitor performance of operations"""
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                
                try:
                    result = func(*args, **kwargs)
                    
                    # Record successful operation
                    processing_time = time.time() - start_time
                    self._record_performance(operation_type, processing_time, True)
                    
                    return result
                    
                except Exception as e:
                    # Record failed operation
                    processing_time = time.time() - start_time
                    self._record_performance(operation_type, processing_time, False)
                    logger.error(f"Performance monitored operation failed: {e}")
                    raise
                    
            return wrapper
        return decorator
    
    def _record_performance(self, operation_type: str, processing_time: float, success: bool):
        """Record performance metrics"""
        metrics = self.metrics['processing_times']
        
        metrics['total_operations'] += 1
        metrics['total_time'] += processing_time
        metrics['average_time'] = metrics['total_time'] / metrics['total_operations']
        
        if processing_time < metrics['min_time']:
            metrics['min_time'] = processing_time
        if processing_time > metrics['max_time']:
            metrics['max_time'] = processing_time
    
    def get_cache_key(self, data: Dict, prefix: str = "match") -> str:
        """Generate cache key for data"""
        data_str = json.dumps(data, sort_keys=True)
        hash_obj = hashlib.md5(data_str.encode())
        return f"{prefix}:{hash_obj.hexdigest()}"
    
    def get_from_cache(self, cache_key: str) -> Optional[Dict]:
        """Get result from cache with performance tracking"""
        try:
            if self.cache_type == 'redis':
                result = self.cache.get(cache_key)
                if result:
                    self.metrics['cache_operations']['hits'] += 1
                    return json.loads(result)
                else:
                    self.metrics['cache_operations']['misses'] += 1
                    return None
            else:
                # In-memory cache with TTL check
                if cache_key in self.cache:
                    entry = self.cache[cache_key]
                    if time.time() - entry['timestamp'] < entry['ttl']:
                        self.metrics['cache_operations']['hits'] += 1
                        return entry['data']
                    else:
                        # Expired entry
                        del self.cache[cache_key]
                        self.metrics['cache_operations']['misses'] += 1
                        return None
                else:
                    self.metrics['cache_operations']['misses'] += 1
                    return None
                    
        except Exception as e:
            self.metrics['cache_operations']['errors'] += 1
            logger.warning(f"Cache get error: {e}")
            return None
    
    def set_cache(self, cache_key: str, result: Dict, ttl: int = 3600):
        """Set result in cache with performance tracking"""
        try:
            if self.cache_type == 'redis':
                self.cache.setex(cache_key, ttl, json.dumps(result))
            else:
                # In-memory cache with timestamp
                self.cache[cache_key] = {
                    'data': result,
                    'timestamp': time.time(),
                    'ttl': ttl
                }
            
            self.metrics['cache_operations']['sets'] += 1
            self.cache_stats['total_entries'] += 1
            
        except Exception as e:
            self.metrics['cache_operations']['errors'] += 1
            logger.warning(f"Cache set error: {e}")
    
    def batch_process(self, items: List[Dict], process_func: Callable, batch_size: int = 10) -> List[Dict]:
        """Process items in batches for better performance"""
        start_time = time.time()
        results = []
        
        # Process in batches
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            batch_results = []
            
            for item in batch:
                try:
                    result = process_func(item)
                    batch_results.append(result)
                except Exception as e:
                    logger.error(f"Batch processing error for item {i}: {e}")
                    batch_results.append({'error': str(e), 'success': False})
            
            results.extend(batch_results)
        
        # Record batch metrics
        processing_time = time.time() - start_time
        self.metrics['batch_operations']['total_batches'] += 1
        self.metrics['batch_operations']['total_items'] += len(items)
        self.metrics['batch_operations']['processing_time'] += processing_time
        self.metrics['batch_operations']['average_batch_size'] = (
            self.metrics['batch_operations']['total_items'] / 
            self.metrics['batch_operations']['total_batches']
        )
        
        return results
    
    def parallel_process(self, cv_list: List[Dict], jd_data: Dict, match_func: Callable) -> List[Dict]:
        """Process multiple CVs against a JD in parallel (simulated)"""
        start_time = time.time()
        
        # For now, process sequentially (can be enhanced with actual parallel processing)
        results = []
        
        for i, cv_data in enumerate(cv_list):
            try:
                # Check cache first
                cache_key = self.get_cache_key({
                    'cv': cv_data,
                    'jd': jd_data
                }, prefix="parallel_match")
                
                cached_result = self.get_from_cache(cache_key)
                if cached_result:
                    results.append(cached_result)
                    continue
                
                # Process match
                result = match_func(cv_data, jd_data)
                
                # Add metadata
                result['processing_metadata'] = result.get('processing_metadata', {})
                result['processing_metadata']['batch_index'] = i
                result['processing_metadata']['parallel_processed'] = True
                
                # Cache result
                self.set_cache(cache_key, result)
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Parallel processing error for CV {i}: {e}")
                results.append({
                    'success': False,
                    'error': str(e),
                    'processing_metadata': {
                        'batch_index': i,
                        'parallel_processed': True
                    }
                })
        
        processing_time = time.time() - start_time
        
        # Add batch processing metadata to all results
        for result in results:
            if 'processing_metadata' in result:
                result['processing_metadata']['total_batch_time'] = processing_time
                result['processing_metadata']['batch_size'] = len(cv_list)
        
        return results
    
    def optimize_cache(self):
        """Optimize cache by removing expired entries"""
        if self.cache_type == 'memory':
            current_time = time.time()
            expired_keys = []
            
            for key, entry in self.cache.items():
                if current_time - entry['timestamp'] > entry['ttl']:
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self.cache[key]
            
            self.cache_stats['cleanup_operations'] += 1
            logger.info(f"Cache optimization: removed {len(expired_keys)} expired entries")
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get comprehensive performance metrics"""
        # Calculate cache hit rate
        total_cache_ops = (
            self.metrics['cache_operations']['hits'] + 
            self.metrics['cache_operations']['misses']
        )
        
        if total_cache_ops > 0:
            hit_rate = (self.metrics['cache_operations']['hits'] / total_cache_ops) * 100
        else:
            hit_rate = 0
        
        self.cache_stats['hit_rate'] = round(hit_rate, 2)
        
        # Update cache statistics
        if self.cache_type == 'memory':
            self.cache_stats['total_entries'] = len(self.cache)
            # Estimate memory usage (rough calculation)
            self.cache_stats['memory_usage'] = len(str(self.cache))
        
        return {
            'cache_operations': self.metrics['cache_operations'],
            'processing_times': self.metrics['processing_times'],
            'batch_operations': self.metrics['batch_operations'],
            'cache_statistics': self.cache_stats,
            'cache_type': self.cache_type,
            'optimization_recommendations': self._get_optimization_recommendations()
        }
    
    def _get_optimization_recommendations(self) -> List[str]:
        """Get performance optimization recommendations"""
        recommendations = []
        
        # Cache hit rate recommendations
        if self.cache_stats['hit_rate'] < 50:
            recommendations.append("Consider increasing cache TTL or optimizing cache keys")
        
        # Processing time recommendations
        avg_time = self.metrics['processing_times']['average_time']
        if avg_time > 2.0:
            recommendations.append("Consider optimizing matching algorithms for better performance")
        
        # Batch size recommendations
        avg_batch_size = self.metrics['batch_operations']['average_batch_size']
        if avg_batch_size < 5:
            recommendations.append("Consider increasing batch size for better throughput")
        
        # Cache type recommendations
        if self.cache_type == 'memory' and self.cache_stats['total_entries'] > 1000:
            recommendations.append("Consider using Redis for better cache performance at scale")
        
        return recommendations
    
    def reset_metrics(self):
        """Reset all performance metrics"""
        self.metrics = {
            'cache_operations': {
                'hits': 0,
                'misses': 0,
                'sets': 0,
                'errors': 0
            },
            'processing_times': {
                'total_operations': 0,
                'total_time': 0,
                'average_time': 0,
                'min_time': float('inf'),
                'max_time': 0
            },
            'batch_operations': {
                'total_batches': 0,
                'total_items': 0,
                'average_batch_size': 0,
                'processing_time': 0
            }
        }
        
        self.cache_stats = {
            'total_entries': 0,
            'memory_usage': 0,
            'hit_rate': 0,
            'cleanup_operations': 0
        }
        
        logger.info("Performance metrics reset")

# Global instance
performance_optimizer = None

def get_performance_optimizer():
    """Get the global performance optimizer instance"""
    global performance_optimizer
    if performance_optimizer is None:
        performance_optimizer = MatchingPerformanceOptimizer()
    return performance_optimizer

# Initialize logging
logger.info("Matching Performance Optimizer module loaded")

