from app import app
from werkzeug.test import EnvironBuilder
from werkzeug.wrappers import Request

# Build a multipart/form-data request with the test CSV
builder = EnvironBuilder(method='POST', path='/analyze', data={'file': (open('test_sample.csv','rb'), 'test_sample.csv')})
env = builder.get_environ()

with app.request_context(env):
    # Dispatch the request within the Flask app
    resp = app.full_dispatch_request()
    print('STATUS', resp.status_code)
    text = resp.get_data(as_text=True)
    print(text[:2000])
