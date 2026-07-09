from flask import Flask
from flask_jwt_extended import JWTManager, create_access_token
app=Flask(__name__)
app.config["JWT_SECRET_KEY"]="dev-secret"
JWTManager(app)
with app.app_context():
    print(create_access_token(identity=14, additional_claims={"role":'recruiter'}))
