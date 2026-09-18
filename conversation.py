import re
from nele.models import jl
from nele.memory.store import create_session,get_session,state,save_state,active,set_active
from nele.core.teacher_brain import select_next_action
from nele.trainers.action_runner import render_action,process_answer

def extract_name(text):
    raw=text.strip()
    for p in [r'ich hei(?:ß|ss)e\s+([A-Za-zÄÖÜäöüß\-]+)',r'mein name ist\s+([A-Za-zÄÖÜäöüß\-]+)',r'ich bin\s+([A-Za-zÄÖÜäöüß\-]+)']:
        m=re.search(p,raw,re.I)
        if m:return m.group(1).title()
    if len(raw.split())<=2 and raw.replace('-','').isalpha():return raw.title()
    return None

def start_learning_session(db,student,force_new=True):
    if student.name:
        reply=f'Hallo {student.name}! Schön, dass du wieder da bist. Wie geht es dir heute?'
        st={'phase':'checkin','last_topic':student.last_topic}
    else:
        reply='Hallo! Schön, dass du da bist. Ich bin Nele, deine Deutschtrainerin. Wie heißt du?'
        st={'phase':'ask_name','last_topic':None}
    s=create_session(db,student,st)
    return s,reply,{'phase':st['phase'],'new_session':True}

def natural_turn(student,st,msg):
    ph=st.get('phase')
    if ph=='ask_name':
        name=extract_name(msg)
        if not name:return 'Sag es bitte als ganzen Satz, zum Beispiel: „Ich heiße Moni.“',{'phase':'ask_name'},False
        student.name=name
        return f'Schön, dich kennenzulernen, {name}! Wie geht es dir heute?',{'phase':'checkin'},False
    if ph=='checkin':
        if student.last_topic:
            return f'Schön. Letztes Mal haben wir über {student.last_topic} gesprochen. Erzähl mir kurz: Was weißt du noch davon?',{'phase':'recall'},False
        return 'Schön. Was hast du heute gemacht?',{'phase':'daily'},False
    if ph=='daily':return 'Danke. Erzähl mir noch einen kurzen Satz dazu.',{'phase':'smalltalk2'},False
    if ph=='smalltalk2':return 'Gut. Dann machen wir jetzt einen kurzen Lernschritt.',{'phase':'learning'},True
    if ph=='recall':return 'Gut, wir knüpfen daran an. Danach machen wir nur einen neuen Schritt.',{'phase':'learning'},True
    return '',{'phase':'learning'},True

def handle_message(db,student,message,session_id=None):
    s=get_session(db,session_id,student.id)
    if not s or s.finished:
        s,reply,meta=start_learning_session(db,student,True)
        return {'session_id':s.id,'reply':reply,'finished':False,'meta':meta}
    st=state(s); act=active(s)
    if st.get('phase')!='learning' and not act:
        reply,patch,enter=natural_turn(student,st,message);st.update(patch);save_state(s,st)
        if not enter:return {'session_id':s.id,'reply':reply,'finished':False,'meta':{'phase':st.get('phase')}}
        a=select_next_action(db,student,s);prompt,ast=render_action(db,student,s,a);set_active(s,ast)
        return {'session_id':s.id,'reply':'\n\n'.join(x for x in [reply,prompt] if x),'finished':a['type']=='session_summary','meta':{'phase':'learning','action':a['type']}}
    if not act:
        a=select_next_action(db,student,s);prompt,ast=render_action(db,student,s,a);set_active(s,ast)
        if a['type']=='session_summary':s.finished=True
        return {'session_id':s.id,'reply':prompt,'finished':s.finished,'meta':{'action':a['type']}}
    result=process_answer(db,student,s,act,message)
    if not result.get('completed'):
        set_active(s,result.get('state',act));return {'session_id':s.id,'reply':result.get('message',''),'finished':False,'meta':{'action':act.get('type'),'retry':True}}
    set_active(s,{})
    feedback=(result.get('message') or '').strip()
    a=select_next_action(db,student,s);prompt,ast=render_action(db,student,s,a)
    if a['type']=='session_summary':s.finished=True
    else:set_active(s,ast)
    return {'session_id':s.id,'reply':'\n\n'.join(x for x in [feedback,prompt] if x),'finished':s.finished,'meta':{'action':a['type']}}
