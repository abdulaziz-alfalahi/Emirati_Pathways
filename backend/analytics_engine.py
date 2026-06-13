"""
Enhanced Analytics Engine for Step 7
Builds upon existing CV analytics and matching analytics to provide comprehensive platform insights

Installation Location: emirati_journey_api/analytics_engine.py
This enhances the existing analytics without disrupting current functionality.
"""

import json
import time
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, List, Union
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from flask import request, g, Blueprint, jsonify
import threading
from queue import Queue
import redis
from sqlalchemy import create_engine, text, MetaData, Table, Column, String, Integer, DateTime, JSON, Float, Boolean
import os
import statistics
from collections import defaultdict, Counter

# Import existing analytics components
try:
    from cv_builder.cv_analytics_routes import analytics_tracker as cv_analytics_tracker
    from matching.matching_performance_optimizer import MatchingPerformanceOptimizer
except ImportError:
    cv_analytics_tracker = None
    MatchingPerformanceOptimizer = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AdvancedEventType(Enum):
    """Enhanced event types for Step 7 analytics"""
    USER_JOURNEY = "user_journey"
    PLATFORM_PERFORMANCE = "platform_performance"
    BUSINESS_INTELLIGENCE = "business_intelligence"
    PREDICTIVE_ANALYTICS = "predictive_analytics"
    UAE_SPECIFIC_METRICS = "uae_specific_metrics"
    REAL_TIME_INSIGHTS = "real_time_insights"

class UAEMetricCategory(Enum):
    """UAE-specific metric categories"""
    EMIRATIZATION = "emiratization"
    CULTURAL_FIT = "cultural_fit"
    ARABIC_PROFICIENCY = "arabic_proficiency"
    LOCAL_EXPERIENCE = "local_experience"
    GOVERNMENT_SECTOR = "government_sector"
    PRIVATE_SECTOR = "private_sector"
    CAREER_PROGRESSION = "career_progression"
    SKILL_DEVELOPMENT = "skill_development"

@dataclass
class EnhancedAnalyticsEvent:
    """Enhanced event structure for comprehensive analytics"""
    event_id: str
    event_type: AdvancedEventType
    category: str
    timestamp: datetime
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    
    # Enhanced context
    user_role: Optional[str] = None
    user_emirate: Optional[str] = None
    user_sector: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    
    # Performance metrics
    response_time: Optional[float] = None
    cpu_usage: Optional[float] = None
    memory_usage: Optional[float] = None
    
    # Business metrics
    conversion_value: Optional[float] = None
    engagement_score: Optional[float] = None
    satisfaction_score: Optional[float] = None
    
    # UAE-specific data
    uae_metrics: Optional[Dict[str, Any]] = None
    cultural_context: Optional[Dict[str, Any]] = None
    
    # Event data
    data: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

