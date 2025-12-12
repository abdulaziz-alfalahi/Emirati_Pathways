
import os

file_path = r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend\src\pages\cv-builder\AutoFillCVBuilder.tsx'

replacements = {
    'â€¢': '•',
    'â–¶': '▶',
    'â—': '●',
    'â€”': '—',
    'Ã—': '×',
    'ðŸ“„': '📄',
    '📝‹': '📋',
    'ðŸ“‹': '📋',
    'ðŸ“': '📝',
    'ðŸ‡¦ðŸ‡ª': '🇦🇪',
    'ðŸ¤–': '🤖',
    'ðŸŒŸ': '🌟'
}

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

for bad, good in replacements.items():
    content = content.replace(bad, good)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Encoding fixed.")
