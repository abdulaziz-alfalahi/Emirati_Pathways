#!/usr/bin/env python3
"""
AI Enhancement Demo for Educational Content
Demonstrates Gemini 2.5 Pro integration for educational opportunities
"""

import requests
import json
import time
from typing import Dict, Any

# Demo configuration
API_BASE = "http://localhost:5003"
DEMO_TOKEN = "demo-token-12345"

def print_header(title: str):
    """Print formatted header"""
    print("\n" + "="*80)
    print(f"🎯 {title}")
    print("="*80)

def print_section(title: str):
    """Print formatted section"""
    print(f"\n🔹 {title}")
    print("-" * 60)

def make_request(endpoint: str, method: str = "GET", data: Dict = None) -> Dict[Any, Any]:
    """Make API request with error handling"""
    url = f"{API_BASE}{endpoint}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEMO_TOKEN}"
    }
    
    try:
        if method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=30)
        else:
            response = requests.get(url, headers=headers, timeout=30)
        
        return {
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "data": response.json() if response.content else {}
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "data": {}
        }

def demo_educational_types():
    """Demo 1: Show available educational opportunity types"""
    print_header("DEMO 1: EDUCATIONAL OPPORTUNITY TYPES")
    
    result = make_request("/api/educational/types")
    
    if result["success"]:
        types = result["data"].get("educational_types", [])
        print(f"✅ Found {len(types)} educational opportunity types:")
        
        for i, edu_type in enumerate(types[:8], 1):  # Show first 8
            print(f"  {i}. {edu_type['label']} ({edu_type['value']})")
            print(f"     📝 {edu_type['description']}")
            print(f"     🎯 Target: {edu_type.get('target_age', 'All ages')}")
            print(f"     ⏱️ Duration: {edu_type.get('typical_duration', 'Varies')}")
            print()
    else:
        print(f"❌ Failed to fetch educational types: {result.get('error', 'Unknown error')}")

def demo_basic_enhancement():
    """Demo 2: Basic AI enhancement for summer camp"""
    print_header("DEMO 2: BASIC AI ENHANCEMENT - SUMMER CAMP")
    
    # Basic summer camp description
    basic_description = """
    Summer camp for young people in Dubai. 
    We will have activities and learning.
    Duration is 3 weeks.
    """
    
    print_section("BEFORE AI Enhancement")
    print("📝 Original Description:")
    print(basic_description.strip())
    
    print_section("AI Enhancement Request")
    enhancement_data = {
        "description": basic_description,
        "opportunity_type": "summer_camp",
        "location": "Dubai, UAE",
        "target_age_group": "youth_15_18"
    }
    
    print("🤖 Sending to Gemini 2.5 Pro for enhancement...")
    print(f"📊 Request data: {json.dumps(enhancement_data, indent=2)}")
    
    result = make_request("/api/educational/enhance", "POST", enhancement_data)
    
    if result["success"]:
        enhancement = result["data"].get("enhancement", {})
        
        print_section("AFTER AI Enhancement")
        print("✨ Enhanced Title:")
        print(f"   {enhancement.get('enhanced_title', 'N/A')}")
        
        print("\n📝 Enhanced Description:")
        print(f"   {enhancement.get('enhanced_description', 'N/A')}")
        
        print(f"\n🎯 AI Confidence: {enhancement.get('ai_confidence', 'N/A')}%")
        print(f"🇦🇪 UAE Alignment: {enhancement.get('uae_alignment_score', 'N/A')}%")
        print(f"📊 Market Fit: {enhancement.get('market_fit_score', 'N/A')}%")
        
        if enhancement.get('educational_details'):
            details = enhancement['educational_details']
            print("\n📚 Generated Educational Details:")
            print(f"   🎯 Learning Outcomes: {len(details.get('learning_outcomes', []))} items")
            print(f"   🏆 Skills Developed: {len(details.get('skills_developed', []))} items")
            print(f"   📋 Prerequisites: {len(details.get('academic_prerequisites', []))} items")
    else:
        print(f"❌ Enhancement failed: {result.get('error', 'Unknown error')}")

