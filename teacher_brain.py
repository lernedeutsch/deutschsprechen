from datetime import datetime,timezone
from sqlalchemy import select
from nele.models import ErrorMemory,VocabularyStat,LessonProgress,Activity
from nele.services.content import lesson

def due(dt):
    if not dt:return False
    n=datetime.now(timezone.utc)
    if dt.tzinfo is None:n=n.replace(tzinfo=None)
    return dt<=n

def select_next_action(db,student,session):
    acts=db.execute(select(Activity).where(Activity.session_id==session.id).order_by(Activity.id)).scalars().all()
    count=len(acts)
    if count>=7:return {'type':'session_summary'}
    reviewed={a.key for a in acts if a.category=='error'}
    errors=db.execute(select(ErrorMemory).where(ErrorMemory.student_id==student.id)).scalars().all()
    errors=[e for e in errors if e.error_key not in reviewed and (due(e.next_review) or e.stability<.25)]
    if errors and count>=2:
        errors.sort(key=lambda e:(-e.occurrences,e.stability)); return {'type':'error_review','error_key':errors[0].error_key}
    rv={a.key for a in acts if a.category=='vocabulary'}
    voc=db.execute(select(VocabularyStat).where(VocabularyStat.student_id==student.id)).scalars().all()
    voc=[v for v in voc if v.item_key not in rv and (due(v.next_review) or (v.seen and v.mastery<.45))]
    if voc and count>=2:
        voc.sort(key=lambda v:v.mastery); return {'type':'vocabulary','item_key':voc[0].item_key}
    lp=db.execute(select(LessonProgress).where(LessonProgress.student_id==student.id,LessonProgress.lesson_id=='A1.1')).scalars().first()
    sc=len(lesson('A1.1')['sections'])
    if not lp or lp.status!='completed':
        return {'type':'lesson','lesson_id':'A1.1','section_index':0 if not lp else min(lp.current_section,sc-1)}
    cats=[a.category for a in acts]
    if 'dialogue' not in cats:return {'type':'dialogue','topic':'arbeit' if student.occupation else 'alltag'}
    if 'pronunciation' not in cats:return {'type':'pronunciation','target_key':'core-a1','phrase':'Ich spreche jeden Tag ein bisschen Deutsch.'}
    return {'type':'session_summary'}
