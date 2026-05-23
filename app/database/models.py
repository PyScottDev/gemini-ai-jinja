from sqlmodel import SQLModel, Field
from datetime import date
import json

class SimplifiedArticles(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    guardian_id: str = Field(index=True)
    created_on: date
    topic: str
    level: str
    headline: str
    subheadline: str | None = None
    body: str | None = None 
    thumbnail: str | None = None
    questions: str | None = None
    vocabulary: str | None = None
    word_count: int | None = None
    web_url: str | None = None
    publication_date: str | None = None
    
    
class TopicLevelCheck(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    topic: str = Field(index=True)
    level: str = Field(index=True)
    checked_on: date = Field(index=True)
    
    
    