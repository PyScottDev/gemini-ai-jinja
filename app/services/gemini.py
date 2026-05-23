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

LEVEL_SETTINGS = {
    "a1": {
        "target_min": 90,
        "target_max": 120,
        "hard_max": 140,
        "vocab_items": 5,
        "paragraph_min": 2,
        "paragraph_max": 3,
    },
    "a2": {
        "target_min": 140,
        "target_max": 180,
        "hard_max": 220,
        "vocab_items": 6,
        "paragraph_min": 2,
        "paragraph_max": 4,
    },
    "b1": {
        "target_min": 250,
        "target_max": 350,
        "hard_max": 400,
        "vocab_items": 8,
        "paragraph_min": 4,
        "paragraph_max": 5,
    },
    "b2": {
        "target_min": 400,
        "target_max": 550,
        "hard_max": 650,
        "vocab_items": 8,
        "paragraph_min": 4,
        "paragraph_max": 6,
    },
}

# headline = "Global outcry after US launches strikes on Venezuela and captures president"
# subheadline = "France, Russia, China and EU say Washington broke international law after US troops carried out the operation"

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
    settings = LEVEL_SETTINGS.get(level)

    if settings is None:
        raise ValueError(f"Unsupported level: {level}")

    target_min = settings["target_min"]
    target_max = settings["target_max"]
    hard_max = settings["hard_max"]
    vocab_items = settings["vocab_items"]
    paragraph_min = settings["paragraph_min"]
    paragraph_max = settings["paragraph_max"]
        
    simplified_body = GeminiBody(
        guardian_id=article.guardian_id,
        headline=article.headline,
        subheadline=article.subheadline,
        body=article.body,     
    )
    
    
    prompt = f"""
    Role: Act as an English teacher simplifying news for {level.upper()} learners.

    Task:
    Simplify the provided news story.

    Length:
    - Write between {target_min} and {target_max} words.
    - Never write more than {hard_max} words.
    
    Headline and subheadline:
    - Rewrite the headline and subheadline in normal sentence case.
    - Capitalise only the first word and proper nouns.
    - Do not use title case.
    - Do not capitalise every important word.
        
    Paragraphing:
    - Write in natural news-style paragraphs.
    - Do not copy the original article's paragraph length.
    - Do not write the body as one paragraph.
    - For this level, write {paragraph_min} to {paragraph_max} paragraphs.
    - Format each paragraph with HTML <p>...</p> tags.
    - The "body" value must be one single JSON string containing the HTML paragraphs.
    - Use only plain ASCII apostrophes, like Iran's.
    - Do not use curly apostrophes, curly quotation marks, smart quotes, or special quote characters.
    - Do not use double quotation marks inside the body text.
        
    Vocabulary:
    - First write the simplified body.
    - Then choose {vocab_items} vocabulary items from the simplified body only.
    - Every vocabulary item must appear exactly in the final simplified body text.
    - Do not choose any word or phrase unless it appears in the final simplified body.
    - Do not choose words from the original article unless they also appear exactly in the simplified body.
    - Do not include vocabulary items that are only in the original article.
    - Choose {vocab_items} useful vocabulary items that are important for understanding this article.
    - Choose words or short phrases that may be challenging for {level.upper()} learners.
    - Do not choose very common words unless they are used in an important news phrase.
    - Prefer useful news phrases, collocations, and topic vocabulary over simple single words.
    - Do not choose names, places, dates, numbers, or very common words.
    - Give short, learner-friendly definitions.
    - Do not mark, highlight, bold, underline, or change the vocabulary items inside the body.
    - The body text should look like a normal article.

    Discussion:
    - Create 3 discussion questions based on the news content.

    Strict Constraints:
    - Use level appropriate vocabulary.
    - Use level appropriate grammar and structures.
    - Keep names, places, and numbers the same.
    - Do not add extra information.
    - Write in short paragraphs.

    Output:
    - Return strictly valid JSON.
    - Use the keys "guardian_id", "headline", "subheadline", "body", "questions", "vocabulary", and "word_count".
    - "body" must be a single JSON string containing the article text formatted with HTML paragraph tags.
    - Use only <p> and </p> tags in the body.
    - Do not return "body" as a JSON array.
    - Do not return "body" as a list of paragraphs.
    - Do not return paragraph objects.
    - Do not use Markdown.
    - Do not use double quotation marks inside any string values. Use single quotation marks or paraphrase direct speech instead.
    - "questions" should be a JSON array of 3 strings.
    - "vocabulary" should be a JSON array of objects.
    - Each vocabulary object should have the keys "word" and "definition".
    - "word_count" should be an integer.
    - Do not include any conversational text.
    - The "guardian_id" must match the input guardian_id exactly.

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
    vocabulary=data.get("vocabulary", []),
    word_count=data.get("word_count"),
    )
   
  
