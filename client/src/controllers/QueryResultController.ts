import { Request, Response } from "express";
import { QueryResult } from "../models";

class QueryResultController {
  // Salvar resultado de consulta
  public async create(req: Request, res: Response): Promise<Response> {
    const {
      satelliteName,
      variable,
      acquisitionDate,
      dataUrl,
      thumbnailUrl,
      metadata,
    } = req.body;

    try {
      const document = new QueryResult({
        satelliteName,
        variable,
        acquisitionDate,
        dataUrl,
        thumbnailUrl,
        metadata,
      });

      const resp = await document.save();
      return res.json(resp);
    } catch (error: any) {
      if (error.errors && error.errors["satelliteName"]) {
        return res.json({ message: error.errors["satelliteName"].message });
      } else if (error.errors && error.errors["variable"]) {
        return res.json({ message: error.errors["variable"].message });
      }
      return res.json({ message: error.message });
    }
  }

  // Listar todos os resultados
  public async list(_: Request, res: Response): Promise<Response> {
    try {
      const results = await QueryResult.find()
        .sort({ acquisitionDate: -1 })
        .select("satelliteName variable acquisitionDate thumbnailUrl");
      return res.json(results);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Buscar resultados por satélite
  public async findBySatellite(req: Request, res: Response): Promise<Response> {
    const { satellite } = req.params;

    try {
      const results = await QueryResult.find({
        satelliteName: satellite,
      }).sort({ acquisitionDate: -1 });

      return res.json(results);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Buscar resultados por data
  public async findByDateRange(req: Request, res: Response): Promise<Response> {
    const { startDate, endDate } = req.body;

    try {
      const results = await QueryResult.find({
        acquisitionDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      }).sort({ acquisitionDate: 1 });

      return res.json(results);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Buscar resultado por ID
  public async findById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const result = await QueryResult.findById(id);
      if (result) {
        return res.json(result);
      } else {
        return res.json({ message: "Resultado não encontrado" });
      }
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Deletar resultado
  public async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const result = await QueryResult.findByIdAndDelete(id);
      if (result) {
        return res.json({ message: "Resultado removido com sucesso" });
      } else {
        return res.json({ message: "Resultado não encontrado" });
      }
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }
}

export default new QueryResultController();
