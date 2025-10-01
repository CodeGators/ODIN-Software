import os
import requests
from dotenv import load_dotenv

load_dotenv()

class STAC_API:
    def __init__(self):
        self.base_url = os.getenv("STAC_API_URL")

    def search_items(self, search_params):
        """Realiza uma busca por itens na API STAC."""
        try:
            # O endpoint de busca já está na variável de ambiente
            response = requests.post(self.base_url, json=search_params)
            response.raise_for_status() # Lança um erro para requisições HTTP ruins
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Erro na requisição à API STAC: {e}")
            return None