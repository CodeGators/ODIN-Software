import requests
from pymongo import MongoClient
from datetime import datetime

# --- 1. Configuração do MongoDB ---
MONGO_URI = "mongodb://localhost:27017/"  # Mude para sua URI de conexão
DATABASE_NAME = "ABP - 3 DSM - ODIN"
COLLECTION_NAME = "serie_temporal"

# --- 2. URLs de Extração (Fornecidas por você) ---
WTSS_URLS = [
    "https://data.inpe.br/bdc/wtss/v4/time_series?coverage=S2-16D-2&attributes=EVI&start_date=2017-09-01&end_date=2018-08-31&latitude=-15.5898283072306&longitude=-47.5288794633165",
    "https://data.inpe.br/bdc/wtss/v4/time_series?coverage=LANDSAT-16D-1&attributes=EVI&start_date=2017-09-01&end_date=2018-08-31&latitude=-15.5898283072306&longitude=-47.5288794633165",
    "https://data.inpe.br/bdc/wtss/v4/time_series?coverage=LANDSAT-MOZ_30_1M_STK-1&attributes=EVI&start_date=2017-09-01&end_date=2018-08-31&latitude=-15.5898283072306&longitude=-47.5288794633165",
    "https://data.inpe.br/bdc/wtss/v4/time_series?coverage=CBERS-WFI-8D-1&attributes=EVI&start_date=2017-09-01&end_date=2018-08-31&latitude=-15.5898283072306&longitude=-47.5288794633165",
    "https://data.inpe.br/bdc/wtss/v4/time_series?coverage=CBERS4-WFI-16D-2&attributes=EVI&start_date=2017-09-01&end_date=2018-08-31&latitude=-15.5898283072306&longitude=-47.5288794633165",
    "https://data.inpe.br/bdc/wtss/v4/time_series?coverage=CBERS4-MUX-2M-1&attributes=EVI&start_date=2017-09-01&end_date=2018-08-31&latitude=-15.5898283072306&longitude=-47.5288794633165",
    "https://data.inpe.br/bdc/wtss/v4/time_series?coverage=MOD13Q1-6.1&attributes=EVI&start_date=2017-09-01&end_date=2018-08-31&latitude=-15.5898283072306&longitude=-47.5288794633165",
    "https://data.inpe.br/bdc/wtss/v4/time_series?coverage=MYD13Q1-6.1&attributes=EVI&start_date=2017-09-01&end_date=2018-08-31&latitude=-15.5898283072306&longitude=-47.5288794633165",
]

def fetch_and_transform_data(url):
    """Busca o dado WTSS e o transforma em um formato de documento MongoDB."""
    print(f"Buscando dados de: {url.split('coverage=')[1].split('&')[0]}")
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()  # Levanta erro para códigos HTTP 4xx/5xx
        data = response.json()
    except requests.exceptions.RequestException as e:
        print(f"Erro ao buscar a URL {url}: {e}")
        return None

    # Extrai os metadados do próprio URL (para robustez)
    params = dict(item.split('=') for item in url.split('?')[1].split('&'))
    coverage_id = params.get('coverage')
    attribute = params.get('attributes')
    
    # O WTSS retorna arrays separados para tempo e valor (time-series-array format)
    timeline = data.get('timeline', [])
    
    # Assume que estamos lidando apenas com o primeiro atributo (EVI)
    values = data.get('result', {}).get(attribute, [])

    if not timeline or not values or len(timeline) != len(values):
        print(f"Dados incompletos ou desalinhados para {coverage_id}.")
        return None

    # Transforma em um array de objetos para MongoDB (formato de série temporal)
    time_series_data = []
    for date_str, value in zip(timeline, values):
        # Converte a string de data para o tipo BSON Date (datetime.datetime)
        # O WTSS usa o formato YYYY-MM-DD
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            date_obj = date_str # Mantém como string se a conversão falhar
            
        time_series_data.append({
            "date": date_obj,
            "value": value
        })

    # Cria o documento final para o MongoDB
    document = {
        "coverage_id": coverage_id,
        "satellite": coverage_id.split('-')[0], # Identificador simples do satélite
        "attribute": attribute,
        "location": {
            "type": "Point",
            "coordinates": [float(params.get('longitude')), float(params.get('latitude'))]
        },
        "start_date_param": params.get('start_date'),
        "end_date_param": params.get('end_date'),
        "time_series_data": time_series_data
    }
    
    return document

def main():
    """Função principal para execução do processo."""
    documents_to_insert = []
    
    # 1. Buscar e processar os dados de todas as URLs
    for url in WTSS_URLS:
        document = fetch_and_transform_data(url)
        if document:
            documents_to_insert.append(document)

    if not documents_to_insert:
        print("\nNenhum dado válido foi extraído para inserção. Encerrando.")
        return

    # 2. Conectar ao MongoDB e inserir os dados
    try:
        client = MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        collection = db[COLLECTION_NAME]
        
        print(f"\nConectado ao MongoDB. Inserindo {len(documents_to_insert)} documentos na coleção '{COLLECTION_NAME}'...")
        
        result = collection.insert_many(documents_to_insert)
        
        print(f"\n✅ Inserção concluída com sucesso!")
        print(f"Total de documentos inseridos: {len(result.inserted_ids)}")
        
    except Exception as e:
        print(f"\n❌ Erro ao conectar ou inserir no MongoDB: {e}")
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    main()