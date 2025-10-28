import { Request, Response } from "express";
import { Satellite } from "../models";

class SatelliteController {
  // - Adicionar novo satélite ao catálogo
  public async create(req: Request, res: Response): Promise<Response> {
    const {
      name,
      mission,
      spatialResolutions,
      temporalResolution,
      availableVariables,
      dataSource,
    } = req.body;

    try {
      const document = new Satellite({
        name,
        mission,
        spatialResolutions,
        temporalResolution,
        availableVariables,
        dataSource,
      });

      const resp = await document.save();
      return res.json(resp);
    } catch (error: any) {
      if (error.code === 11000 || error.code === 11001) {
        return res.json({ message: "Este nome de satélite já está em uso" });
      } else if (error.errors && error.errors["name"]) {
        return res.json({ message: error.errors["name"].message });
      } else if (error.errors && error.errors["mission"]) {
        return res.json({ message: error.errors["mission"].message });
      }
      return res.json({ message: error.message });
    }
  }

  // - Listar todos os satélites
  public async list(_: Request, res: Response): Promise<Response> {
    try {
      const satellites = await Satellite.find().sort({ name: "asc" });
      return res.json(satellites);
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // - Buscar satélite por ID
  public async findById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const satellite = await Satellite.findById(id);
      if (satellite) {
        return res.json(satellite);
      } else {
        return res.json({ message: "Satélite não encontrado" });
      }
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }

  // - Atualizar satélite
  public async update(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const {
      name,
      mission,
      spatialResolutions,
      temporalResolution,
      availableVariables,
      dataSource,
    } = req.body;

    try {
      const document = await Satellite.findById(id);
      if (!document) {
        return res.json({ message: "Satélite não encontrado" });
      }

      // - Atualiza os campos
      document.name = name;
      document.mission = mission;
      document.spatialResolutions = spatialResolutions;
      document.temporalResolution = temporalResolution;
      document.availableVariables = availableVariables;
      document.dataSource = dataSource;

      const resp = await document.save();
      return res.json(resp);
    } catch (error: any) {
      if (error.code === 11000 || error.code === 11001) {
        return res.json({ message: "Este nome de satélite já está em uso" });
      } else if (error.errors && error.errors["name"]) {
        return res.json({ message: error.errors["name"].message });
      }
      return res.json({ message: error.message });
    }
  }

  // - Remover satélite
  public async delete(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const satellite = await Satellite.findByIdAndDelete(id);
      if (satellite) {
        return res.json({ message: "Satélite removido com sucesso" });
      } else {
        return res.json({ message: "Satélite não encontrado" });
      }
    } catch (error: any) {
      return res.json({ message: error.message });
    }
  }
}

export default new SatelliteController();
