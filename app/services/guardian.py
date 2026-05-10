from dotenv import load_dotenv
import httpx
import os

from app.schemas import ArticlePreview, ArticleFull


##Keys and URLs
load_dotenv()
GUARDIAN_API = os.getenv("GUARDIAN_API_KEY")
GUARDIAN_CONTENT = "https://content.guardianapis.com/search"
GUARDIAN_ARTICLE = "https://content.guardianapis.com/"

async def fetch_articles(topic: str):
   parm_content = {
   "section": topic,
   "order-by": "newest",
   "page-size": "12",
   "show-fields": "trailText,thumbnail",
   "api-key": GUARDIAN_API,
   }
      
   async with httpx.AsyncClient() as client:
        response = await client.get(GUARDIAN_CONTENT, params=parm_content)
        
   response.raise_for_status()
   data = response.json()
   
   results = data["response"]["results"]
   
   articles = [
      ArticlePreview(
      guardian_id=result["id"],
      headline=result["webTitle"],
      subheadline=result["fields"].get("trailText"),
      thumbnail=result["fields"].get("thumbnail"),
      topic=result.get("sectionId"),
      )
      for result in results
   ]
   
   return articles

##Request for body
async def fetch_body(article_id: str):
   parm_article = {
   "show-fields": "body,trailText,thumbnail",
   "api-key": GUARDIAN_API,
   }

   async with httpx.AsyncClient() as client:
      response = await client.get(GUARDIAN_ARTICLE + article_id, params=parm_article)
      
   response.raise_for_status()
   data = response.json()
   content = data["response"]["content"]
   fields = content.get("fields", {})
   
   return ArticleFull(
    guardian_id=content["id"],
    headline=content["webTitle"],
    subheadline=fields.get("trailText"),
    topic=content["sectionId"],
    thumbnail=fields.get("thumbnail"),
    body=fields.get("body"),
   )