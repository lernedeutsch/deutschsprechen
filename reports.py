from datetime import datetime,timedelta,timezone
from sqlalchemy import select
from nele.models import Activity,ErrorMemory,VocabularyStat

def weekly_report(db,student):
    since=datetime.now(timezone.utc)-timedelta(days=7)
    acts=db.execute(select(Activity).where(Activity.student_id==student.id,Activity.created_at>=since)).scalars().all()
    graded=[x for x in acts if x.correct is not None];correct=[x for x in graded if x.correct is True]
    errs=db.execute(select(ErrorMemory).where(ErrorMemory.student_id==student.id)).scalars().all()
    voc=db.execute(select(VocabularyStat).where(VocabularyStat.student_id==student.id)).scalars().all()
    return {'student_id':student.id,'name':student.name,'period_days':7,'activities':len(acts),'accuracy':round(100*len(correct)/max(1,len(graded))),'focus_next_week':{'errors':[e.correct_example for e in errs if e.stability<.6][:5],'vocabulary':[v.item_key for v in voc if v.mastery<.6][:8]}}
