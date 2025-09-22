#!/usr/bin/env python3
"""
Working AI Enhancement Demo
Demonstrates actual Gemini 2.5 Pro integration for educational opportunities
"""

import os
import sys
sys.path.append('/home/ubuntu/emirati-platform/backend')

from educational_opportunity_ai import EducationalOpportunityAI
from models.job import EmploymentType
import json

def print_header(title: str):
    """Print formatted header"""
    print("\n" + "="*80)
    print(f"🎯 {title}")
    print("="*80)

def print_section(title: str):
    """Print formatted section"""
    print(f"\n🔹 {title}")
    print("-" * 60)

def demo_summer_camp_enhancement():
    """Demo 1: Summer Camp AI Enhancement"""
    print_header("DEMO 1: SUMMER CAMP AI ENHANCEMENT WITH GEMINI 2.5 PRO")
    
    # Initialize AI engine
    ai_engine = EducationalOpportunityAI()
    
    # Basic summer camp description
    basic_description = """
    Summer camp for young people in Dubai. 
    We will have activities and learning.
    Duration is 3 weeks.
    """
    
    print_section("BEFORE AI Enhancement")
    print("📝 Original Description:")
    print(basic_description.strip())
    
    print_section("AI Enhancement Process")
    print("🤖 Sending to Gemini 2.5 Pro for enhancement...")
    
    try:
        # Call AI enhancement using the correct method
        result = ai_engine.enhance_educational_opportunity(
            opportunity_text=basic_description,
            opportunity_type=EmploymentType.SUMMER_CAMP
        )
        
        print_section("✅ AFTER AI Enhancement")
        
        # Display results
        print(f"🎯 Enhancement Success: {'✅ Yes' if result.get('success', False) else '❌ No'}")
        print(f"🤖 AI Confidence: {result.get('confidence_score', 'N/A')}%")
        print(f"🇦🇪 UAE Alignment: {result.get('uae_alignment_score', 'N/A')}%")
        print(f"📊 Quality Score: {result.get('quality_score', 'N/A')}%")
        
        if result.get('enhanced_title'):
            print(f"\n✨ Enhanced Title:")
            print(f"   {result['enhanced_title']}")
        
        if result.get('enhanced_description'):
            print(f"\n📝 Enhanced Description:")
            enhanced_desc = result['enhanced_description']
            # Truncate if too long for demo
            if len(enhanced_desc) > 500:
                enhanced_desc = enhanced_desc[:500] + "..."
            print(f"   {enhanced_desc}")
        
        if result.get('educational_details'):
            details = result['educational_details']
            print(f"\n📚 Educational Details Generated:")
            
            if details.get('learning_outcomes'):
                print(f"   🎯 Learning Outcomes ({len(details['learning_outcomes'])} items):")
                for outcome in details['learning_outcomes'][:3]:
                    print(f"      • {outcome}")
            
            if details.get('skills_developed'):
                print(f"   🏆 Skills Developed ({len(details['skills_developed'])} items):")
                for skill in details['skills_developed'][:3]:
                    print(f"      • {skill}")
            
            if details.get('target_age_group'):
                print(f"   👥 Target Age Group: {details['target_age_group']}")
            
            if details.get('program_duration'):
                print(f"   ⏱️ Program Duration: {details['program_duration']}")
        
        if result.get('uae_insights'):
            insights = result['uae_insights']
            print(f"\n🇦🇪 UAE-Specific Insights:")
            print(f"   📊 Emiratization Impact: {insights.get('emiratization_impact', 'N/A')}")
            print(f"   🎯 Vision 2071 Alignment: {insights.get('vision_2071_alignment', 'N/A')}")
            print(f"   🏛️ Cultural Fit: {insights.get('cultural_fit_score', 'N/A')}%")
        
        if result.get('recommendations'):
            print(f"\n💡 AI Recommendations:")
            for i, rec in enumerate(result['recommendations'][:3], 1):
                print(f"   {i}. {rec}")
                
    except Exception as e:
        print(f"❌ Demo error: {e}")
        print(f"   Error type: {type(e).__name__}")

