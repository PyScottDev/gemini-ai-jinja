import os
from typing import Annotated

from dotenv import load_dotenv
from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

from app.database.models import SimplifiedArticles


load_dotenv()

database_url = os.getenv("DATABASE_URL", "sqlite:///sqlite.db")

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)


if database_url.startswith("sqlite"):
    engine = create_engine(
        database_url,
        echo=True,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        database_url,
        echo=True,
    )

def create_db_and_tables():
   SQLModel.metadata.create_all(engine)


def get_session():
   with Session(engine) as session:
       yield session


SessionDep = Annotated[Session, Depends(get_session)]
