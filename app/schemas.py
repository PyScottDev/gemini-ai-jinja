from sqlmodel import SQLModel, Field
from enum import Enum


class NewsTopic(str, Enum):
   world = "world"
   technology = "technology"
   society = "society"
   environment = "environment"
   culture = "culture"
   sport = "sport"
   science = "science"
   business = "business"
   
class EnglishLevel(str, Enum):
   a1 = "a1"
   a2 = "a2"
   b1 = "b1"
   b2 = "b2"


class ArticleBase(SQLModel):
    guardian_id:str
    headline: str
    subheadline: str | None = None
    
class ArticlePreview(ArticleBase):
    topic: NewsTopic
    thumbnail: str | None = None
    
class ArticleFull(ArticleBase):
    topic: NewsTopic
    thumbnail: str | None = None
    body: str | None = None

class GeminiHeadlines(ArticleBase):
    pass

class GeminiBody(ArticleBase):
    body: str
    questions: list[str] = Field(default_factory=list)
    
