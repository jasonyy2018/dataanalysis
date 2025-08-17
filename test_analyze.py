import json
from app import app

def test_analyze_with_sample_csv():
    with app.test_client() as c:
        with open('test_sample.csv', 'rb') as f:
            data = {'file': (f, 'test_sample.csv')}
            rv = c.post('/analyze', data=data, content_type='multipart/form-data')
            assert rv.status_code == 200
            payload = rv.get_json()
            assert isinstance(payload, dict)
            # top-level fields
            assert 'dates' in payload
            assert 'forecast_dates' in payload
            assert 'results' in payload
            # MVP new fields
            assert 'labels' in payload
            assert 'values' in payload
            assert 'report' in payload
            # types
            assert isinstance(payload['dates'], list)
            assert isinstance(payload['forecast_dates'], list)
            assert isinstance(payload['results'], dict)
            assert isinstance(payload['labels'], list)
            assert isinstance(payload['values'], list)
            assert isinstance(payload['report'], str)
            # consistency
            assert len(payload['labels']) == len(payload['dates'])
            assert len(payload['values']) == len(payload['dates'])
            # if there are numeric columns, shapes match
            if payload['results']:
                numeric_columns = len(payload['results'])
                assert len(payload['values']) > 0
                assert isinstance(payload['values'][0], list)
                assert len(payload['values'][0]) == numeric_columns
            else:
                # no numeric columns
                assert payload['labels'] == []
                assert payload['values'] == []

def test_analyze_no_numeric_columns_payload():
    with app.test_client() as c:
        payload = {
            'data': [
                {'date': '2025-08-01', 'note': 'demo'},
                {'date': '2025-08-02', 'note': 'demo2'}
            ]
        }
        rv = c.post('/analyze', json=payload)
        assert rv.status_code == 200
        data = rv.get_json()
        assert isinstance(data, dict)
        assert 'dates' in data
        assert 'forecast_dates' in data
        assert 'results' in data
        assert 'labels' in data
        assert 'values' in data
        assert isinstance(data['dates'], list)
        assert isinstance(data['forecast_dates'], list)
        assert isinstance(data['results'], dict)
        assert isinstance(data['labels'], list)
        assert isinstance(data['values'], list)
        assert isinstance(data['report'], str)
        # since there are no numeric cols, labels/values should be empty
        assert data['labels'] == []
        assert data['values'] == []
