from flask import Flask,jsonify,request
from flask_cors import CORS
from config import Config
from nele.db import init_db,session_scope
from nele.memory.store import get_or_create_student,get_student,reset_student
from nele.core.conversation import start_learning_session,handle_message
from nele.core.dashboard import build_dashboard
from nele.core.reports import weekly_report

app=Flask(__name__);app.config['SECRET_KEY']=Config.SECRET_KEY;CORS(app,origins=Config.CORS_ORIGINS);init_db()
@app.get('/')
def root():return jsonify({'ok':True,'service':'Nele 3.0'})
@app.get('/health')
def health():return jsonify({'ok':True})
@app.get('/status')
def status():return jsonify({'ok':True,'service':'Nele 3.0','teacher_brain':True,'persistent_memory':True,'natural_conversation':True,'session_memory':True,'full_reset':True,'paid_api_required':False,'lesson_count':1})
@app.post('/api/students')
def create_student_api():
    d=request.get_json(silent=True) or {}
    with session_scope() as db:
        s=get_or_create_student(db,d.get('student_id'),d.get('name'),d.get('level','A1'));return jsonify({'student_id':s.id,'name':s.name,'level':s.level})
@app.post('/api/session/start')
def start_api():
    d=request.get_json(silent=True) or {}
    with session_scope() as db:
        s=get_or_create_student(db,d.get('student_id'),d.get('name'),d.get('level','A1'));sess,reply,meta=start_learning_session(db,s,True);return jsonify({'student_id':s.id,'session_id':sess.id,'reply':reply,'meta':meta,'finished':False})
@app.post('/chat')
@app.post('/api/chat')
def chat():
    d=request.get_json(silent=True) or {};msg=(d.get('message') or d.get('text') or '').strip()
    with session_scope() as db:
        s=get_or_create_student(db,d.get('student_id'),d.get('name'),d.get('level','A1'))
        if not msg:
            sess,reply,meta=start_learning_session(db,s,True);return jsonify({'student_id':s.id,'session_id':sess.id,'reply':reply,'meta':meta,'finished':False})
        r=handle_message(db,s,msg,d.get('session_id'));r['student_id']=s.id;return jsonify(r)
@app.post('/api/reset/<student_id>')
def reset_api(student_id):
    with session_scope() as db:return jsonify({'ok':True,'reset':reset_student(db,student_id)})
@app.get('/api/dashboard/<student_id>')
def dashboard(student_id):
    with session_scope() as db:
        s=get_student(db,student_id);return (jsonify(build_dashboard(db,s)) if s else (jsonify({'error':'student_not_found'}),404))
@app.get('/api/weekly/<student_id>')
def weekly(student_id):
    with session_scope() as db:
        s=get_student(db,student_id);return (jsonify(weekly_report(db,s)) if s else (jsonify({'error':'student_not_found'}),404))
@app.post('/api/tts')
def tts():return jsonify({'available':False,'fallback':'browser_speech_synthesis'}),503
@app.post('/api/asr')
def asr():return jsonify({'available':False,'fallback':'browser_speech_recognition'}),503
if __name__=='__main__':app.run(host='0.0.0.0',port=5000,debug=True)
