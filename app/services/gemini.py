from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import json

from app.schemas import ArticlePreview, GeminiHeadlines, GeminiBody, ArticleFull

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


client = genai.Client(api_key=GEMINI_API_KEY)
model = "gemini-2.5-flash-lite"
#model = "Gemini 2.0 Flash"

headline = "Global outcry after US launches strikes on Venezuela and captures president"
subheadline = "France, Russia, China and EU say Washington broke international law after US troops carried out the operation"

async def simplify_headline(articles: list[ArticlePreview], level: str):
    gemini_items = []
    for article in articles:
        gemini_item = GeminiHeadlines(    
            guardian_id=article.guardian_id,
            headline=article.headline,
            subheadline=article.subheadline,
        )
        gemini_items.append(gemini_item.model_dump())

    prompt = f"""
    Role: Act as an English teacher simplifying news for {level.upper()} learners. 
    Task: Simplify the provided headline and subheadline. 
    Constraints: 
    - Use level appropriate vocabulary and structures.
    - Keep names, places, and numbers the same.
    - Do not add extra information. 
    Output
    - Return the result strictly in JSON format with the keys "guardian_id" "headline" and "subheadline". 
    - Do not include any conversational text.
    - The "id" must match the input id exactly.

    Input JSON:
    {json.dumps(gemini_items, ensure_ascii=False)}
    """

    response = client.models.generate_content(
        model=model, 
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    data = json.loads(response.text)
    
    simplified_headlines = []
    for item in data:
        simplified_headline = GeminiHeadlines(
            guardian_id=item["guardian_id"],
            headline=item["headline"],
            subheadline=item.get("subheadline"),
        )
        simplified_headlines.append(simplified_headline)
        
    return simplified_headlines

async def simplify_body(article: ArticleFull, level: str):
    if level == "a1":
        word_count = 200
    elif level == "a2":
        word_count = 250
    elif level == "b1":
        word_count = 600
    else:
        word_count = 800
        
    simplified_body = GeminiBody(
        guardian_id=article.guardian_id,
        headline=article.headline,
        subheadline=article.subheadline,
        body=article.body,     
    )
    
    
    prompt = f"""
    Role: Act as an English teacher simplifying news for {level.upper()} learners. 
    Task: Simplify the provided news story. Write a maximum of {word_count} words. Create 3 discussion question based on the news contents. 
    Strict Constraints: 
    - Use level appropriate vocabulary.
    - Use level appropriate grammar and structures. 
    - Keep names, places, and numbers the same.
    - Do not add extra information. 
    - Write in paragraphs following the style of the original.
    Output
    - Return the result strictly in JSON format with the keys "guardian_id", "headline", "subheadline" "body" and "questions".
    - Questions should be returned as a Python list. 
    - Do not include any conversational text.
    - The "guardian_id" must match the input guardian_id exactly.
    - Must be a maximum of <= {word_count} words.

    Input JSON:
    {json.dumps(simplified_body.model_dump(), ensure_ascii=False)}
    """

    response = client.models.generate_content(
        model=model, 
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
        ),
    )
    data = json.loads(response.text)
    return GeminiBody(
    guardian_id=data["guardian_id"],
    headline=data["headline"],
    subheadline=data.get("subheadline"),
    body=data["body"],
    questions=data.get("questions", []),
    )
   
  