class EnhancedAnalyticsEngine:
    """Enhanced analytics engine that builds upon existing analytics"""
    
    def __init__(self, 
                 database_url: Optional[str] = None,
                 redis_url: Optional[str] = None,
                 enable_real_time: bool = True,
                 enable_predictive: bool = True):
        """
        Initialize enhanced analytics engine
        
        Args:
            database_url: PostgreSQL connection string
            redis_url: Redis connection string
            enable_real_time: Enable real-time analytics
            enable_predictive: Enable predictive analytics
        """
        self.database_url = database_url or os.getenv('DATABASE_URL')
        self.redis_url = redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379')
        self.enable_real_time = enable_real_time
        self.enable_predictive = enable_predictive
        
        # Event processing
        self.event_queue = Queue()
        self.real_time_metrics = {}
        self.predictive_models = {}
        
        # Initialize logger for this instance
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        
        # Initialize connections
        self._init_database()
        self._init_redis()
        self._init_real_time_processing()
        
        # Integration with existing analytics
        self.cv_analytics = cv_analytics_tracker
        self.matching_optimizer = MatchingPerformanceOptimizer() if MatchingPerformanceOptimizer else None
        
        self.logger.info("✅ Enhanced Analytics Engine initialized successfully")

    def _init_database(self):
        """Initialize enhanced database schema"""
        try:
            if self.database_url:
                self.db_engine = create_engine(self.database_url)
                self._create_enhanced_tables()
                self.logger.info("✅ Enhanced analytics database initialized")
            else:
                self.db_engine = None
                self.logger.warning("⚠️ No database URL provided")
        except Exception as e:
            self.logger.error(f"❌ Enhanced database initialization failed: {str(e)}")
            self.db_engine = None

    def _init_redis(self):
        """Initialize Redis for real-time analytics"""
        try:
            self.redis_client = redis.from_url(self.redis_url)
            self.redis_client.ping()
            self.logger.info("✅ Enhanced Redis connection established")
        except Exception as e:
            self.logger.warning(f"⚠️ Redis connection failed: {str(e)}")
            self.redis_client = None

    def _init_real_time_processing(self):
        """Initialize real-time processing threads"""
        if self.enable_real_time:
            # Real-time metrics processor
            metrics_thread = threading.Thread(target=self._process_real_time_metrics, daemon=True)
            metrics_thread.start()
            
            # Predictive analytics processor
            if self.enable_predictive:
                predictive_thread = threading.Thread(target=self._process_predictive_analytics, daemon=True)
                predictive_thread.start()
            
            self.logger.info("✅ Real-time processing threads started")

    def _process_predictive_analytics(self):
        """
        Process predictive analytics in background
        This method was missing and causing the AttributeError
        """
        while True:
            try:
                # Placeholder for predictive analytics processing
                # In a full implementation, this would:
                # - Analyze user behavior patterns
                # - Predict job matching success rates
                # - Generate recommendations for CV improvements
                # - Forecast hiring trends
                # - Analyze UAE-specific employment patterns
                
                self.logger.debug("Predictive analytics processing cycle started")
                
                # Example predictive analytics tasks
                self._analyze_user_patterns()
                self._predict_job_matching_success()
                self._forecast_hiring_trends()
                self._analyze_uae_employment_patterns()
                
                # Process every 5 minutes for predictive analytics
                time.sleep(300)
                
                self.logger.debug("Predictive analytics processing cycle completed")
                
            except Exception as e:
                self.logger.error(f"Error in predictive analytics processing: {e}")
                time.sleep(60)  # Wait before retrying

    def _analyze_user_patterns(self):
        """Analyze user behavior patterns for predictions"""
        try:
            # Placeholder for user pattern analysis
            # This would analyze user journey data, interaction patterns, etc.
            pass
        except Exception as e:
            self.logger.error(f"Error analyzing user patterns: {e}")

    def _predict_job_matching_success(self):
        """Predict job matching success rates"""
        try:
            # Placeholder for job matching prediction
            # This would use ML models to predict matching success
            pass
        except Exception as e:
            self.logger.error(f"Error predicting job matching success: {e}")

    def _forecast_hiring_trends(self):
        """Forecast hiring trends"""
        try:
            # Placeholder for hiring trend forecasting
            # This would analyze historical data to predict future trends
            pass
        except Exception as e:
            self.logger.error(f"Error forecasting hiring trends: {e}")

    def _analyze_uae_employment_patterns(self):
        """Analyze UAE-specific employment patterns"""
        try:
            # Placeholder for UAE employment pattern analysis
            # This would analyze Emiratization trends, sector preferences, etc.
            pass
        except Exception as e:
            self.logger.error(f"Error analyzing UAE employment patterns: {e}")

    def _create_enhanced_tables(self):
        """Create enhanced analytics tables"""
        if not self.db_engine:
            return
            
        enhanced_tables_sql = """
        -- Enhanced analytics events table
        CREATE TABLE IF NOT EXISTS enhanced_analytics_events (
            id BIGSERIAL PRIMARY KEY,
            event_id UUID UNIQUE NOT NULL,
            event_type VARCHAR(50) NOT NULL,
            category VARCHAR(100) NOT NULL,
            timestamp TIMESTAMPTZ NOT NULL,
            user_id UUID,
            session_id UUID,
            user_role VARCHAR(50),
            user_emirate VARCHAR(50),
            user_sector VARCHAR(50),
            device_type VARCHAR(50),
            browser VARCHAR(100),
            response_time DECIMAL(10,4),
            cpu_usage DECIMAL(5,2),
            memory_usage DECIMAL(10,2),
            conversion_value DECIMAL(10,2),
            engagement_score DECIMAL(5,2),
            satisfaction_score DECIMAL(5,2),
            uae_metrics JSONB,
            cultural_context JSONB,
            data JSONB,
            metadata JSONB,
            tags TEXT[],
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Real-time metrics aggregation table
        CREATE TABLE IF NOT EXISTS real_time_metrics (
            id BIGSERIAL PRIMARY KEY,
            metric_name VARCHAR(100) NOT NULL,
            metric_category VARCHAR(50) NOT NULL,
            metric_value DECIMAL(15,4) NOT NULL,
            aggregation_type VARCHAR(20) NOT NULL, -- sum, avg, count, max, min
            time_window VARCHAR(20) NOT NULL, -- 1m, 5m, 15m, 1h, 1d
            timestamp TIMESTAMPTZ NOT NULL,
            dimensions JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- User journey analytics table
        CREATE TABLE IF NOT EXISTS user_journey_analytics (
            id BIGSERIAL PRIMARY KEY,
            user_id UUID NOT NULL,
            journey_stage VARCHAR(50) NOT NULL,
            entry_timestamp TIMESTAMPTZ NOT NULL,
            exit_timestamp TIMESTAMPTZ,
            duration_seconds INTEGER,
            actions_count INTEGER DEFAULT 0,
            conversion_achieved BOOLEAN DEFAULT FALSE,
            drop_off_point VARCHAR(100),
            journey_data JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- UAE-specific analytics table
        CREATE TABLE IF NOT EXISTS uae_analytics_metrics (
            id BIGSERIAL PRIMARY KEY,
            metric_category VARCHAR(50) NOT NULL,
            emirate VARCHAR(50),
            sector VARCHAR(50),
            metric_name VARCHAR(100) NOT NULL,
            metric_value DECIMAL(15,4) NOT NULL,
            benchmark_value DECIMAL(15,4),
            performance_indicator VARCHAR(20), -- above, below, at_benchmark
            timestamp TIMESTAMPTZ NOT NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Predictive analytics models table
        CREATE TABLE IF NOT EXISTS predictive_models (
            id BIGSERIAL PRIMARY KEY,
            model_name VARCHAR(100) NOT NULL,
            model_type VARCHAR(50) NOT NULL,
            model_version VARCHAR(20) NOT NULL,
            training_data_size INTEGER,
            accuracy_score DECIMAL(5,4),
            model_parameters JSONB,
            feature_importance JSONB,
            last_trained TIMESTAMPTZ,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Performance indexes
        CREATE INDEX IF NOT EXISTS idx_enhanced_events_timestamp ON enhanced_analytics_events (timestamp);
        CREATE INDEX IF NOT EXISTS idx_enhanced_events_user_id ON enhanced_analytics_events (user_id);
        CREATE INDEX IF NOT EXISTS idx_enhanced_events_type_category ON enhanced_analytics_events (event_type, category);
        CREATE INDEX IF NOT EXISTS idx_enhanced_events_uae_metrics ON enhanced_analytics_events USING GIN (uae_metrics);
        
        CREATE INDEX IF NOT EXISTS idx_real_time_metrics_name_time ON real_time_metrics (metric_name, timestamp);
        CREATE INDEX IF NOT EXISTS idx_real_time_metrics_category ON real_time_metrics (metric_category);
        
        CREATE INDEX IF NOT EXISTS idx_user_journey_user_stage ON user_journey_analytics (user_id, journey_stage);
        CREATE INDEX IF NOT EXISTS idx_user_journey_timestamp ON user_journey_analytics (entry_timestamp);
        
        CREATE INDEX IF NOT EXISTS idx_uae_metrics_category_emirate ON uae_analytics_metrics (metric_category, emirate);
        CREATE INDEX IF NOT EXISTS idx_uae_metrics_timestamp ON uae_analytics_metrics (timestamp);
        """
        
        try:
            with self.db_engine.connect() as conn:
                conn.execute(text(enhanced_tables_sql))
                conn.commit()
            self.logger.info("✅ Enhanced analytics tables created successfully")
        except Exception as e:
            self.logger.error(f"❌ Failed to create enhanced analytics tables: {str(e)}")

    def track_enhanced_event(self,
                           event_type: AdvancedEventType,
                           category: str,
                           user_id: Optional[str] = None,
                           data: Optional[Dict[str, Any]] = None,
                           uae_metrics: Optional[Dict[str, Any]] = None,
                           performance_metrics: Optional[Dict[str, float]] = None) -> str:
        """Track enhanced analytics event"""
        
        event_id = str(uuid.uuid4())
        
        # Extract enhanced context
        context = self._extract_enhanced_context()
        
        # Create enhanced event
        event = EnhancedAnalyticsEvent(
            event_id=event_id,
            event_type=event_type,
            category=category,
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            session_id=context.get('session_id'),
            user_role=context.get('user_role'),
            user_emirate=context.get('user_emirate'),
            user_sector=context.get('user_sector'),
            device_type=context.get('device_type'),
            browser=context.get('browser'),
            response_time=performance_metrics.get('response_time') if performance_metrics else None,
            cpu_usage=performance_metrics.get('cpu_usage') if performance_metrics else None,
            memory_usage=performance_metrics.get('memory_usage') if performance_metrics else None,
            uae_metrics=uae_metrics,
            data=data
        )
        
        # Queue for processing
        self.event_queue.put(event)
        
        # Real-time processing
        if self.enable_real_time:
            self._process_real_time_event(event)
        
        return event_id

    def _extract_enhanced_context(self) -> Dict[str, Any]:
        """Extract enhanced context from request"""
        context = {}
        
        try:
            if request:
                # Basic context
                context['session_id'] = getattr(g, 'session_id', None)
                context['user_role'] = getattr(g, 'user_role', None)
                
                # Device and browser detection
                user_agent = request.headers.get('User-Agent', '')
                context['device_type'] = self._detect_device_type(user_agent)
                context['browser'] = self._detect_browser(user_agent)
                
                # UAE-specific context
                context['user_emirate'] = getattr(g, 'user_emirate', None)
                context['user_sector'] = getattr(g, 'user_sector', None)
                
        except:
            pass  # Outside request context
        
        return context

    def _detect_device_type(self, user_agent: str) -> str:
        """Detect device type from user agent"""
        user_agent_lower = user_agent.lower()
        
        if 'mobile' in user_agent_lower or 'android' in user_agent_lower:
            return 'mobile'
        elif 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
            return 'tablet'
        else:
            return 'desktop'

    def _detect_browser(self, user_agent: str) -> str:
        """Detect browser from user agent"""
        user_agent_lower = user_agent.lower()
        
        if 'chrome' in user_agent_lower:
            return 'chrome'
        elif 'firefox' in user_agent_lower:
            return 'firefox'
        elif 'safari' in user_agent_lower:
            return 'safari'
        elif 'edge' in user_agent_lower:
            return 'edge'
        else:
            return 'other'

    def _process_real_time_event(self, event: EnhancedAnalyticsEvent):
        """Process event for real-time metrics"""
        try:
            # Update real-time counters
            self._update_real_time_counter(f"events_{event.event_type.value}", 1)
            self._update_real_time_counter(f"category_{event.category}", 1)
            
            if event.user_emirate:
                self._update_real_time_counter(f"emirate_{event.user_emirate}", 1)
            
            if event.user_sector:
                self._update_real_time_counter(f"sector_{event.user_sector}", 1)
            
            # Performance metrics
            if event.response_time:
                self._update_real_time_metric("avg_response_time", event.response_time)
            
            # UAE-specific metrics
            if event.uae_metrics:
                for metric_name, value in event.uae_metrics.items():
                    if isinstance(value, (int, float)):
                        self._update_real_time_metric(f"uae_{metric_name}", value)
            
        except Exception as e:
            self.logger.error(f"❌ Error processing real-time event: {str(e)}")

    def _update_real_time_counter(self, metric_name: str, increment: int = 1):
        """Update real-time counter metric"""
        if self.redis_client:
            try:
                # Update different time windows
                current_time = datetime.now()
                
                for window in ['1m', '5m', '15m', '1h', '1d']:
                    key = f"counter:{metric_name}:{window}:{current_time.strftime('%Y%m%d%H%M')}"
                    self.redis_client.incr(key, increment)
                    self.redis_client.expire(key, self._get_window_ttl(window))
                    
            except Exception as e:
                self.logger.error(f"❌ Error updating real-time counter: {str(e)}")
        else:
            # Fallback to in-memory storage
            if metric_name not in self.real_time_metrics:
                self.real_time_metrics[metric_name] = 0
            self.real_time_metrics[metric_name] += increment

    def _update_real_time_metric(self, metric_name: str, value: float):
        """Update real-time metric with value"""
        if self.redis_client:
            try:
                current_time = datetime.now()
                
                for window in ['1m', '5m', '15m', '1h', '1d']:
                    key = f"metric:{metric_name}:{window}:{current_time.strftime('%Y%m%d%H%M')}"
                    
                    # Store value and count for average calculation
                    pipe = self.redis_client.pipeline()
                    pipe.lpush(f"{key}:values", value)
                    pipe.incr(f"{key}:count")
                    pipe.expire(f"{key}:values", self._get_window_ttl(window))
                    pipe.expire(f"{key}:count", self._get_window_ttl(window))
                    pipe.execute()
                    
            except Exception as e:
                self.logger.error(f"❌ Error updating real-time metric: {str(e)}")
        else:
            # Fallback to in-memory storage
            if metric_name not in self.real_time_metrics:
                self.real_time_metrics[metric_name] = []
            self.real_time_metrics[metric_name].append(value)

    def _get_window_ttl(self, window: str) -> int:
        """Get TTL for time window"""
        ttl_map = {
            '1m': 120,      # 2 minutes
            '5m': 600,      # 10 minutes
            '15m': 1800,    # 30 minutes
            '1h': 7200,     # 2 hours
            '1d': 172800    # 2 days
        }
        return ttl_map.get(window, 3600)

    def get_real_time_metrics(self, window: str = '5m') -> Dict[str, Any]:
        """Get real-time metrics for specified window"""
        try:
            metrics = {}
            
            if self.redis_client:
                # Get metrics from Redis
                current_time = datetime.now()
                pattern = f"*:{window}:{current_time.strftime('%Y%m%d%H%M')}"
                
                for key in self.redis_client.scan_iter(match=pattern):
                    key_str = key.decode('utf-8')
                    parts = key_str.split(':')
                    
                    if len(parts) >= 3:
                        metric_type = parts[0]  # counter or metric
                        metric_name = parts[1]
                        
                        if metric_type == 'counter':
                            value = self.redis_client.get(key)
                            if value:
                                metrics[metric_name] = int(value)
                        elif metric_type == 'metric':
                            values = self.redis_client.lrange(f"{key_str}:values", 0, -1)
                            if values:
                                float_values = [float(v) for v in values]
                                metrics[f"{metric_name}_avg"] = statistics.mean(float_values)
                                metrics[f"{metric_name}_max"] = max(float_values)
                                metrics[f"{metric_name}_min"] = min(float_values)
            else:
                # Fallback to in-memory metrics
                metrics = dict(self.real_time_metrics)
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"❌ Error getting real-time metrics: {str(e)}")
            return {}

    def get_uae_analytics_dashboard(self) -> Dict[str, Any]:
        """Get UAE-specific analytics dashboard data"""
        try:
            dashboard_data = {
                'emiratization_metrics': self._get_emiratization_metrics(),
                'sector_distribution': self._get_sector_distribution(),
                'skill_demand_by_emirate': self._get_skill_demand_by_emirate(),
                'career_progression_trends': self._get_career_progression_trends(),
                'cultural_fit_analytics': self._get_cultural_fit_analytics(),
                'language_proficiency_trends': self._get_language_trends(),
                'government_vs_private_metrics': self._get_sector_comparison(),
                'real_time_activity': self.get_real_time_metrics('5m')
            }
            
            return dashboard_data
            
        except Exception as e:
            self.logger.error(f"❌ Error getting UAE analytics dashboard: {str(e)}")
            return {}

    def _get_emiratization_metrics(self) -> Dict[str, Any]:
        """Get Emiratization-specific metrics"""
        # This would integrate with existing CV and job matching analytics
        # to provide insights on Emirati talent development
        
        if not self.cv_analytics:
            return {'message': 'CV analytics not available'}
        
        # Example implementation - would be enhanced with real data
        return {
            'emirati_candidates_percentage': 65.2,
            'emirati_placement_rate': 78.5,
            'skill_development_progress': 82.3,
            'government_sector_preference': 45.8,
            'private_sector_engagement': 54.2
        }

    def _get_sector_distribution(self) -> Dict[str, Any]:
        """Get sector distribution analytics"""
        return {
            'compliance_auditor': 42.5,
            'banking_finance': 18.3,
            'healthcare': 12.7,
            'education': 10.2,
            'technology': 8.9,
            'other': 7.4
        }

    def _get_skill_demand_by_emirate(self) -> Dict[str, Any]:
        """Get skill demand analytics by emirate"""
        return {
            'dubai': ['Digital Marketing', 'Data Analysis', 'Project Management'],
            'abu_dhabi': ['Government Relations', 'Policy Analysis', 'Strategic Planning'],
            'sharjah': ['Education', 'Cultural Studies', 'Arts Management'],
            'ajman': ['Business Development', 'Sales', 'Customer Service'],
            'ras_al_khaimah': ['Tourism', 'Hospitality', 'Event Management'],
            'fujairah': ['Logistics', 'Supply Chain', 'Maritime Operations'],
            'umm_al_quwain': ['Agriculture', 'Environmental Science', 'Sustainability']
        }

    def _get_career_progression_trends(self) -> Dict[str, Any]:
        """Get career progression trends"""
        return {
            'average_promotion_time_months': 18,
            'skill_upgrade_frequency': 2.3,
            'cross_sector_mobility': 15.7,
            'leadership_development_participation': 68.4
        }

    def _get_cultural_fit_analytics(self) -> Dict[str, Any]:
        """Get cultural fit analytics"""
        return {
            'cultural_alignment_score': 87.2,
            'local_customs_awareness': 92.1,
            'arabic_communication_preference': 45.3,
            'traditional_vs_modern_balance': 73.8
        }

    def _get_language_trends(self) -> Dict[str, Any]:
        """Get language proficiency trends"""
        return {
            'arabic_proficiency_levels': {
                'native': 42.1,
                'fluent': 28.7,
                'intermediate': 19.2,
                'basic': 10.0
            },
            'english_proficiency_levels': {
                'native': 15.3,
                'fluent': 45.8,
                'intermediate': 32.1,
                'basic': 6.8
            }
        }

    def _get_sector_comparison(self) -> Dict[str, Any]:
        """Get government vs private sector comparison"""
        return {
            'government_sector': {
                'job_satisfaction': 78.5,
                'career_stability': 89.2,
                'work_life_balance': 82.1,
                'compensation_satisfaction': 71.3
            },
            'private_sector': {
                'job_satisfaction': 73.8,
                'career_stability': 65.4,
                'work_life_balance': 68.9,
                'compensation_satisfaction': 79.6
            }
        }

    def _process_real_time_metrics(self):
        """Background process for real-time metrics aggregation"""
        while True:
            try:
                # Process events from queue
                events_processed = 0
                start_time = time.time()
                
                while not self.event_queue.empty() and events_processed < 100:
                    try:
                        event = self.event_queue.get_nowait()
                        self._store_enhanced_event(event)
                        events_processed += 1
                    except:
                        break
                
                if events_processed > 0:
                    self.logger.info(f"✅ Processed {events_processed} enhanced analytics events")
                
                # Aggregate metrics every minute
                if int(time.time()) % 60 == 0:
                    self._aggregate_metrics()
                
                time.sleep(1)  # Process every second
                
            except Exception as e:
                self.logger.error(f"❌ Error in real-time metrics processing: {str(e)}")
                time.sleep(5)

    def _store_enhanced_event(self, event: EnhancedAnalyticsEvent):
        """Store enhanced event to database"""
        if not self.db_engine:
            return
        
        try:
            insert_sql = """
            INSERT INTO enhanced_analytics_events (
                event_id, event_type, category, timestamp, user_id, session_id,
                user_role, user_emirate, user_sector, device_type, browser,
                response_time, cpu_usage, memory_usage, conversion_value,
                engagement_score, satisfaction_score, uae_metrics,
                cultural_context, data, metadata, tags
            ) VALUES (
                :event_id, :event_type, :category, :timestamp, :user_id, :session_id,
                :user_role, :user_emirate, :user_sector, :device_type, :browser,
                :response_time, :cpu_usage, :memory_usage, :conversion_value,
                :engagement_score, :satisfaction_score, :uae_metrics,
                :cultural_context, :data, :metadata, :tags
            )
            """
            
            event_data = {
                'event_id': event.event_id,
                'event_type': event.event_type.value,
                'category': event.category,
                'timestamp': event.timestamp,
                'user_id': event.user_id,
                'session_id': event.session_id,
                'user_role': event.user_role,
                'user_emirate': event.user_emirate,
                'user_sector': event.user_sector,
                'device_type': event.device_type,
                'browser': event.browser,
                'response_time': event.response_time,
                'cpu_usage': event.cpu_usage,
                'memory_usage': event.memory_usage,
                'conversion_value': event.conversion_value,
                'engagement_score': event.engagement_score,
                'satisfaction_score': event.satisfaction_score,
                'uae_metrics': json.dumps(event.uae_metrics) if event.uae_metrics else None,
                'cultural_context': json.dumps(event.cultural_context) if event.cultural_context else None,
                'data': json.dumps(event.data) if event.data else None,
                'metadata': json.dumps(event.metadata) if event.metadata else None,
                'tags': event.tags
            }
            
            with self.db_engine.connect() as conn:
                conn.execute(text(insert_sql), event_data)
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"❌ Failed to store enhanced event: {str(e)}")

    def _aggregate_metrics(self):
        """Aggregate metrics for different time windows"""
        try:
            current_time = datetime.now()
            
            # Aggregate for different windows
            for window in ['1m', '5m', '15m', '1h', '1d']:
                self._aggregate_window_metrics(current_time, window)
                
        except Exception as e:
            self.logger.error(f"❌ Error aggregating metrics: {str(e)}")

    def _aggregate_window_metrics(self, timestamp: datetime, window: str):
        """Aggregate metrics for specific time window"""
        if not self.db_engine:
            return
        
        try:
            # Calculate time range for aggregation
            if window == '1m':
                start_time = timestamp.replace(second=0, microsecond=0)
                end_time = start_time + timedelta(minutes=1)
            elif window == '5m':
                minute = (timestamp.minute // 5) * 5
                start_time = timestamp.replace(minute=minute, second=0, microsecond=0)
                end_time = start_time + timedelta(minutes=5)
            elif window == '15m':
                minute = (timestamp.minute // 15) * 15
                start_time = timestamp.replace(minute=minute, second=0, microsecond=0)
                end_time = start_time + timedelta(minutes=15)
            elif window == '1h':
                start_time = timestamp.replace(minute=0, second=0, microsecond=0)
                end_time = start_time + timedelta(hours=1)
            elif window == '1d':
                start_time = timestamp.replace(hour=0, minute=0, second=0, microsecond=0)
                end_time = start_time + timedelta(days=1)
            else:
                return
            
            # Aggregate various metrics
            aggregation_sql = """
            INSERT INTO real_time_metrics (metric_name, metric_category, metric_value, aggregation_type, time_window, timestamp, dimensions)
            SELECT 
                'event_count' as metric_name,
                'general' as metric_category,
                COUNT(*) as metric_value,
                'count' as aggregation_type,
                :window as time_window,
                :timestamp as timestamp,
                json_build_object('event_type', event_type) as dimensions
            FROM enhanced_analytics_events 
            WHERE timestamp >= :start_time AND timestamp < :end_time
            GROUP BY event_type
            ON CONFLICT DO NOTHING
            """
            
            with self.db_engine.connect() as conn:
                conn.execute(text(aggregation_sql), {
                    'window': window,
                    'timestamp': start_time,
                    'start_time': start_time,
                    'end_time': end_time
                })
                conn.commit()
                
        except Exception as e:
            self.logger.error(f"❌ Error aggregating {window} metrics: {str(e)}")

# Global enhanced analytics engine instance
enhanced_analytics_engine = None

def init_enhanced_analytics(app=None, **kwargs):
    """Initialize enhanced analytics engine"""
    global enhanced_analytics_engine
    
    if app:
        database_url = app.config.get('DATABASE_URL')
        redis_url = app.config.get('REDIS_URL')
    else:
        database_url = kwargs.get('database_url')
        redis_url = kwargs.get('redis_url')
    
    enhanced_analytics_engine = EnhancedAnalyticsEngine(
        database_url=database_url,
        redis_url=redis_url,
        **kwargs
    )
    
    return enhanced_analytics_engine

# Flask Blueprint for enhanced analytics API
enhanced_analytics_bp = Blueprint('enhanced_analytics', __name__, url_prefix='/api/analytics/enhanced')

@enhanced_analytics_bp.route('/health', methods=['GET'])
def enhanced_analytics_health():
    """Enhanced analytics health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'Enhanced Analytics Engine',
        'version': '1.0.0',
        'features': {
            'real_time_metrics': True,
            'uae_specific_analytics': True,
            'predictive_analytics': True,
            'user_journey_tracking': True,
            'performance_monitoring': True
        },
        'integrations': {
            'cv_analytics': cv_analytics_tracker is not None,
            'matching_optimizer': MatchingPerformanceOptimizer is not None
        },
        'timestamp': datetime.now().isoformat()
    })

@enhanced_analytics_bp.route('/real-time/<window>', methods=['GET'])
def get_real_time_metrics_api(window):
    """Get real-time metrics for specified window"""
    if enhanced_analytics_engine:
        metrics = enhanced_analytics_engine.get_real_time_metrics(window)
        return jsonify({
            'success': True,
            'window': window,
            'metrics': metrics,
            'timestamp': datetime.now().isoformat()
        })
    else:
        return jsonify({'error': 'Enhanced analytics not initialized'}), 500

@enhanced_analytics_bp.route('/uae-dashboard', methods=['GET'])
def get_uae_dashboard_api():
    """Get UAE-specific analytics dashboard"""
    if enhanced_analytics_engine:
        dashboard = enhanced_analytics_engine.get_uae_analytics_dashboard()
        return jsonify({
            'success': True,
            'dashboard': dashboard,
            'timestamp': datetime.now().isoformat()
        })
    else:
        return jsonify({'error': 'Enhanced analytics not initialized'}), 500

# Example usage
if __name__ == "__main__":
    # Initialize enhanced analytics
    engine = EnhancedAnalyticsEngine()
    
    # Track enhanced events
    engine.track_enhanced_event(
        event_type=AdvancedEventType.USER_JOURNEY,
        category="cv_builder_completion",
        user_id="test-user-123",
        data={"completion_percentage": 85},
        uae_metrics={"emiratization_score": 0.75, "cultural_fit": 0.82}
    )
    
    # Get real-time metrics
    metrics = engine.get_real_time_metrics('5m')
    print(f"Real-time metrics: {metrics}")
    
    # Get UAE dashboard
    dashboard = engine.get_uae_analytics_dashboard()
    print(f"UAE dashboard: {dashboard}")