def demo_scholarship_enhancement():
    """Demo 3: Advanced AI enhancement for scholarship"""
    print_header("DEMO 3: ADVANCED AI ENHANCEMENT - SCHOLARSHIP")
    
    # Basic scholarship description
    scholarship_description = """
    Scholarship for Emirati students studying engineering.
    Amount: 50000 AED per year.
    For university students.
    """
    
    print_section("BEFORE AI Enhancement")
    print("📝 Original Description:")
    print(scholarship_description.strip())
    
    print_section("AI Enhancement Request")
    enhancement_data = {
        "description": scholarship_description,
        "opportunity_type": "scholarship",
        "location": "UAE",
        "target_age_group": "young_adult_18_25",
        "additional_context": {
            "field_of_study": "Engineering",
            "scholarship_amount": 50000,
            "currency": "AED",
            "duration": "per year"
        }
    }
    
    print("🤖 Sending to Gemini 2.5 Pro for advanced enhancement...")
    
    result = make_request("/api/educational/enhance", "POST", enhancement_data)
    
    if result["success"]:
        enhancement = result["data"].get("enhancement", {})
        
        print_section("AFTER AI Enhancement")
        print("✨ Enhanced Title:")
        print(f"   {enhancement.get('enhanced_title', 'N/A')}")
        
        print("\n📝 Enhanced Description:")
        enhanced_desc = enhancement.get('enhanced_description', 'N/A')
        # Truncate for demo if too long
        if len(enhanced_desc) > 300:
            enhanced_desc = enhanced_desc[:300] + "..."
        print(f"   {enhanced_desc}")
        
        print(f"\n📊 Enhancement Metrics:")
        print(f"   🎯 AI Confidence: {enhancement.get('ai_confidence', 'N/A')}%")
        print(f"   🇦🇪 UAE Alignment: {enhancement.get('uae_alignment_score', 'N/A')}%")
        print(f"   📈 Market Fit: {enhancement.get('market_fit_score', 'N/A')}%")
        print(f"   🏆 Quality Score: {enhancement.get('quality_score', 'N/A')}%")
        
        if enhancement.get('uae_specific_insights'):
            insights = enhancement['uae_specific_insights']
            print("\n🇦🇪 UAE-Specific Insights:")
            print(f"   📊 Emiratization Impact: {insights.get('emiratization_impact', 'N/A')}")
            print(f"   🎯 Vision 2071 Alignment: {insights.get('vision_2071_alignment', 'N/A')}")
            print(f"   🏛️ Government Priority: {insights.get('government_priority_level', 'N/A')}")
    else:
        print(f"❌ Enhancement failed: {result.get('error', 'Unknown error')}")

def demo_market_fit_analysis():
    """Demo 4: Market fit analysis for vocational training"""
    print_header("DEMO 4: MARKET FIT ANALYSIS - VOCATIONAL TRAINING")
    
    print_section("Market Analysis Request")
    analysis_data = {
        "opportunity_type": "vocational_training",
        "field": "Digital Marketing",
        "location": "Dubai, UAE",
        "target_age_group": "adult_25_35",
        "duration": "6 months"
    }
    
    print("📊 Analyzing market fit for Digital Marketing training...")
    print(f"🔍 Analysis parameters: {json.dumps(analysis_data, indent=2)}")
    
    result = make_request("/api/educational/analyze-market-fit", "POST", analysis_data)
    
    if result["success"]:
        analysis = result["data"].get("market_analysis", {})
        
        print_section("Market Fit Analysis Results")
        print(f"📈 Overall Market Fit Score: {analysis.get('overall_score', 'N/A')}%")
        print(f"📊 Demand Level: {analysis.get('demand_level', 'N/A')}")
        print(f"🎯 Target Audience Fit: {analysis.get('target_audience_fit', 'N/A')}%")
        print(f"💰 Economic Impact: {analysis.get('economic_impact_score', 'N/A')}%")
        
        if analysis.get('recommendations'):
            recommendations = analysis['recommendations'][:3]  # Show first 3
            print("\n💡 AI Recommendations:")
            for i, rec in enumerate(recommendations, 1):
                print(f"   {i}. {rec}")
        
        if analysis.get('uae_market_insights'):
            insights = analysis['uae_market_insights']
            print("\n🇦🇪 UAE Market Insights:")
            print(f"   🏢 Industry Demand: {insights.get('industry_demand', 'N/A')}")
            print(f"   👥 Talent Gap: {insights.get('talent_gap_analysis', 'N/A')}")
            print(f"   📈 Growth Potential: {insights.get('growth_potential', 'N/A')}")
    else:
        print(f"❌ Analysis failed: {result.get('error', 'Unknown error')}")

