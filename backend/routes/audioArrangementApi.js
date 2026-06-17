const {
  createArrangementPlan,
  validateArrangementPlan
} = require("../services/audioArrangementPlanner");

function createAudioArrangementApiRouter(express) {
  const router = express.Router();

  router.post("/audio-arrangement/plan", (req, res) => {
    try {
      const plan = createArrangementPlan(req.body || {});

      return res.status(201).json({
        ok: true,
        data: plan
      });
    } catch (error) {
      return res.status(400).json({
        ok: false,
        error: {
          code: "INVALID_ARRANGEMENT_INPUT",
          message:
            error instanceof Error
              ? error.message
              : "Unable to create arrangement plan."
        }
      });
    }
  });

  router.post("/audio-arrangement/validate", (req, res) => {
    const valid = validateArrangementPlan(
      req.body && req.body.plan
    );

    return res.status(valid ? 200 : 400).json({
      ok: valid,
      data: {
        valid
      }
    });
  });

  return router;
}

module.exports = {
  createAudioArrangementApiRouter
};
