from .mongodb_manager import MongoDBManager
from .stac_api import STAC_API
from .wtss_api import WTSS_API
from datetime import datetime

class ETLProcess:
    def __init__(self):
        self.db_manager = MongoDBManager()
        self.stac_api = STAC_API()
        self.wtss_api = WTSS_API()
        
    def run(self):
        self.db_manager.connect()
        if not self.db_manager.client:
            return

        try:
            # 1. Extração da API STAC do INPE
            # Ajuste esses parâmetros para buscar os dados desejados
            search_params = {
                "collections": ["SENTINEL-2-L2A-SR"], # Exemplo de coleção do INPE
                "bbox": [-52.0, -18.0, -51.0, -17.0],  # Exemplo de área (Goiânia/GO)
                "datetime": "2023-01-01T00:00:00Z/2023-01-31T23:59:59Z", # Exemplo de período
                "limit": 10 # Limita o número de itens para o teste
            }
            stac_data = self.stac_api.search_items(search_params)

            if stac_data and 'features' in stac_data:
                for item_stac in stac_data['features']:
                    # 2. Transformação para o modelo de IMAGEM_SATELITES
                    doc_imagem = {
                        "stac_id": item_stac['id'],
                        "url_imagem": item_stac['assets']['visual']['href'], # Pegando a URL da imagem
                        "data_captura": item_stac['properties']['datetime'],
                        "localizacao": {
                            "type": "Point",
                            "coordinates": item_stac['geometry']['coordinates']
                        },
                        "metadados_stac": {
                            "nuvens": item_stac['properties'].get('cloud_cover', None),
                            "ndvi": item_stac['properties'].get('ndvi', None), # Exemplo de metadados
                            "evi": item_stac['properties'].get('evi', None),
                            "outros": item_stac.get('properties', {})
                        }
                    }
                    
                    # 3. Inserção na coleção IMAGEM_SATELITES
                    id_imagem = self.db_manager.insert_one("IMAGEM_SATELITES", doc_imagem)
                    
                    if id_imagem:
                        # 4. Extração da API WTSS do INPE
                        # A WTSS do INPE usa latitude e longitude separadamente
                        lon = item_stac['geometry']['coordinates'][0]
                        lat = item_stac['geometry']['coordinates'][1]
                        
                        # Extrai a data da string ISO
                        data_str = item_stac['properties']['datetime']
                        data_obj = datetime.fromisoformat(data_str.replace('Z', '+00:00'))
                        data_formatada = data_obj.strftime("%Y-%m-%d")

                        wtss_data = self.wtss_api.get_timeseries(
                            collection="SENTINEL-2-L2A-SR",
                            latitude=lat,
                            longitude=lon,
                            attributes=["B4", "B8"], # Exemplo de bandas para cálculo de NDVI
                            start_date=data_formatada,
                            end_date=data_formatada
                        )
                        
                        if wtss_data and 'timeseries' in wtss_data:
                            # 5. Transformação e Inserção para SERIE_TEMPORAL
                            # O BDC retorna um array com as séries, uma para cada atributo solicitado
                            for serie in wtss_data['timeseries']:
                                doc_serie = {
                                    "imagem_satelite_id": id_imagem,
                                    "serie_temporal": {
                                        "date": serie.get('date', None),
                                        "values": serie.get('values', [])
                                    }
                                }
                                self.db_manager.insert_one("SERIE_TEMPORAL", doc_serie)
        
        finally:
            self.db_manager.close_connection()