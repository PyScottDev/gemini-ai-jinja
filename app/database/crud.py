
from datetime import date
import json
from sqlmodel import Session, select
import random

from app.database.models import SimplifiedArticles, TopicLevelCheck
from app.schemas import GeminiHeadlines, GeminiBody, ArticlePreview, ArticleFull, EnglishLevel, NewsTopic


def homepage_articles(session: Session):
    articles = []
    used_ids = set()

    levels = list(EnglishLevel)

    for index, topic in enumerate(NewsTopic):
        level = levels[index % len(levels)]

        statement = (
            select(SimplifiedArticles)
            .where(
                SimplifiedArticles.topic == topic.value,
                SimplifiedArticles.level == level.value,
            )
            .order_by(SimplifiedArticles.created_on.desc())
            .limit(1)
        )

        article = session.exec(statement).first()

        if article is None:
            fallback_statement = (
                select(SimplifiedArticles)
                .where(SimplifiedArticles.topic == topic.value)
                .order_by(SimplifiedArticles.created_on.desc())
                .limit(1)
            )

            article = session.exec(fallback_statement).first()

        if article and article.id not in used_ids:
            articles.append(article)
            used_ids.add(article.id)
        
    random.shuffle(articles)

    return articles


def topic_level_checked_today(
    session: Session,
    topic: str,
    level: str
    ):
    
    today = date.today()
    
    statement = select(TopicLevelCheck).where(
        TopicLevelCheck.topic == topic,
        TopicLevelCheck.level == level,
        TopicLevelCheck.checked_on == today,
    )
    
    return session.exec(statement).first()

def articles_for_topic_level(
    session: Session,
    topic: str,
    level: str,
):
    statement = (
        select(SimplifiedArticles)
        .where(
            SimplifiedArticles.topic == topic,
            SimplifiedArticles.level == level,
        )
        .order_by(SimplifiedArticles.created_on.desc())
        .limit(12)
    )

    return list(session.exec(statement).all())

def create_topic_level_check(
    session: Session,
    topic: str,
    level: str,
):
    today = date.today()

    check = TopicLevelCheck(
        topic=topic,
        level=level,
        checked_on=today,
    )

    session.add(check)
    session.commit()
    session.refresh(check)

    return check

def id_level_check(
    session: Session,
    guardian_articles: list[ArticlePreview],
    level: str
    ):
    saved_articles = []
    new_articles = []
    for article in guardian_articles:
        statement = select(SimplifiedArticles).where(
            SimplifiedArticles.guardian_id == article.guardian_id,
            SimplifiedArticles.level == level,
        )
        saved_article = session.exec(statement).first()
        
        if saved_article:
            saved_articles.append(saved_article)
        else:
            new_articles.append(article)
        
    return saved_articles, new_articles
    

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
           web_url=original_article.web_url if original_article else None,
           publication_date=original_article.publication_date if original_article else None,
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
    db_article.vocabulary = json.dumps(
    [item.model_dump() for item in simplified_body.vocabulary],
    ensure_ascii=False,
    )
    db_article.word_count = simplified_body.word_count
    session.add(db_article)
    session.commit()
    session.refresh(db_article) 
    return db_article
    
        
