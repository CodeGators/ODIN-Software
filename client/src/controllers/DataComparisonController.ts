import { Request, Response } from "express";
import { DataComparison } from "../models";

class DataComparisonController {
  // Criar nova comparação
  public async create(req: Request, res: Response): Promise<Response> {
    const { comparisons, timeRange } = req.body;

    try {
      const document = new DataComparison({
        comparisons,
        timeRange,
      });

      const resp = await document.save();
      return res.json(resp);
    } catch (error: any) {
      if (error.errors && error.errors["comparisons"]) {
        return res.json({ message: error.errors["comparisons"].message });
      }
      return res.json({ message: error.message });
    }
  }

  // Listar todas as comparações
  public async list(_: Request, res: Response): Promise<Response> {
    try {
      const comparisons = await DataComparison.find().sort({ createdAt: -1 });
      return res.json(comparisons);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Buscar comparação por ID
  public async findById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const comparison = await DataComparison.findById(id);
      if (comparison) {
        return res.json(comparison);
      } else {
        return res.json({ message: "Comparação não encontrada" });
      }
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Buscar comparações por satélite
  public async findBySatellite(req: Request, res: Response): Promise<Response> {
    const { satellite } = req.params;

    try {
      const comparisons = await DataComparison.find({
        "comparisons.satellite": satellite,
      });

      return res.json(comparisons);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Buscar comparações por variável
  public async findByVariable(req: Request, res: Response): Promise<Response> {
    const { variable } = req.params;

    try {
      const comparisons = await DataComparison.find({
        "comparisons.variable": variable,
      });

      return res.json(comparisons);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Adicionar série temporal a comparação existente
  public async addTimeSeries(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const { satellite, variable, timeSeries, color } = req.body;

    try {
      const comparison = await DataComparison.findById(id);
      if (!comparison) {
        return res.json({ message: "Comparação não encontrada" });
      }

      comparison.comparisons.push({
        satellite,
        variable,
        timeSeries,
        color: color || "#000000",
      });

      const resp = await comparison.save();
      return res.json(resp);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // Deletar comparação
  public async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const comparison = await DataComparison.findByIdAndDelete(id);
      if (comparison) {
        return res.json({ message: "Comparação removida com sucesso" });
      } else {
        return res.json({ message: "Comparação não encontrada" });
      }
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }
}

export default new DataComparisonController();
