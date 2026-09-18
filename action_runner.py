import random
from sqlalchemy import select
from nele.models import ErrorMemory
from nele.memory.store import log_activity,lesson_progress,complete_lesson_section,update_vocabulary,record_error,update_pronunciation,update_skill
from nele.services.content import lesson,get_vocab_item,dialogues
from nele.services.evaluator import evaluate_text,detect_rule_errors,analyze_pronunciation,classify_answer,normalize

POS=['Sehr gut.','Genau.','Super.','Das passt.','Richtig.']
def pos(session): return POS[session.activity_count%len(POS)]

def render_action(db,student,session,action):
    t=action['type']; st=dict(action); st['attempts']=0
    if t=='lesson':
        data=lesson(action['lesson_id']); secs=data.get('sections',[]); idx=min(action.get('section_index',0),len(secs)-1); sec=secs[idx]
        st.update(section_count=len(secs),expected=sec.get('expected',[]),focus_vocab=sec.get('focus_vocab',[]))
        parts=[sec.get('title',''),sec.get('teach','')]
        if sec.get('example'):parts.append('Beispiel: '+sec['example'])
        if sec.get('prompt'):parts.append(sec['prompt'])
        return '\n\n'.join(x for x in parts if x),st
    if t=='vocabulary':
        it=get_vocab_item(action['item_key']) or {'word':action['item_key'],'translation_pl':'','definition_de':''}; st['expected']=[it.get('translation_pl',''),it.get('definition_de','')]; st['word']=it['word']; return f'Kurze Wiederholung: Was bedeutet „{it["word"]}“?',st
    if t=='error_review':
        row=db.execute(select(ErrorMemory).where(ErrorMemory.student_id==student.id,ErrorMemory.error_key==action['error_key'])).scalars().first()
        if not row:return 'Wir machen weiter.',{'type':'skip'}
        st.update(expected=row.correct_example); return f'Wir wiederholen kurz etwas von früher. Wie sagst du es richtig?\n„{row.correct_example}“',st
    if t=='dialogue':
        sc=random.choice(dialogues(action.get('topic','alltag'))['scenarios']); st.update(scenario_id=sc['id'],expected=sc.get('keywords',[]),followup=sc.get('followup','Danke.')); return sc['prompt'],st
    if t=='pronunciation':
        st['expected']=action['phrase']; return f'Hör zu und sprich nach: „{action["phrase"]}“',st
    if t=='session_summary':
        n=student.name or ''; p=f'Gute Arbeit, {n}.' if n else 'Gute Arbeit.'; return f'{p} Für heute reicht es. Wir haben {session.activity_count} Lernschritte gemacht. Beim nächsten Mal machen wir sinnvoll weiter.',st
    return 'Wir machen weiter.',st

def process_answer(db,student,session,st,answer):
    t=st.get('type'); detected=detect_rule_errors(answer)
    for e in detected:record_error(db,student.id,e['key'],e['type'],e['wrong'],e['correct'],False)
    if t in (None,'skip','session_summary'):return {'completed':True,'message':''}
    if t=='lesson':
        r=evaluate_text(answer,st.get('expected',[]),.55); st['attempts']+=1
        if not r['correct'] and classify_answer(answer)=='full' and st.get('section_index') in (0,1):r['correct']=True;r['score']=max(r['score'],.65)
        if detected:return {'completed':False,'state':st,'message':f'Fast. Sag besser: „{detected[0]["correct"]}“. Versuch es noch einmal.'}
        if not r['correct'] and st['attempts']<2:return {'completed':False,'state':st,'message':f'Fast. Ein mögliches Muster ist: „{r.get("best","")}“. Versuch es noch einmal.'}
        p=lesson_progress(db,student.id,st['lesson_id']);complete_lesson_section(db,p,st['section_index'],st['section_count']);log_activity(db,student.id,session.id,'lesson',f'{st["lesson_id"]}:{st["section_index"]}',r['correct'],r['score']);student.last_topic=lesson(st['lesson_id'])['topic']
        for k in st.get('focus_vocab',[]):update_vocabulary(db,student.id,k,r['correct'])
        return {'completed':True,'message':pos(session) if r['correct'] else 'Das nehmen wir später noch einmal auf.'}
    if t=='vocabulary':
        r=evaluate_text(answer,st.get('expected',[]),.48); k=st.get('item_key') or st.get('word','').lower();update_vocabulary(db,student.id,k,r['correct']);log_activity(db,student.id,session.id,'vocabulary',k,r['correct'],r['score']);return {'completed':True,'message':pos(session) if r['correct'] else f'Fast. „{st.get("word")}“ bedeutet: {r.get("best")}.'}
    if t=='error_review':
        r=evaluate_text(answer,st.get('expected',''),.72);row=db.execute(select(ErrorMemory).where(ErrorMemory.student_id==student.id,ErrorMemory.error_key==st['error_key'])).scalars().first();record_error(db,student.id,row.error_key,row.error_type,row.wrong_example,row.correct_example,r['correct']);log_activity(db,student.id,session.id,'error',st['error_key'],r['correct'],r['score']);return {'completed':True,'message':pos(session) if r['correct'] else f'Richtig ist: „{st.get("expected")}“.'}
    if t=='dialogue':
        exp=st.get('expected',[]); n=normalize(answer); ok=(len(n.split())>=3 if not exp else any(normalize(k) in n for k in exp));log_activity(db,student.id,session.id,'dialogue',st['scenario_id'],ok,.8 if ok else .5);update_skill(db,student.id,'speaking',ok,.8 if ok else .5);return {'completed':True,'message':st.get('followup','Danke.')+(' Sehr gut reagiert.' if ok else ' Gute Idee. Sag es beim nächsten Mal etwas vollständiger.')}
    if t=='pronunciation':
        r=analyze_pronunciation(st['phrase'],answer);update_pronunciation(db,student.id,st['target_key'],st['phrase'],r['correct']);log_activity(db,student.id,session.id,'pronunciation',st['target_key'],r['correct'],r['score']);return {'completed':True,'message':'Sehr gut ausgesprochen.' if r['correct'] else 'Gut versucht. Wir nehmen den Satz später noch einmal.'}
    return {'completed':True,'message':''}
