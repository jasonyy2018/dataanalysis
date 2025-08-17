import requests, json
r = requests.post('http://127.0.0.1:5000/analyze', files={'file': open('test_sample.csv','rb')})
print('STATUS', r.status_code)
print(r.text[:1000])
