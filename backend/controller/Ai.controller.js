import * as ai from "../services/ai.service.js";

export const generateResult = async (req, res) => {
    try {
        const { prompt } = req.query;
    
        const result = await ai.generateResult(prompt);
        // res  .send(result);
        res.status(200).json({ result });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
    };
