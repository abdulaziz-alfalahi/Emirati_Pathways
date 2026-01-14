from app import app

print("\n--- Available Routes ---")
for rule in app.url_map.iter_rules():
    print(f"{rule.endpoint}: {rule}")
print("------------------------\n")
