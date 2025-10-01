const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/collections', async (req, res) => {
    try {
        const collectionsUrl = 'https://data.inpe.br/bdc/stac/v1/collections';
        const response = await axios.get(collectionsUrl);
        const simplifiedCollections = response.data.collections.map(c => ({
            id: c.id,
            title: c.title
        }));
        res.json(simplifiedCollections);
    } catch (error) { res.status(500).json({ message: 'Falha ao buscar coleções.' }); }
});

app.post('/stac-search', async (req, res) => {
    try {
        const { latitude, longitude, collections, startDate, endDate } = req.body;
        if (!latitude || !longitude || !collections) {
            return res.status(400).json({ error: 'Parâmetros ausentes.' });
        }
        const stacUrl = 'https://data.inpe.br/bdc/stac/v1/search';
        const searchPayload = {
            "collections": collections,
            "intersects": { "type": "Point", "coordinates": [longitude, latitude] },
            "limit": 2500
        };
        if (startDate && endDate) {
            searchPayload.datetime = `${startDate}T00:00:00Z/${endDate}T23:59:59Z`;
        }
        const response = await axios.post(stacUrl, searchPayload);
        const simplifiedFeatures = response.data.features.map(f => {
             const props = f.properties;
             const dateString = props.datetime || props.start_datetime || props.end_datetime;
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
        console.error('ERRO /stac-search:', error.message);
        res.status(500).json({ message: 'Falha no STAC.' });
    }
});

app.get('/stac-item-details', async (req, res) => {
    try {
        const { collection, itemId } = req.query;
        const itemUrl = `https://data.inpe.br/bdc/stac/v1/collections/${collection}/items/${itemId}`;
        const response = await axios.get(itemUrl, { headers: { 'Accept': 'application/json' } });
        res.json(response.data);
    } catch (error) { res.status(500).json({ message: 'Falha ao buscar detalhes do item STAC.' }); }
});

app.listen(port, () => {
    console.log(`Servidor proxy rodando em http://localhost:${port}`);
});