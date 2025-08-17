from app import app

with app.test_client() as c:
    data = {'file': (open('test_sample.csv','rb'), 'test_sample.csv')}
    rv = c.post('/analyze', data=data, content_type='multipart/form-data')
    print('STATUS', rv.status_code)
    text = rv.get_data(as_text=True)
    print(text[:2000])
