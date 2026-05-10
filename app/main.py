from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import json

from app.services.guardian import fetch_articles, fetch_body
from app.services.gemini import simplify_headline, simplify_body
from app.schemas import ArticlePreview, GeminiHeadlines, GeminiBody, NewsTopic, EnglishLevel
from app.database.session import create_db_and_tables, SessionDep
from app.database.crud import article_check, db_full, create_headlines, update_body
from app.database.models import SimplifiedArticles

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")


# @app.get("/")
# def home():
#     return {"message": "Guardian AI News API is running"}

@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
    name="home.html",
    request=request,
    context={
        "message": "Guardian AI News API is running",
    },
)



# @app.get("/articles/{topic}/{level}", response_model=list[SimplifiedArticles])
# async def get_articles(topic: NewsTopic, level: EnglishLevel, session: SessionDep):
#     existing_articles = article_check(session, topic.value, level.value)
#     if existing_articles:
#         return existing_articles
#     articles = await fetch_articles(topic.value)
#     simplified_headlines = await simplify_headline(articles, level.value)
#     saved_articles = create_headlines(
#         session=session,
#         original_articles=articles,
#         simplified_articles=simplified_headlines,
#         topic=topic.value,
#         level=level.value,  
#         )
#     return saved_articles

@app.get("/news/{topic}/{level}", response_class=HTMLResponse)
async def get_articles(
    request: Request,
    topic: NewsTopic,
    level: EnglishLevel,
    session: SessionDep,
    ):
    
    existing_articles = article_check(session, topic.value, level.value)
    
    if existing_articles:
        articles = existing_articles
    else:
        guardian_articles = await fetch_articles(topic.value)
        simplified_headlines = await simplify_headline(
            guardian_articles,
            level.value,
        )
        
        articles = create_headlines(
            session=session,
            original_articles=guardian_articles,
            simplified_articles=simplified_headlines,
            topic=topic.value,
            level=level.value,  
            )
        
    return templates.TemplateResponse(
        name="index.html",
        request=request,
        context={
            "articles": articles,
            "topic": topic,
            "level": level,
        },
    )


@app.get("/news/article/{article_id}/{level}", response_class=HTMLResponse)
async def get_body(
    request: Request,
    article_id: int,
    level: EnglishLevel,
    session: SessionDep
    ):
    
    db_article = db_full(session, article_id)
    if db_article is None:
        raise HTTPException(status_code=404, detail="Article not found")
    if db_article.body:
        article=db_article
    else:
        full_article = await fetch_body(db_article.guardian_id)
        simplified_body = await simplify_body(full_article, level.value)
        article = update_body(session, db_article, simplified_body)
        
    questions = []

    if article.questions:
        try:
            questions = json.loads(article.questions)
        except json.JSONDecodeError:
            questions = []
            
    return templates.TemplateResponse(
        name="article.html",
        request=request,
        context={
            "article": article,
            "questions": questions,
        }
    )

# @app.get("/article/{article_id}/{level}", response_model=SimplifiedArticles)
# async def get_body(article_id: int, level: EnglishLevel, session: SessionDep):
#     db_article = db_full(session, article_id)
#     if db_article is None:
#         raise HTTPException(status_code=404, detail="Article not found")
#     if db_article.body:
#         return db_article
#     full_article = await fetch_body(db_article.guardian_id)
#     simplified_body = await simplify_body(full_article, level.value)
#     updated_article = update_body(session, db_article, simplified_body)
#     return updated_article
    
    
    

    