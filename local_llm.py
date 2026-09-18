import os,requests

def complete(system_prompt,user_prompt):
    base=os.getenv('OLLAMA_BASE_URL')
    if not base:return None
    try:
        r=requests.post(base.rstrip('/')+'/api/generate',json={'model':os.getenv('OLLAMA_MODEL','qwen2.5:3b'),'prompt':system_prompt+'\n\n'+user_prompt,'stream':False},timeout=20);r.raise_for_status();return (r.json().get('response') or '').strip() or None
    except Exception:return None
