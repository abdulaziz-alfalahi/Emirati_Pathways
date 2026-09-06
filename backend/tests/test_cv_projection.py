"""Uploaded CVs render on the public share page (owner report 2026-09-06).

The parser stores an uploaded CV in parsed_data (snake_case); the CV builder
stores a built CV in the structured columns (camelCase). The share page reads
the columns, so an uploaded CV showed an empty page headed "User".
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from backend import cv_projection as cp  # noqa: E402

PARSED = {
    'personal_info': {'full_name': 'Abdulaziz Essa Harib', 'first_name': 'Abdulaziz', 'last_name': 'Alfalahi',
                      'email': 'a@example.ae', 'phone': '+971-55-000-0000', 'location': 'Dubai, UAE',
                      'nationality': 'Emirati', 'linkedin': 'linkedin.com/in/x', 'address': ''},
    'professional_summary': 'Accomplished executive.',
    'skills': [{'name': 'Digital Transformation', 'level': 'Expert', 'category': 'Domain'},
               {'name': 'Leadership', 'level': 'Expert', 'category': 'Soft'}, 'Python', {'name': ''}],
    'experience': [{'company': 'EHRDC', 'position': 'General Superintendent', 'location': 'Dubai, UAE',
                    'start_date': '2022-09-01', 'end_date': None, 'is_current': True,
                    'description': 'Led Emiratisation programmes.', 'achievements': ['Launched 3 programmes']},
                   {'company': 'du', 'position': 'VP Network Operations', 'start_date': '2013-01-01',
                    'end_date': '2015-01-01', 'is_current': False, 'description': 'Ran the network.'}],
    'education': [{'degree': 'EMBA', 'institution': 'HCT', 'field_of_study': 'Strategic Management',
                   'start_date': '2009-01-01', 'end_date': '2011-01-01', 'gpa': '3.6', 'nqf_level': 9}],
}


def test_builder_shape_from_parsed():
    b = cp.builder_shape(PARSED)
    assert b['personal_info']['firstName'] == 'Abdulaziz' and b['personal_info']['lastName'] == 'Alfalahi'
    assert b['personal_info']['fullName'] == 'Abdulaziz Essa Harib'
    assert b['professional_summary'] == 'Accomplished executive.'
    assert b['technical_skills'] == ['Digital Transformation', 'Python'] and b['soft_skills'] == ['Leadership']
    assert len(b['work_experience']) == 2
    first = b['work_experience'][0]
    assert first['jobTitle'] == 'General Superintendent' and first['company'] == 'EHRDC'
    assert first['startDate'] == '2022-09-01' and first['endDate'] == 'Present'
    assert 'Led Emiratisation programmes.' in first['responsibilities'] and '• Launched 3 programmes' in first['responsibilities']
    assert b['work_experience'][1]['endDate'] == '2015-01-01'
    edu = b['education'][0]
    assert edu == {'degree': 'EMBA', 'institution': 'HCT', 'field': 'Strategic Management', 'graduationYear': '2011', 'gpa': '3.6'}


def test_nothing_is_invented_for_missing_data():
    b = cp.builder_shape({})
    assert b == {'personal_info': {}, 'professional_summary': '', 'technical_skills': [], 'soft_skills': [],
                 'work_experience': [], 'education': []}
    assert cp.builder_shape(None)['work_experience'] == []
    assert cp.experience({'experience': [{'company': 'X'}]})[0]['jobTitle'] == ''
    assert cp.education({'education': [{'degree': 'BSc', 'end_date': 'None'}]})[0]['graduationYear'] == ''


def test_fill_only_where_the_columns_are_empty():
    row = {'personal_info': None, 'professional_summary': '', 'technical_skills': [], 'soft_skills': None,
           'work_experience': [{'jobTitle': 'Built in the app', 'company': 'Kept'}], 'education': None,
           'parsed_data': PARSED}
    out = cp.fill_from_parsed(row)
    assert out['work_experience'] == [{'jobTitle': 'Built in the app', 'company': 'Kept'}]   # built data wins
    assert out['personal_info']['firstName'] == 'Abdulaziz'                                   # empty columns filled
    assert out['education'][0]['degree'] == 'EMBA' and out['technical_skills'] == ['Digital Transformation', 'Python']


def test_contacts_are_masked_for_the_public():
    masked = cp.mask_contacts(cp.builder_shape(PARSED)['personal_info'])
    assert masked['email'] == cp.MASK and masked['phone'] == cp.MASK and masked['linkedin'] == cp.MASK
    assert masked['firstName'] == 'Abdulaziz' and masked['location'] == 'Dubai, UAE'
    assert cp.mask_contacts(None) is None
