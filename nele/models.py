import json, uuid
from datetime import datetime, timezone
from sqlalchemy import String,Integer,Float,Boolean,DateTime,Text,ForeignKey,UniqueConstraint
from sqlalchemy.orm import Mapped,mapped_column
from nele.db import Base

def utcnow(): return datetime.now(timezone.utc)
def jd(v): return json.dumps(v,ensure_ascii=False)
def jl(v,d=None):
    try: return json.loads(v) if v else ({} if d is None else d)
    except Exception: return {} if d is None else d

class Student(Base):
    __tablename__='students'
    id:Mapped[str]=mapped_column(String(64),primary_key=True,default=lambda:str(uuid.uuid4()))
    name:Mapped[str|None]=mapped_column(String(120),nullable=True)
    level:Mapped[str]=mapped_column(String(10),default='A1')
    occupation:Mapped[str|None]=mapped_column(String(160),nullable=True)
    last_topic:Mapped[str|None]=mapped_column(String(240),nullable=True)
    preferences_json:Mapped[str]=mapped_column(Text,default='{}')
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow)

class LearningSession(Base):
    __tablename__='learning_sessions'
    id:Mapped[str]=mapped_column(String(64),primary_key=True,default=lambda:str(uuid.uuid4()))
    student_id:Mapped[str]=mapped_column(ForeignKey('students.id',ondelete='CASCADE'),index=True)
    state_json:Mapped[str]=mapped_column(Text,default='{}')
    active_json:Mapped[str]=mapped_column(Text,default='{}')
    activity_count:Mapped[int]=mapped_column(Integer,default=0)
    correct_count:Mapped[int]=mapped_column(Integer,default=0)
    finished:Mapped[bool]=mapped_column(Boolean,default=False)
    started_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow)

class Activity(Base):
    __tablename__='activities'
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    student_id:Mapped[str]=mapped_column(ForeignKey('students.id',ondelete='CASCADE'),index=True)
    session_id:Mapped[str]=mapped_column(ForeignKey('learning_sessions.id',ondelete='CASCADE'),index=True)
    category:Mapped[str]=mapped_column(String(50))
    key:Mapped[str]=mapped_column(String(160))
    correct:Mapped[bool|None]=mapped_column(Boolean,nullable=True)
    score:Mapped[float|None]=mapped_column(Float,nullable=True)
    details_json:Mapped[str]=mapped_column(Text,default='{}')
    created_at:Mapped[datetime]=mapped_column(DateTime(timezone=True),default=utcnow)

class LessonProgress(Base):
    __tablename__='lesson_progress'; __table_args__=(UniqueConstraint('student_id','lesson_id'),)
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    student_id:Mapped[str]=mapped_column(ForeignKey('students.id',ondelete='CASCADE'),index=True)
    lesson_id:Mapped[str]=mapped_column(String(80))
    current_section:Mapped[int]=mapped_column(Integer,default=0)
    status:Mapped[str]=mapped_column(String(30),default='in_progress')
    review_stage:Mapped[int]=mapped_column(Integer,default=0)
    next_review:Mapped[datetime|None]=mapped_column(DateTime(timezone=True),nullable=True)

class VocabularyStat(Base):
    __tablename__='vocabulary_stats'; __table_args__=(UniqueConstraint('student_id','item_key'),)
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    student_id:Mapped[str]=mapped_column(ForeignKey('students.id',ondelete='CASCADE'),index=True)
    item_key:Mapped[str]=mapped_column(String(120))
    seen:Mapped[int]=mapped_column(Integer,default=0)
    correct:Mapped[int]=mapped_column(Integer,default=0)
    mastery:Mapped[float]=mapped_column(Float,default=0)
    next_review:Mapped[datetime|None]=mapped_column(DateTime(timezone=True),nullable=True)

class ErrorMemory(Base):
    __tablename__='error_memory'; __table_args__=(UniqueConstraint('student_id','error_key'),)
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    student_id:Mapped[str]=mapped_column(ForeignKey('students.id',ondelete='CASCADE'),index=True)
    error_key:Mapped[str]=mapped_column(String(120))
    error_type:Mapped[str]=mapped_column(String(120))
    wrong_example:Mapped[str]=mapped_column(Text)
    correct_example:Mapped[str]=mapped_column(Text)
    occurrences:Mapped[int]=mapped_column(Integer,default=1)
    stability:Mapped[float]=mapped_column(Float,default=0)
    next_review:Mapped[datetime|None]=mapped_column(DateTime(timezone=True),nullable=True)

class PronunciationStat(Base):
    __tablename__='pronunciation_stats'; __table_args__=(UniqueConstraint('student_id','target_key'),)
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    student_id:Mapped[str]=mapped_column(ForeignKey('students.id',ondelete='CASCADE'),index=True)
    target_key:Mapped[str]=mapped_column(String(120))
    phrase:Mapped[str]=mapped_column(Text)
    attempts:Mapped[int]=mapped_column(Integer,default=0)
    correct:Mapped[int]=mapped_column(Integer,default=0)

class SkillStat(Base):
    __tablename__='skill_stats'; __table_args__=(UniqueConstraint('student_id','skill'),)
    id:Mapped[int]=mapped_column(Integer,primary_key=True,autoincrement=True)
    student_id:Mapped[str]=mapped_column(ForeignKey('students.id',ondelete='CASCADE'),index=True)
    skill:Mapped[str]=mapped_column(String(80))
    attempts:Mapped[int]=mapped_column(Integer,default=0)
    correct:Mapped[int]=mapped_column(Integer,default=0)
    score_avg:Mapped[float]=mapped_column(Float,default=0)
