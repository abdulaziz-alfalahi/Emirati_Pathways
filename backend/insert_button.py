
import os

file_path = r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend\src\pages\cv-builder\AutoFillCVBuilder.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find the line with the upload hint paragraph closing tag
target_line_index = -1
for i, line in enumerate(lines):
    if 'cvBuilder.uploadHint' in line:
        # Check next line for closing p tag
        if i + 1 < len(lines) and '</p>' in lines[i+1]:
            target_line_index = i + 1
            break

if target_line_index != -1:
    insertion = [
        '\n',
        '              <div className="mt-6 pt-6 border-t border-gray-200">\n',
        '                <button\n',
        "                  onClick={() => setCurrentStep('template')}\n",
        '                  className="text-gray-600 hover:text-blue-600 font-medium transition-colors flex items-center justify-center w-full group"\n',
        '                >\n',
        "                  <span>{useLanguage().t('cvBuilder.startFromScratch', 'Or start from scratch without uploading')}</span>\n",
        '                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />\n',
        '                </button>\n',
        '              </div>\n'
    ]
    
    # Insert after the closing p tag
    lines[target_line_index+1:target_line_index+1] = insertion
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully inserted the button.")
else:
    print("Target line not found.")
