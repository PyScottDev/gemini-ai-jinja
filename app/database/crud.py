
from datetime import date
import json
from sqlmodel import Session, select

from app.database.models import SimplifiedArticles
from app.schemas import GeminiHeadlines, GeminiBody, ArticlePreview, ArticleFull

def article_check(
    session: Session,
    topic: str,
    level: str
    ):
    
    today = date.today()
    
    statement = select(SimplifiedArticles).where(
        SimplifiedArticles.topic == topic,
        SimplifiedArticles.level == level,
        SimplifiedArticles.created_on == today,
    )
    
    return list(session.exec(statement).all())

def db_full(
    session: Session,
    article_id: int,
    ):
    statement = select(SimplifiedArticles).where(SimplifiedArticles.id == article_id)
    return session.exec(statement).first()


def create_headlines(
    session: Session,
    original_articles: list[ArticlePreview],
    simplified_articles: list[GeminiHeadlines],
    topic: str,
    level: str,
    ):
    today = date.today()
    saved_articles = []
    
    original_lookup = {
        article.guardian_id: article
        for article in original_articles
    }
    
    for article in simplified_articles:
        original_article = original_lookup.get(article.guardian_id)
        
        db_article = SimplifiedArticles(
           guardian_id=article.guardian_id,
           created_on=today,
           topic=topic,
           level=level,
           headline=article.headline,
           subheadline=article.subheadline,
           thumbnail=original_article.thumbnail if original_article else None,
       )
        
        session.add(db_article)
        saved_articles.append(db_article)
    
    session.commit()
    
    for article in saved_articles:
        session.refresh(article)
    
    return saved_articles

def update_body(
    session: Session,
    db_article: SimplifiedArticles,
    simplified_body: GeminiBody,
    ):
    
    db_article.headline = simplified_body.headline
    db_article.subheadline = simplified_body.subheadline
    db_article.body = simplified_body.body
    db_article.questions = json.dumps(simplified_body.questions, ensure_ascii=False)
    
    session.add(db_article)
    session.commit()
    session.refresh(db_article)
    return db_article
    
        
