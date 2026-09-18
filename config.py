import os
class Config:
    SECRET_KEY=os.getenv('SECRET_KEY','dev-secret')
    DATABASE_URL=os.getenv('DATABASE_URL','sqlite:///nele.db')
    CORS_ORIGINS=[x.strip() for x in os.getenv('CORS_ORIGINS','http://127.0.0.1:5500,http://localhost:5500,https://lernedeutsch.github.io').split(',') if x.strip()]
