import { Request, Response } from "express";
import { PointOfInterest } from "../models";

class PointOfInterestController {
  // Criar nova consulta (ponto de interesse)
  public async create(req: Request, res: Response): Promise<Response> {
    const { coordinates, dateRange, selectedSatellites } = req.body;

    try {
      const document = new PointOfInterest({
        coordinates,
        dateRange,
        selectedSatellites,
      });
      const resp = await document.save();
      return res.json(resp);
    } catch (error: any) {
      if (error.errors && error.errors["coordinates.latitude"]) {
        return res.json({
          message: error.errors["coordinates.latitude"].message,
        });
      } else if (error.errors && error.errors["coordinates.longitude"]) {
        return res.json({
          message: error.errors["coordinates.longitude"].message,
        });
      } else if (error.errors && error.errors["dateRange.startDate"]) {
        return res.json({
          message: error.errors["dateRange.startDate"].message,
        });
      } else if (error.errors && error.errors["dateRange.endDate"]) {
        return res.json({ message: error.errors["dateRange.endDate"].message });
      }
      return res.json({ message: error.message });
    }
  }

  // Listar todas as consultas
  public async list(_: Request, res: Response): Promise<Response> {
    try {
      const points = await PointOfInterest.find().sort({ createdAt: -1 }); // Mais recentes primeiro
      return res.json(points);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Buscar consulta por ID
  public async findById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const point = await PointOfInterest.findById(id);
      if (point) {
        return res.json(point);
      } else {
        return res.json({ message: "Consulta não encontrada" });
      }
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Buscar consultas por coordenadas aproximadas
  public async findByLocation(req: Request, res: Response): Promise<Response> {
    const { lat, lng, radius = 10 } = req.query; // radius em km

    try {
      const points = await PointOfInterest.find({
        "coordinates.latitude": {
          $gte: Number(lat) - 0.1, // Aproximação simples
          $lte: Number(lat) + 0.1,
        },
        "coordinates.longitude": {
          $gte: Number(lng) - 0.1,
          $lte: Number(lng) + 0.1,
        },
      });

      return res.json(points);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Remover consulta
  public async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const point = await PointOfInterest.findByIdAndDelete(id);
      if (point) {
        return res.json({ message: "Consulta removida com sucesso" });
      } else {
        return res.json({ message: "Consulta não encontrada" });
      }
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }
}

export default new PointOfInterestController();