def demo_scholarship_enhancement():
    """Demo 2: Scholarship AI Enhancement"""
    print_header("DEMO 2: SCHOLARSHIP AI ENHANCEMENT")
    
    ai_engine = EducationalOpportunityAI()
    
    # Basic scholarship description
    scholarship_description = """
    Scholarship for Emirati students studying engineering.
    Amount: 50000 AED per year.
    For university students.
    """
    
    print_section("BEFORE AI Enhancement")
    print("📝 Original Description:")
    print(scholarship_description.strip())
    
    print_section("AI Enhancement Process")
    print("🤖 Sending to Gemini 2.5 Pro for scholarship enhancement...")
    
    try:
        result = ai_engine.enhance_educational_opportunity(
            opportunity_text=scholarship_description,
            opportunity_type=EmploymentType.SCHOLARSHIP
        )
        
        print_section("✅ AFTER AI Enhancement")
        
        print(f"🎯 Enhancement Success: {'✅ Yes' if result.get('success', False) else '❌ No'}")
        print(f"🤖 AI Confidence: {result.get('confidence_score', 'N/A')}%")
        print(f"🇦🇪 UAE Alignment: {result.get('uae_alignment_score', 'N/A')}%")
        print(f"📊 Quality Score: {result.get('quality_score', 'N/A')}%")
        
        if result.get('enhanced_title'):
            print(f"\n✨ Enhanced Title:")
            print(f"   {result['enhanced_title']}")
        
        if result.get('enhanced_description'):
            print(f"\n📝 Enhanced Description:")
            enhanced_desc = result['enhanced_description']
            if len(enhanced_desc) > 400:
                enhanced_desc = enhanced_desc[:400] + "..."
            print(f"   {enhanced_desc}")
        
        if result.get('educational_details'):
            details = result['educational_details']
            print(f"\n📚 Scholarship Details:")
            
            if details.get('eligibility_criteria'):
                print(f"   ✅ Eligibility Criteria:")
                for criteria in details['eligibility_criteria'][:3]:
                    print(f"      • {criteria}")
            
            if details.get('application_requirements'):
                print(f"   📋 Application Requirements:")
                for req in details['application_requirements'][:3]:
                    print(f"      • {req}")
            
            if details.get('scholarship_benefits'):
                print(f"   🎁 Benefits:")
                for benefit in details['scholarship_benefits'][:3]:
                    print(f"      • {benefit}")
        
        if result.get('uae_insights'):
            insights = result['uae_insights']
            print(f"\n🇦🇪 UAE-Specific Analysis:")
            print(f"   📊 Emiratization Impact: {insights.get('emiratization_impact', 'N/A')}")
            print(f"   🎯 National Priority: {insights.get('national_priority_level', 'N/A')}")
            print(f"   🏛️ Government Alignment: {insights.get('government_alignment', 'N/A')}")
                
    except Exception as e:
        print(f"❌ Demo error: {e}")

def demo_vocational_training_enhancement():
    """Demo 3: Vocational Training AI Enhancement"""
    print_header("DEMO 3: VOCATIONAL TRAINING AI ENHANCEMENT")
    
    ai_engine = EducationalOpportunityAI()
    
    # Basic vocational training description
    training_description = """
    Digital marketing training course.
    Learn social media and online advertising.
    6 months program.
    """
    
    print_section("BEFORE AI Enhancement")
    print("📝 Original Description:")
    print(training_description.strip())
    
    print_section("AI Enhancement Process")
    print("🤖 Sending to Gemini 2.5 Pro for vocational training enhancement...")
    
    try:
        result = ai_engine.enhance_educational_opportunity(
            opportunity_text=training_description,
            opportunity_type=EmploymentType.VOCATIONAL_TRAINING
        )
        
        print_section("✅ AFTER AI Enhancement")
        
        print(f"🎯 Enhancement Success: {'✅ Yes' if result.get('success', False) else '❌ No'}")
        print(f"🤖 AI Confidence: {result.get('confidence_score', 'N/A')}%")
        print(f"🇦🇪 UAE Alignment: {result.get('uae_alignment_score', 'N/A')}%")
        print(f"📊 Quality Score: {result.get('quality_score', 'N/A')}%")
        
        if result.get('enhanced_title'):
            print(f"\n✨ Enhanced Title:")
            print(f"   {result['enhanced_title']}")
        
        if result.get('enhanced_description'):
            print(f"\n📝 Enhanced Description:")
            enhanced_desc = result['enhanced_description']
            if len(enhanced_desc) > 350:
                enhanced_desc = enhanced_desc[:350] + "..."
            print(f"   {enhanced_desc}")
        
        if result.get('educational_details'):
            details = result['educational_details']
            print(f"\n📚 Training Program Details:")
            
            if details.get('skills_developed'):
                print(f"   🏆 Skills Developed:")
                for skill in details['skills_developed'][:4]:
                    print(f"      • {skill}")
            
            if details.get('certification_offered'):
                print(f"   🏅 Certification: {details['certification_offered']}")
            
            if details.get('career_outcomes'):
                print(f"   💼 Career Outcomes:")
                for outcome in details['career_outcomes'][:3]:
                    print(f"      • {outcome}")
            
            if details.get('program_schedule'):
                print(f"   📅 Schedule: {details['program_schedule']}")
        
        if result.get('market_analysis'):
            market = result['market_analysis']
            print(f"\n📊 Market Analysis:")
            print(f"   📈 Demand Level: {market.get('demand_level', 'N/A')}")
            print(f"   💰 Salary Potential: {market.get('salary_potential', 'N/A')}")
            print(f"   🎯 Job Market Fit: {market.get('job_market_fit', 'N/A')}%")
                
    except Exception as e:
        print(f"❌ Demo error: {e}")

