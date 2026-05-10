from sqlmodel import SQLModel, Field
from datetime import date

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
    
    
    