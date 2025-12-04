
import os

file_path = r'c:\Users\user\Projects\Emirati_Pathway\Emirati_Pathways\frontend\src\components\recruiter\CandidateMatching.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# We want to replace lines 834-842 (0-indexed: 833-841)
# Check if the content matches roughly what we expect to avoid destroying the file
start_index = 833
end_index = 842

print(f"Replacing lines {start_index+1} to {end_index}")
for i in range(start_index, end_index):
    print(f"{i+1}: {lines[i].rstrip()}")

new_block = [
    "                    </div>\n",
    "                  </div>\n",
    "                </div>\n",
    "              );\n",
    "            })}\n",
    "          </div>\n",
    "        </CardContent>\n",
    "      </Card>\n",
    "    )}\n"
]

lines[start_index:end_index] = new_block

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("File updated.")
