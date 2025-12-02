export const SATELLITE_CONFIG = {
    // --- SENTINEL-2 ---
    'S2-16D-2': {
      label: 'Sentinel-2 (16 Dias)',
      attributes: [
        { id: 'NDVI', label: 'NDVI (Índice de Vegetação)' },
        { id: 'EVI', label: 'EVI (Índice de Vegetação Melhorado)' },
        { id: 'B02', label: 'B02 (Blue)' },
        { id: 'B03', label: 'B03 (Green)' },
        { id: 'B04', label: 'B04 (Red)' },
        { id: 'B08', label: 'B08 (NIR)' },
        { id: 'B11', label: 'B11 (SWIR 1)' },
        { id: 'B12', label: 'B12 (SWIR 2)' }
      ]
    },
    
    // --- LANDSAT ---
    'LANDSAT-16D-1': {
      label: 'Landsat 8/9 (16 Dias)',
      attributes: [
        { id: 'NDVI', label: 'NDVI' },
        { id: 'EVI', label: 'EVI' },
        { id: 'blue', label: 'Blue (B2)' },
        { id: 'green', label: 'Green (B3)' },
        { id: 'red', label: 'Red (B4)' },
        { id: 'nir08', label: 'NIR (B5)' },
        { id: 'swir16', label: 'SWIR 1 (B6)' },
        { id: 'swir22', label: 'SWIR 2 (B7)' }
      ]
    },
  
    // --- CBERS 4 WFI ---
    'CBERS4-WFI-16D-2': {
      label: 'CBERS-4 WFI (16 Dias)',
      attributes: [
        { id: 'NDVI', label: 'NDVI' },
        { id: 'EVI', label: 'EVI' },
        { id: 'BAND13', label: 'Band 13 (Blue)' },
        { id: 'BAND14', label: 'Band 14 (Green)' },
        { id: 'BAND15', label: 'Band 15 (Red)' },
        { id: 'BAND16', label: 'Band 16 (NIR)' }
      ]
    },
    
    // --- CBERS 4 MUX ---
    'CBERS4-MUX-2M-1': {
      label: 'CBERS-4 MUX (2 Meses)',
      attributes: [
        { id: 'NDVI', label: 'NDVI' },
        { id: 'EVI', label: 'EVI' },
        { id: 'BAND5', label: 'Band 5 (Blue)' },
        { id: 'BAND6', label: 'Band 6 (Green)' },
        { id: 'BAND7', label: 'Band 7 (Red)' },
        { id: 'BAND8', label: 'Band 8 (NIR)' }
      ]
    },
  
    // --- MODIS (TERRA) ---
    'MOD13Q1-6.1': { // Verifique se o ID na API é maiúsculo ou minúsculo (mod13q1-6.1)
      label: 'MODIS Terra (Vegetação)',
      attributes: [
        { id: 'NDVI', label: 'NDVI' },
        { id: 'EVI', label: 'EVI' },
        { id: 'red_reflectance', label: 'Red Reflectance' },
        { id: 'NIR_reflectance', label: 'NIR Reflectance' }
      ]
    },
  
    // --- MODIS (AQUA) ---
    'MYD13Q1-6.1': {
      label: 'MODIS Aqua (Vegetação)',
      attributes: [
        { id: 'NDVI', label: 'NDVI' },
        { id: 'EVI', label: 'EVI' },
        { id: 'red_reflectance', label: 'Red Reflectance' },
        { id: 'NIR_reflectance', label: 'NIR Reflectance' }
      ]
    }
  };
  
  // Helper para pegar atributos de forma segura (case insensitive fallback)
  export const getAttributesForCollection = (collectionId) => {
    if (!collectionId) return [];
    // Tenta match exato
    if (SATELLITE_CONFIG[collectionId]) return SATELLITE_CONFIG[collectionId].attributes;
    
    // Tenta match case-insensitive (ex: mod13q1 vs MOD13Q1)
    const key = Object.keys(SATELLITE_CONFIG).find(k => k.toLowerCase() === collectionId.toLowerCase());
    return key ? SATELLITE_CONFIG[key].attributes : [];
  };