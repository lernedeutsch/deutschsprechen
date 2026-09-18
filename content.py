LESSON={
'id':'A1.1','title':'Guten Tag! — Begrüßung und Vorstellung','topic':'Begrüßung und Vorstellung','level':'A1',
'sections':[
 {'title':'Wir begrüßen uns','teach':'Im Deutschen begrüßen wir uns je nach Tageszeit mit Guten Morgen, Guten Tag oder Guten Abend. Hallo ist informell.','example':'Guten Morgen!','prompt':'Begrüße Nele am Morgen.','expected':['Guten Morgen','Guten Morgen Nele'],'focus_vocab':['guten_morgen','guten_tag','hallo']},
 {'title':'Ich stelle mich vor','teach':'Du kannst dich mit „Ich heiße …“, „Mein Name ist …“ oder „Ich bin …“ vorstellen.','example':'Ich heiße Moni.','prompt':'Stell dich in einem ganzen Satz vor.','expected':['Ich heiße','Mein Name ist','Ich bin'],'focus_vocab':['ich_heisse']},
 {'title':'Das deutsche Alphabet','teach':'Jetzt üben wir das Buchstabieren.','example':'M – O – N – I','prompt':'Buchstabiere deinen Vornamen.','expected':['M O N I','M-O-N-I','M – O – N – I'],'focus_vocab':[]}
],
'review':{'prompt':'Nenne einen Gruß und stelle dich danach kurz vor.','expected':['Guten Tag','Hallo','Ich heiße','Mein Name ist','Ich bin']}}
VOCAB={
'fertig':{'word':'fertig','translation_pl':'gotowy / skończony','definition_de':'bereit oder zu Ende','example':'Ich bin um 15 Uhr fertig.'},
'guten_morgen':{'word':'Guten Morgen','translation_pl':'dzień dobry rano','definition_de':'Gruß am Morgen'},
'guten_tag':{'word':'Guten Tag','translation_pl':'dzień dobry','definition_de':'Gruß am Tag'},
'hallo':{'word':'Hallo','translation_pl':'cześć','definition_de':'informeller Gruß'},
'ich_heisse':{'word':'ich heiße','translation_pl':'nazywam się','definition_de':'Form, um den eigenen Namen zu sagen'}}
DIALOGUES={
'alltag':[{'id':'smalltalk','prompt':'Was machst du heute noch?','keywords':[],'followup':'Interessant. Erzähl mir noch einen Satz dazu.'}],
'arbeit':[{'id':'hotel-handtuch','prompt':'Entschuldigung, könnten Sie mir bitte zwei frische Handtücher bringen?','keywords':['natürlich','gerne','sofort','bringe'],'followup':'Vielen Dank.'}]
}
def lessons_for_level(level): return [{'id':'A1.1','title':LESSON['title']}] if level.upper()=='A1' else []
def lesson(i): return LESSON if i=='A1.1' else {}
def get_vocab_item(k): return VOCAB.get(k)
def dialogues(t): return {'scenarios':DIALOGUES.get(t,DIALOGUES['alltag'])}
