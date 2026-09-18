import re,unicodedata
from difflib import SequenceMatcher

def normalize(text):
    text=unicodedata.normalize('NFKC',text or '').lower().strip().replace('–','-').replace('—','-')
    return re.sub(r'\s+',' ',re.sub(r'[^a-zäöüß0-9\s\-]',' ',text)).strip()

def similarity(a,b):
    a,b=normalize(a),normalize(b)
    return SequenceMatcher(None,a,b).ratio() if a and b else 0.0

def evaluate_text(answer,expected,threshold=.72):
    ex=expected if isinstance(expected,list) else [expected]; ex=[x for x in ex if x]
    if not ex: return {'correct':bool(normalize(answer)),'score':1.0 if normalize(answer) else 0.0,'best':''}
    scored=[]; n=normalize(answer)
    for x in ex:
        nx=normalize(x); sim=similarity(answer,x); contains=nx in n or n in nx
        cov=len(set(n.split())&set(nx.split()))/max(1,len(set(nx.split())))
        scored.append((x,max(sim,cov,1.0 if contains else 0.0)))
    best,score=max(scored,key=lambda z:z[1])
    return {'correct':score>=threshold,'score':score,'best':best}

def classify_answer(a):
    n=normalize(a); w=n.split()
    return 'empty' if not n else ('very_short' if len(w)==1 else ('short' if len(w)<=3 else 'full'))

def detect_rule_errors(text):
    n=' '+normalize(text)+' '
    rules=[
      (r'\bin hotel\b','article_dative_in','in Hotel','in einem Hotel','Artikel / Dativ'),
      (r'\bmit meine\b','dative_mit_meine','mit meine','mit meiner','Dativ nach mit'),
      (r'\bmit mein mann\b','dative_mit_mann','mit mein Mann','mit meinem Mann','Dativ nach mit'),
      (r'\bmit der bus\b','dative_mit_bus','mit der Bus','mit dem Bus','Dativ nach mit'),
      (r'\bich fertig\b','sein_fertig','ich fertig','ich bin fertig','Verb sein')]
    return [{'key':k,'wrong':w,'correct':c,'type':t} for p,k,w,c,t in rules if re.search(p,n)]

def analyze_pronunciation(expected,transcript):
    s=similarity(expected,transcript)
    return {'correct':s>=.82,'score':s,'issues':[]}
