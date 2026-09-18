from sqlalchemy import select,func
from nele.models import LessonProgress,VocabularyStat,ErrorMemory,SkillStat,Activity

def build_dashboard(db,student):
    lessons=db.execute(select(LessonProgress).where(LessonProgress.student_id==student.id)).scalars().all()
    vocab=db.execute(select(VocabularyStat).where(VocabularyStat.student_id==student.id)).scalars().all()
    errors=db.execute(select(ErrorMemory).where(ErrorMemory.student_id==student.id)).scalars().all()
    skills=db.execute(select(SkillStat).where(SkillStat.student_id==student.id)).scalars().all()
    count=db.execute(select(func.count(Activity.id)).where(Activity.student_id==student.id)).scalar_one()
    return {'student':{'id':student.id,'name':student.name,'level':student.level,'last_topic':student.last_topic},'activity_count':count,'lessons':[{'lesson_id':x.lesson_id,'status':x.status,'current_section':x.current_section} for x in lessons],'vocabulary':[{'item_key':x.item_key,'seen':x.seen,'mastery':round(x.mastery,2)} for x in vocab],'errors':[{'error_key':x.error_key,'type':x.error_type,'occurrences':x.occurrences,'stability':round(x.stability,2)} for x in errors],'skills':[{'skill':x.skill,'attempts':x.attempts,'correct':x.correct,'score_avg':round(x.score_avg,2)} for x in skills]}
