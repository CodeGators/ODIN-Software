import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';

// --- Interfaces para Tipagem ---
// Melhora a previsibilidade e autocompletar do código

// Define a estrutura do corpo da requisição para a rota /stac-search
interface StacSearchRequestBody {
    latitude: number;
    longitude: number;
    collections: string[];
    startDate?: string;
    endDate?: string;
}

// Define a estrutura da query string para a rota /stac-item-details
interface StacItemDetailsQuery {
    collection: string;
    itemId: string;
}

// Define a estrutura do payload enviado para a API externa
interface StacSearchPayload {
    collections: string[];
    intersects: {
        type: "Point";
        coordinates: [number, number];
    };
    limit: number;
    datetime?: string;
}

// --- Aplicação Express ---

const app = express();
const port: number = 3000;

app.use(cors());
app.use(express.json());

/**
 * Rota para buscar a lista de coleções disponíveis.
 */
app.get('/collections', async (req: Request, res: Response) => {
    try {
        const collectionsUrl = 'https://data.inpe.br/bdc/stac/v1/collections';
        const response = await axios.get<{ collections: any[] }>(collectionsUrl);

        // Mapeia a resposta para um formato simplificado e tipado
        const simplifiedCollections = response.data.collections.map(c => ({
            id: c.id,
            title: c.title
        }));

        res.json(simplifiedCollections);
    } catch (error) {
        console.error('Erro ao buscar coleções:', error);
        res.status(500).json({ message: 'Falha ao buscar coleções.' });
    }
});

/**
 * Rota para realizar uma busca na API STAC com base em localização, coleções e datas.
 */
app.post('/stac-search', async (req: Request<{}, {}, StacSearchRequestBody>, res: Response) => {
    try {
        const { latitude, longitude, collections, startDate, endDate } = req.body;

        if (!latitude || !longitude || !collections) {
            return res.status(400).json({ error: 'Parâmetros ausentes (latitude, longitude, collections).' });
        }

        const stacUrl = 'https://data.inpe.br/bdc/stac/v1/search';

        const searchPayload: StacSearchPayload = {
            "collections": collections,
            "intersects": { "type": "Point", "coordinates": [longitude, latitude] },
            "limit": 2500
        };

        if (startDate && endDate) {
            searchPayload.datetime = `${startDate}T00:00:00Z/${endDate}T23:59:59Z`;
        }

        const response = await axios.post<{ features: any[] }>(stacUrl, searchPayload);

        // Mapeia os resultados para um formato mais simples
        const simplifiedFeatures = response.data.features.map(f => {
             const props = f.properties;
             const dateString: string | undefined = props.datetime || props.start_datetime || props.end_datetime;
             const date = dateString ? dateString.split('T')[0] : 'N/A';

             return {
                id: f.id,
                collection: f.collection,
                date: date,
                cloud_cover: props['eo:cloud_cover']
            };
        });

        res.json(simplifiedFeatures);
    } catch (error) {
        // Verifica se o erro é do Axios para logar mais detalhes
        if (axios.isAxiosError(error)) {
            console.error('ERRO /stac-search:', error.response?.data || error.message);
        } else {
            console.error('ERRO /stac-search:', error);
        }
        res.status(500).json({ message: 'Falha na busca STAC.' });
    }
});

/**
 * Rota para buscar os detalhes de um item STAC específico.
 */
app.get('/stac-item-details', async (req: Request<{}, {}, {}, StacItemDetailsQuery>, res: Response) => {
    try {
        const { collection, itemId } = req.query;

        if (!collection || !itemId) {
            return res.status(400).json({ error: 'Parâmetros "collection" e "itemId" são obrigatórios.' });
        }

        const itemUrl = `https://data.inpe.br/bdc/stac/v1/collections/${collection}/items/${itemId}`;
        const response = await axios.get(itemUrl, { headers: { 'Accept': 'application/json' } });

        res.json(response.data);
    } catch (error) {
        console.error('Erro ao buscar detalhes do item STAC:', error);
        res.status(500).json({ message: 'Falha ao buscar detalhes do item STAC.' });
    }
});

app.listen(port, () => {
    console.log(`Servidor proxy rodando em http://localhost:${port}`);
});