from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = 'CyberCash Sentinel'
    DATABASE_URL: str = 'sqlite:///./cybercash.db'

settings = Settings()
