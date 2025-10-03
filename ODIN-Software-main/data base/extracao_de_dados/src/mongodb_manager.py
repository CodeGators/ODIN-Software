import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class MongoDBManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.uri = os.getenv("MONGO_URI")
        self.db_name = "seu_banco_de_dados"
        
    def connect(self):
        """Conecta-se ao MongoDB."""
        try:
            self.client = MongoClient(self.uri)
            self.db = self.client[self.db_name]
            print("Conectado ao MongoDB!")
        except Exception as e:
            print(f"Erro ao conectar ao MongoDB: {e}")
            self.client = None

    def close_connection(self):
        """Fecha a conexão com o MongoDB."""
        if self.client:
            self.client.close()
            print("Conexão com MongoDB fechada.")

    def insert_one(self, collection_name, document):
        """Insere um único documento em uma coleção."""
        if self.db:
            collection = self.db[collection_name]
            result = collection.insert_one(document)
            return result.inserted_id
        return None

    def insert_many(self, collection_name, documents):
        """Insere múltiplos documentos em uma coleção."""
        if self.db:
            collection = self.db[collection_name]
            result = collection.insert_many(documents)
            return result.inserted_ids
        return []