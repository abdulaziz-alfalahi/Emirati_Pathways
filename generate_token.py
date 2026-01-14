from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
import os

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "dev-secret"
JWTManager(app)

with app.app_context():
    token = create_access_token(identity=14, additional_claims={"role":"hr_recruiter"})
    with open("token.txt", "w") as f:
        f.write(token)
    print("Token written to token.txt")
