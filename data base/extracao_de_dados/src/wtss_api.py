import os
import requests
from dotenv import load_dotenv

load_dotenv()

class WTSS_API:
    def __init__(self):
        self.base_url = os.getenv("WTSS_API_URL")

    def get_timeseries(self, collection, latitude, longitude, attributes, start_date, end_date):
        """Obtém uma série temporal da API WTSS."""
        try:
            params = {
                "collection": collection,
                "latitude": latitude,
                "longitude": longitude,
                "attributes": attributes,
                "start_date": start_date,
                "end_date": end_date
            }
            response = requests.get(self.base_url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Erro na requisição à API WTSS: {e}")
            return None