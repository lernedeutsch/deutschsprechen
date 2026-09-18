from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import Config

class Base(DeclarativeBase):
    pass

def _url():
    u=Config.DATABASE_URL
    if u.startswith('postgres://'):
        u='postgresql+psycopg://'+u[len('postgres://'):]
    elif u.startswith('postgresql://'):
        u='postgresql+psycopg://'+u[len('postgresql://'):]
    return u

engine=create_engine(_url(),pool_pre_ping=True,future=True)
SessionLocal=sessionmaker(bind=engine,expire_on_commit=False,autoflush=False)

def init_db():
    from nele import models
    Base.metadata.create_all(bind=engine)

@contextmanager
def session_scope():
    db=SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
