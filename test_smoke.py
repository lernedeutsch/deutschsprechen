import os
os.environ['DATABASE_URL']='sqlite:///:memory:'
from app import app

def test_health():
    c=app.test_client();r=c.get('/health');assert r.status_code==200 and r.get_json()['ok'] is True

def test_status():
    c=app.test_client();r=c.get('/status');d=r.get_json();assert d['service']=='Nele 3.0' and d['full_reset'] is True
