import urllib.request, urllib.parse, http.cookiejar, json, sys, time

BASE = 'http://localhost:4000'

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))

print('=== fetch csrf token ===')
csrf = None
try:
    r = opener.open(f'{BASE}/api/csrf-token', timeout=10)
    body = r.read().decode()
    print('csrf raw:', body)
    csrf = json.loads(body).get('csrfToken')
    print('csrf token:', csrf)
except Exception as e:
    print('csrf ERR', e)

print('\n=== run-code test ===')
try:
    headers = {'Content-Type':'application/json'}
    if csrf:
        headers['X-CSRF-Token'] = csrf
    payload = json.dumps({"language":"python","code":"print(\"hello from server\")"}).encode()
    req = urllib.request.Request(f'{BASE}/api/tasks/run-code', data=payload, headers=headers)
    r = opener.open(req, timeout=15)
    print('run-code response:', r.read().decode())
except Exception as e:
    print('run-code ERR', e)

print('\n=== csrf token fetch ===')
csrf = None
try:
    r = opener.open(f'{BASE}/api/csrf-token', timeout=10)
    body = r.read().decode()
    print('csrf raw:', body)
    csrf = json.loads(body).get('csrfToken')
    print('csrf token:', csrf)
except Exception as e:
    print('csrf ERR', e)

print('\n=== feedback submit ===')
if not csrf:
    print('No csrf token, cannot submit feedback')
    sys.exit(0)
try:
    payload = json.dumps({"email":"test+script@example.com","message":"test feedback","rating":5}).encode()
    req = urllib.request.Request(f'{BASE}/api/feedback', data=payload, headers={'Content-Type':'application/json', 'X-CSRF-Token': csrf})
    r = opener.open(req, timeout=15)
    print('feedback response:', r.read().decode())
except Exception as e:
    print('feedback ERR', e)