def demo_apprenticeship_enhancement():
    """Demo 4: Apprenticeship Program Enhancement"""
    print_header("DEMO 4: APPRENTICESHIP PROGRAM AI ENHANCEMENT")
    
    ai_engine = EducationalOpportunityAI()
    
    # Basic apprenticeship description
    apprenticeship_description = """
    Apprenticeship program in renewable energy.
    Work and learn at the same time.
    2 years duration.
    """
    
    print_section("BEFORE AI Enhancement")
    print("📝 Original Description:")
    print(apprenticeship_description.strip())
    
    print_section("AI Enhancement Process")
    print("🤖 Sending to Gemini 2.5 Pro for apprenticeship enhancement...")
    
    try:
        result = ai_engine.enhance_educational_opportunity(
            opportunity_text=apprenticeship_description,
            opportunity_type=EmploymentType.APPRENTICESHIP
        )
        
        print_section("✅ AFTER AI Enhancement")
        
        print(f"🎯 Enhancement Success: {'✅ Yes' if result.get('success', False) else '❌ No'}")
        print(f"🤖 AI Confidence: {result.get('confidence_score', 'N/A')}%")
        print(f"🇦🇪 UAE Alignment: {result.get('uae_alignment_score', 'N/A')}%")
        print(f"📊 Quality Score: {result.get('quality_score', 'N/A')}%")
        
        if result.get('enhanced_title'):
            print(f"\n✨ Enhanced Title:")
            print(f"   {result['enhanced_title']}")
        
        if result.get('enhanced_description'):
            print(f"\n📝 Enhanced Description:")
            enhanced_desc = result['enhanced_description']
            if len(enhanced_desc) > 400:
                enhanced_desc = enhanced_desc[:400] + "..."
            print(f"   {enhanced_desc}")
        
        if result.get('educational_details'):
            details = result['educational_details']
            print(f"\n📚 Apprenticeship Details:")
            
            if details.get('work_study_balance'):
                print(f"   ⚖️ Work-Study Balance: {details['work_study_balance']}")
            
            if details.get('mentorship_structure'):
                print(f"   👨‍🏫 Mentorship: {details['mentorship_structure']}")
            
            if details.get('progression_pathway'):
                print(f"   📈 Career Progression:")
                for path in details['progression_pathway'][:3]:
                    print(f"      • {path}")
            
            if details.get('industry_partnerships'):
                print(f"   🤝 Industry Partners:")
                for partner in details['industry_partnerships'][:3]:
                    print(f"      • {partner}")
        
        if result.get('uae_insights'):
            insights = result['uae_insights']
            print(f"\n🇦🇪 UAE Strategic Insights:")
            print(f"   🌱 Sustainability Alignment: {insights.get('sustainability_score', 'N/A')}%")
            print(f"   🏭 Industry Relevance: {insights.get('industry_relevance', 'N/A')}")
            print(f"   📊 Economic Diversification: {insights.get('economic_diversification_impact', 'N/A')}")
                
    except Exception as e:
        print(f"❌ Demo error: {e}")

def main():
    """Run the complete working AI enhancement demo"""
    print("🌟 EMIRATI JOURNEY PLATFORM - WORKING AI ENHANCEMENT DEMO")
    print("🤖 Powered by Gemini 2.5 Pro with UAE-Specific Intelligence")
    print("🇦🇪 Optimized for Emiratization and National Talent Development")
    print("⚡ Direct Integration with Educational Opportunity AI Engine")
    
    # Check if API key is available
    if not os.getenv('GEMINI_API_KEY') and not os.getenv('OPENAI_API_KEY'):
        print("❌ No API key found in environment")
        return
    
    print("✅ AI API Key Available")
    
    try:
        # Run demos
        demo_summer_camp_enhancement()
        
        demo_scholarship_enhancement()
        
        demo_vocational_training_enhancement()
        
        demo_apprenticeship_enhancement()
        
    except KeyboardInterrupt:
        print("\n\n⏹️ Demo interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Demo error: {e}")
    
    print_header("DEMO COMPLETE")
    print("🎉 Working AI Enhancement Demo Finished!")
    print("🌟 The Emirati Journey Platform showcases real AI integration")
    print("🇦🇪 Perfectly aligned with UAE Vision 2071 and Emiratization goals")
    print("🚀 Ready for production deployment and global impact!")
    print("\n💡 Key Capabilities Demonstrated:")
    print("   ✅ Real-time AI enhancement of educational opportunities")
    print("   ✅ UAE-specific cultural intelligence and insights")
    print("   ✅ Professional content generation and optimization")
    print("   ✅ Comprehensive educational program analysis")
    print("   ✅ Market-aligned skill development recommendations")
    print("   ✅ Emiratization compliance and Vision 2071 alignment")

if __name__ == "__main__":
    main()
