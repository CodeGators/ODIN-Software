// server/server.ts
import express, { Request, Response } from 'express';
import axios from 'axios';
import cors from 'cors';

// --- Interfaces para Tipagem ---

interface StacSearchRequestBody {
    latitude: number;
    longitude: number;
    collections: string[];
    startDate?: string;
    endDate?: string;
}

interface StacItemDetailsQuery {
    collection: string;
    itemId: string;
}

interface WtssQuery {
    coverage: string;
    latitude: string;
    longitude: string;
    attributes: string;
    startDate: string;
    endDate: string;
}

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

// Middleware para logar todas as requisições
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Recebida Requisição: ${req.method} ${req.originalUrl}`);
    console.log('Cabeçalhos da Requisição:', req.headers);
    next();
});


/**
 * Rota para buscar a lista de coleções disponíveis.
 */
app.get('/collections', async (req: Request, res: Response) => {
    const requestId = `[${new Date().toISOString()}] /collections`;
    console.log(`${requestId} - Iniciando processo.`);
    try {
        const collectionsUrl = 'https://data.inpe.br/bdc/stac/v1/collections';
        console.log(`${requestId} - Acessando URL externa: ${collectionsUrl}`);
        
        const response = await axios.get<{ collections: any[] }>(collectionsUrl);

        const simplifiedCollections = response.data.collections.map(c => ({
            id: c.id,
            title: c.title
        }));

        console.log(`${requestId} - Sucesso! Retornando ${simplifiedCollections.length} coleções.`);
        res.json(simplifiedCollections);
    } catch (error) {
        console.error(`${requestId} - Erro ao buscar coleções:`, error);
        res.status(500).json({ message: 'Falha ao buscar coleções.' });
    }
});

/**
 * Rota para realizar uma busca na API STAC.
 */
app.post('/stac-search', async (req: Request<{}, {}, StacSearchRequestBody>, res: Response) => {
    const requestId = `[${new Date().toISOString()}] /stac-search`;
    console.log(`${requestId} - Iniciando processo.`);
    try {
        const { latitude, longitude, collections, startDate, endDate } = req.body;
        console.log(`${requestId} - Corpo da Requisição (Body):`, req.body);

        if (!latitude || !longitude || !collections) {
            console.warn(`${requestId} - Requisição rejeitada: Parâmetros ausentes.`);
            return res.status(400).json({ error: 'Parâmetros ausentes (latitude, longitude, collections).' });
        }

        const stacUrl = 'https://data.inpe.br/bdc/stac/v1/search';
        const searchPayload: StacSearchPayload = {
            "collections": collections,
            "intersects": { "type": "Point", "coordinates": [longitude, latitude] },
            "limit": 1000
        };

        if (startDate && endDate) {
            searchPayload.datetime = `${startDate}T00:00:00Z/${endDate}T23:59:59Z`;
        }
        
        console.log(`${requestId} - Acessando URL externa: ${stacUrl}`);
        console.log(`${requestId} - Payload enviado para a API STAC:`, searchPayload);

        const response = await axios.post<{ features: any[] }>(stacUrl, searchPayload);

        const simplifiedFeatures = response.data.features.map(f => {
             const props = f.properties;
             const dateString: string | undefined = props.datetime || props.start_datetime || props.end_datetime;
             const date = dateString ? dateString.split('T')[0] : 'N/A';
             
             // --- ALTERAÇÃO AQUI ---
             const thumbnail = f.assets?.thumbnail?.href;
             // ---------------------

             return { 
                id: f.id, 
                collection: f.collection, 
                geometry: f.geometry, 
                date: date, 
                cloud_cover: props['eo:cloud_cover'],
                thumbnail: thumbnail // <-- E AQUI
             };
        });
        
        console.log(`${requestId} - Sucesso! Retornando ${simplifiedFeatures.length} resultados.`);
        res.json(simplifiedFeatures);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`${requestId} - Erro na chamada Axios:`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        } else {
            console.error(`${requestId} - Erro inesperado:`, error);
        }
        res.status(500).json({ message: 'Falha na busca STAC.' });
    }
});

/**
 * Rota para buscar os detalhes de um item STAC específico.
 */
app.get('/stac-item-details', async (req: Request<{}, {}, {}, StacItemDetailsQuery>, res: Response) => {
    const requestId = `[${new Date().toISOString()}] /stac-item-details`;
    console.log(`${requestId} - Iniciando processo.`);
    try {
        const { collection, itemId } = req.query;
        console.log(`${requestId} - Query da Requisição:`, req.query);

        if (!collection || !itemId) {
            console.warn(`${requestId} - Requisição rejeitada: Parâmetros ausentes.`);
            return res.status(400).json({ error: 'Parâmetros "collection" e "itemId" são obrigatórios.' });
        }

        const itemUrl = `https://data.inpe.br/bdc/stac/v1/collections/${collection}/items/${itemId}`;
        console.log(`${requestId} - Acessando URL externa: ${itemUrl}`);
        
        const response = await axios.get(itemUrl, { headers: { 'Accept': 'application/json' } });

        console.log(`${requestId} - Sucesso! Detalhes do item ${itemId} retornados.`);
        res.json(response.data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`${requestId} - Erro na chamada Axios:`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        } else {
            console.error(`${requestId} - Erro inesperado:`, error);
        }
        res.status(500).json({ message: 'Falha ao buscar detalhes do item STAC.' });
    }
});

/**
 * Rota para buscar uma série temporal da API WTSS.
 */
app.get('/wtss-timeseries', async (req: Request<{}, {}, {}, WtssQuery>, res: Response) => {
    const requestId = `[${new Date().toISOString()}] /wtss-timeseries`;
    console.log(`${requestId} - Iniciando processo.`);
    try {
        const { coverage, latitude, longitude, attributes, startDate, endDate } = req.query;
        console.log(`${requestId} - Query da Requisição:`, req.query);

        if (!coverage || !latitude || !longitude || !attributes || !startDate || !endDate) {
            console.warn(`${requestId} - Requisição rejeitada: Parâmetros ausentes.`);
            return res.status(400).json({ error: 'Parâmetros ausentes (coverage, latitude, longitude, attributes, startDate, endDate).' });
        }

        const wtssUrl = `https://data.inpe.br/bdc/wtss/v4/time_series`;
        const params = { coverage, latitude, longitude, attributes, start_date: startDate, end_date: endDate };
        
        console.log(`${requestId} - Acessando URL externa: ${wtssUrl}`);
        console.log(`${requestId} - Parâmetros enviados para a API WTSS:`, params);

        const response = await axios.get(wtssUrl, { params });

        console.log(`${requestId} - Sucesso! Resposta da API WTSS recebida.`);
        res.json(response.data);

    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`${requestId} - Erro na chamada Axios:`, {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            });
        } else {
            console.error(`${requestId} - Erro inesperado:`, error);
        }
        res.status(500).json({ message: 'Falha ao buscar série temporal do WTSS.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor proxy a postos e a rodar em http://localhost:${port}`);
});