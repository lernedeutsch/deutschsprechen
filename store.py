from datetime import datetime,timedelta,timezone
from sqlalchemy import select,delete
from nele.models import Student,LearningSession,Activity,LessonProgress,VocabularyStat,ErrorMemory,PronunciationStat,SkillStat,jd,jl

def now(): return datetime.now(timezone.utc)
def get_student(db,sid): return db.get(Student,sid) if sid else None

def get_or_create_student(db,sid=None,name=None,level='A1'):
    s=get_student(db,sid)
    if s:
        if name and not s.name: s.name=name
        return s
    s=Student(id=sid or None,name=name,level=level or 'A1'); db.add(s); db.flush(); return s

def reset_student(db,sid):
    s=get_student(db,sid)
    if not s: return False
    for m in [Activity,LearningSession,LessonProgress,VocabularyStat,ErrorMemory,PronunciationStat,SkillStat]:
        db.execute(delete(m).where(m.student_id==sid))
    db.delete(s); db.flush(); return True

def create_session(db,student,state):
    x=LearningSession(student_id=student.id,state_json=jd(state),active_json='{}'); db.add(x); db.flush(); return x

def get_session(db,sid,student_id):
    x=db.get(LearningSession,sid) if sid else None
    return x if x and x.student_id==student_id else None

def state(session): return jl(session.state_json,{})
def save_state(session,v): session.state_json=jd(v)
def active(session): return jl(session.active_json,{})
def set_active(session,v): session.active_json=jd(v or {})

def log_activity(db,student_id,session_id,category,key,correct=None,score=None,details=None):
    a=Activity(student_id=student_id,session_id=session_id,category=category,key=key,correct=correct,score=score,details_json=jd(details or {})); db.add(a)
    s=db.get(LearningSession,session_id)
    if s:
        s.activity_count+=1
        if correct is True: s.correct_count+=1
    return a

def lesson_progress(db,sid,lid):
    x=db.execute(select(LessonProgress).where(LessonProgress.student_id==sid,LessonProgress.lesson_id==lid)).scalars().first()
    if not x: x=LessonProgress(student_id=sid,lesson_id=lid); db.add(x); db.flush()
    return x

def complete_lesson_section(db,p,idx,count):
    p.current_section=max(p.current_section,idx+1)
    if p.current_section>=count:
        p.status='completed'; p.review_stage=1; p.next_review=now()+timedelta(days=2)

def update_vocabulary(db,sid,key,correct):
    x=db.execute(select(VocabularyStat).where(VocabularyStat.student_id==sid,VocabularyStat.item_key==key)).scalars().first()
    if not x: x=VocabularyStat(student_id=sid,item_key=key); db.add(x); db.flush()
    x.seen+=1; x.correct+=1 if correct else 0; x.mastery=x.correct/max(1,x.seen); x.next_review=now()+timedelta(days=3 if correct else 1); return x

def record_error(db,sid,key,typ,wrong,correct,resolved=False):
    x=db.execute(select(ErrorMemory).where(ErrorMemory.student_id==sid,ErrorMemory.error_key==key)).scalars().first()
    if not x:
        x=ErrorMemory(student_id=sid,error_key=key,error_type=typ,wrong_example=wrong,correct_example=correct,stability=.4 if resolved else 0); db.add(x); db.flush()
    elif resolved: x.stability=min(1,x.stability+.25)
    else: x.occurrences+=1; x.stability=max(0,x.stability-.12)
    x.next_review=now()+timedelta(days=3 if resolved else 1); return x

def update_pronunciation(db,sid,key,phrase,correct):
    x=db.execute(select(PronunciationStat).where(PronunciationStat.student_id==sid,PronunciationStat.target_key==key)).scalars().first()
    if not x: x=PronunciationStat(student_id=sid,target_key=key,phrase=phrase); db.add(x); db.flush()
    x.attempts+=1; x.correct+=1 if correct else 0; return x

def update_skill(db,sid,skill,correct,score):
    x=db.execute(select(SkillStat).where(SkillStat.student_id==sid,SkillStat.skill==skill)).scalars().first()
    if not x: x=SkillStat(student_id=sid,skill=skill); db.add(x); db.flush()
    old=x.attempts; x.attempts+=1; x.correct+=1 if correct else 0; x.score_avg=((x.score_avg*old)+float(score))/x.attempts; return x