def demo_complete_opportunity_creation():
    """Demo 5: Complete opportunity creation with AI enhancement"""
    print_header("DEMO 5: COMPLETE OPPORTUNITY CREATION")
    
    print_section("Creating Enhanced Apprenticeship Program")
    
    opportunity_data = {
        "title": "UAE Renewable Energy Apprenticeship",
        "description": "Apprenticeship program in renewable energy sector for young Emiratis",
        "employment_type": "apprenticeship",
        "company_name": "Dubai Electricity and Water Authority (DEWA)",
        "location": "Dubai, UAE",
        "educational_details": {
            "target_age_group": "young_adult_18_25",
            "program_duration": "24 months",
            "program_schedule": "Full-time",
            "program_format": "Hybrid",
            "max_participants": 30
        },
        "enhance_with_ai": True
    }
    
    print("🚀 Creating comprehensive apprenticeship opportunity...")
    print(f"📝 Base data: {json.dumps(opportunity_data, indent=2)}")
    
    result = make_request("/api/opportunities/create", "POST", opportunity_data)
    
    if result["success"]:
        opportunity = result["data"].get("opportunity", {})
        
        print_section("✅ Opportunity Created Successfully")
        print(f"🆔 Opportunity ID: {opportunity.get('id', 'N/A')}")
        print(f"📝 Title: {opportunity.get('title', 'N/A')}")
        print(f"🏢 Organization: {opportunity.get('company_name', 'N/A')}")
        print(f"📍 Location: {opportunity.get('location', 'N/A')}")
        print(f"📊 Status: {opportunity.get('status', 'N/A')}")
        
        if opportunity.get('ai_enhancement_applied'):
            print(f"\n🤖 AI Enhancement Applied:")
            print(f"   ✨ Enhancement Score: {opportunity.get('enhancement_score', 'N/A')}%")
            print(f"   🇦🇪 UAE Alignment: {opportunity.get('uae_alignment', 'N/A')}%")
            print(f"   📈 Quality Score: {opportunity.get('quality_score', 'N/A')}%")
    else:
        print(f"❌ Creation failed: {result.get('error', 'Unknown error')}")

def main():
    """Run the complete AI enhancement demo"""
    print("🌟 EMIRATI JOURNEY PLATFORM - AI ENHANCEMENT DEMO")
    print("🤖 Powered by Gemini 2.5 Pro with UAE-Specific Intelligence")
    print("🇦🇪 Optimized for Emiratization and National Talent Development")
    
    # Check system health
    print_section("System Health Check")
    health = make_request("/health")
    if health["success"]:
        features = health["data"].get("features", {})
        print(f"✅ System Status: {health['data'].get('status', 'Unknown')}")
        print(f"🤖 AI Model: {health['data'].get('ai_model', 'Unknown')}")
        print(f"📊 Educational AI: {'✅ Active' if features.get('enhanced_analytics') else '❌ Inactive'}")
        print(f"🇦🇪 UAE Features: {'✅ Active' if features.get('uae_specific_features') else '❌ Inactive'}")
    else:
        print("❌ System health check failed")
        return
    
    # Run demos
    try:
        demo_educational_types()
        time.sleep(2)
        
        demo_basic_enhancement()
        time.sleep(2)
        
        demo_scholarship_enhancement()
        time.sleep(2)
        
        demo_market_fit_analysis()
        time.sleep(2)
        
        demo_complete_opportunity_creation()
        
    except KeyboardInterrupt:
        print("\n\n⏹️ Demo interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Demo error: {e}")
    
    print_header("DEMO COMPLETE")
    print("🎉 AI Enhancement Demo Finished Successfully!")
    print("🌟 The Emirati Journey Platform showcases world-class AI integration")
    print("🇦🇪 Perfectly aligned with UAE Vision 2071 and Emiratization goals")
    print("🚀 Ready for production deployment and global impact!")

if __name__ == "__main__":
    main()
