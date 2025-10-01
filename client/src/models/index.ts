import mongoose from "mongoose";
const { Schema } = mongoose;

// Satélite
const SatelliteSchema = new Schema({
  name: {
    type: String,
    required: [true, "Nome do satélite"],
    unique: true,
  },
  mission: {
    type: String,
    required: true
  },
  spatialResolutions: [{
    value: { type: Number, required: true }, // Ex: 10, 30, 250 (metros)
    unit: { type: String, default: "m" },
    description: String
  }],
  temporalResolution: {
    value: { type: Number, required: true }, // Dias para revisita
    unit: { type: String, default: "days" }
  },
  availableVariables: [{
    acronym: { type: String, required: true }, // Acronym = Sigla Ex: "NDVI"
    fullName: { type: String, required: true }, // Nome completo
    description: String,
    dataType: { type: String, enum: ["temperature", "moisture", "reflectance"] }, // Add os tipos de dados disponiveis pelos satelites
    minValue: Number,
    maxValue: Number
  }],
  dataSource: {
    name: String, // Ex: "INPE"
    url: String,
    accessType: { type: String, enum: ["open"] }
  },
}, {
  timestamps: true
});

// Ponto de Interesse (User Query)
const PointOfInterestSchema = new Schema({
  coordinates: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  selectedSatellites: [String]
}, {
  timestamps: true
});

// Resultado da Consulta
const QueryResultSchema = new Schema({
  satelliteName: {
    type: String,
    required: true
  },
  variable: {
    type: String,
    required: true
  },
  acquisitionDate: Date, 
  dataUrl: String, // Link para download/visualização
  thumbnailUrl: String, // Preview da imagem
  metadata: Schema.Types.Mixed // Metadados flexíveis
}, {
  timestamps: true
});

// Comparação de Dados
const DataComparisonSchema = new Schema({
  comparisons: [{
    satellite: { type: String, required: true },
    variable: { type: String, required: true },
    timeSeries: [{
      date: { type: Date, required: true },
      value: { type: Number, required: true }
    }],
    color: { type: String, default: "#000000" } // Cor do gráfico
  }],
  timeRange: {
    startDate: Date,
    endDate: Date
  }
}, {
  timestamps: true
});

const Satellite = mongoose.model("Satellite", SatelliteSchema);
const PointOfInterest = mongoose.model("PointOfInterest", PointOfInterestSchema);
const QueryResult = mongoose.model("QueryResult", QueryResultSchema);
const DataComparison = mongoose.model("DataComparison", DataComparisonSchema);

export { 
  Satellite, 
  PointOfInterest, 
  QueryResult, 
  DataComparison
};